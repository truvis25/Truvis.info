-- Truvis.info initial schema (draft — Phase 0)
-- Source of truth for the data model described in docs/ARCHITECTURE.md §3.
-- Applied via Supabase CLI: supabase db push / migration up.
--
-- Conventions:
--  * RLS is enabled on every table, deny-by-default; public reads only through
--    policies embedding the visibility rule.
--  * compliance_status is written exclusively by the service role (sync jobs).
--  * audit_log is append-only.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type org_role as enum ('owner', 'admin', 'member');
create type compliance_state as enum ('compliant', 'non_compliant', 'under_review', 'lapsed');
create type risk_level as enum ('low', 'medium', 'high');
create type content_status as enum ('draft', 'published', 'archived');
create type event_status as enum ('draft', 'published', 'cancelled', 'completed');
create type approval_mode as enum ('auto', 'manual');
create type registration_status as enum ('pending', 'approved', 'rejected', 'waitlisted', 'cancelled');
create type listing_type as enum ('fundraise', 'equity_sale', 'business_sale');
create type listing_status as enum ('draft', 'active', 'paused', 'closed');
create type application_status as enum ('pending', 'approved', 'rejected', 'withdrawn');
create type subscription_status as enum ('active', 'trialing', 'past_due', 'canceled', 'incomplete');

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
create table user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  compliance_subject text unique,          -- OIDC `sub` from compliance.truvis.tech
  platform_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Organizations & compliance cache
-- ---------------------------------------------------------------------------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  compliance_org_id text not null unique,  -- id on compliance.truvis.tech
  -- Verified fields (ingested from publication grant; read-only in app)
  legal_name text not null,
  trade_license_no text,
  jurisdiction text,
  incorporation_year int,
  industry_code text,
  size_band text,
  contact_person jsonb,                    -- {name,title,email,phone,consent_recorded_at}
  authorized_fields text[] not null default '{}',
  -- Marketing fields (org-editable)
  tagline text,
  description text,
  logo_url text,
  cover_url text,
  website text,
  social_links jsonb not null default '{}',
  -- Visibility inputs
  grant_active boolean not null default false,
  admin_suspended boolean not null default false,
  suspension_reason text,
  -- Derived (maintained by trigger; see recompute_org_visibility)
  is_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table compliance_status (
  org_id uuid primary key references organizations (id) on delete cascade,
  state compliance_state not null,
  risk_level risk_level not null,
  score int not null check (score between 0 and 100),
  renewal_expiry date,
  checked_at timestamptz not null,
  synced_at timestamptz not null default now(),
  raw_payload jsonb
);

create table org_members (
  org_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references user_profiles (id) on delete cascade,
  role org_role not null default 'member',
  can_manage_content boolean not null default true,
  can_manage_events boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create table org_follows (
  org_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references user_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Catalog & posts
-- ---------------------------------------------------------------------------
create table catalog_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  slug text not null,
  name text not null,
  item_type text not null check (item_type in ('product', 'service')),
  category text,
  description text,
  specs jsonb not null default '{}',
  price_indication text,
  status content_status not null default 'draft',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, slug)
);

create table catalog_media (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references catalog_items (id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video_url', 'pdf')),
  storage_path text,                       -- for image/pdf (public-media bucket)
  external_url text,                       -- for video_url
  alt_text text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  title text not null,
  body jsonb not null,                     -- rich-text document
  status content_status not null default 'draft',
  published_at timestamptz,
  created_by uuid references user_profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------
create table events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  slug text not null unique,
  title text not null,
  description text,
  banner_url text,
  venue_address text,
  online_url text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'Asia/Dubai',
  capacity int,
  registration_deadline timestamptz,
  approval_mode approval_mode not null default 'manual',
  registration_questions jsonb not null default '[]',
  status event_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  user_id uuid not null references user_profiles (id) on delete cascade,
  status registration_status not null default 'pending',
  answers jsonb not null default '{}',
  decided_by uuid references user_profiles (id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Marketplace
-- ---------------------------------------------------------------------------
create table marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  listing_type listing_type not null,
  status listing_status not null default 'draft',
  -- Teaser fields (public)
  teaser_headline text not null,
  sector text,
  region text,
  size_band text,
  teaser_summary text,
  -- Detail fields (subscriber + approved application only; enforced via RLS)
  detail_memorandum jsonb,
  amount_sought numeric,
  equity_percent numeric check (equity_percent is null or (equity_percent > 0 and equity_percent <= 100)),
  financial_snapshot jsonb,                -- self-declared: revenue band, employees, profitability, year
  attestation_accepted_at timestamptz,     -- org attests accuracy (MKT-7)
  created_by uuid references user_profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table listing_applications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references marketplace_listings (id) on delete cascade,
  applicant_id uuid not null references user_profiles (id) on delete cascade,
  status application_status not null default 'pending',
  intro_message text,
  confidentiality_accepted_at timestamptz not null,
  decided_by uuid references user_profiles (id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (listing_id, applicant_id)
);

create table listing_messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references listing_applications (id) on delete cascade,
  sender_id uuid not null references user_profiles (id),
  body text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Subscriptions
-- ---------------------------------------------------------------------------
create table subscription_plans (
  id text primary key,                     -- e.g. 'buyer_pro_monthly'
  name text not null,
  stripe_price_id text not null,
  interval text not null check (interval in ('month', 'year')),
  active boolean not null default true
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles (id) on delete cascade,
  plan_id text not null references subscription_plans (id),
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  status subscription_status not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Audit log (append-only)
-- ---------------------------------------------------------------------------
create table audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,                           -- null = system/sync
  actor_type text not null check (actor_type in ('user', 'admin', 'system')),
  action text not null,                    -- e.g. 'org.visibility.hidden'
  entity_type text not null,
  entity_id text not null,
  reason text,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Visibility derivation (ARCHITECTURE.md §3 — single source of truth)
-- ---------------------------------------------------------------------------
create or replace function compute_org_visibility(p_org_id uuid)
returns boolean
language sql
stable
as $$
  select o.grant_active
     and not o.admin_suspended
     and cs.state = 'compliant'
     and cs.risk_level <> 'high'
     and cs.score >= 40                    -- threshold: pending PRD Q1
     and (cs.renewal_expiry is null or cs.renewal_expiry > current_date)
     and cs.synced_at > now() - interval '72 hours'
  from organizations o
  left join compliance_status cs on cs.org_id = o.id
  where o.id = p_org_id
$$;

create or replace function recompute_org_visibility()
returns trigger
language plpgsql
security definer
as $$
declare
  v_org_id uuid;
  v_new boolean;
  v_old boolean;
begin
  if tg_table_name = 'organizations' then
    v_org_id := coalesce(new.id, old.id);
  else
    v_org_id := coalesce(new.org_id, old.org_id);
  end if;
  select is_visible into v_old from organizations where id = v_org_id;
  v_new := coalesce(compute_org_visibility(v_org_id), false);
  if v_new is distinct from v_old then
    update organizations set is_visible = v_new, updated_at = now() where id = v_org_id;
    insert into audit_log (actor_type, action, entity_type, entity_id, reason)
    values ('system',
            case when v_new then 'org.visibility.shown' else 'org.visibility.hidden' end,
            'organization', v_org_id::text, tg_op || ' on ' || tg_table_name);
  end if;
  return coalesce(new, old);
end;
$$;

create trigger trg_visibility_on_status
after insert or update or delete on compliance_status
for each row execute function recompute_org_visibility();

create trigger trg_visibility_on_org
after update of grant_active, admin_suspended on organizations
for each row execute function recompute_org_visibility();

-- Staleness (BR-5) is enforced by the cron poller calling
-- select recompute_all_visibility(); on schedule.
create or replace function recompute_all_visibility()
returns void
language plpgsql
security definer
as $$
declare r record;
begin
  for r in select id from organizations loop
    update organizations
       set is_visible = coalesce(compute_org_visibility(r.id), false),
           updated_at = now()
     where id = r.id
       and is_visible is distinct from coalesce(compute_org_visibility(r.id), false);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security (deny-by-default; policies are the ONLY read/write paths)
-- ---------------------------------------------------------------------------
alter table user_profiles enable row level security;
alter table organizations enable row level security;
alter table compliance_status enable row level security;
alter table org_members enable row level security;
alter table org_follows enable row level security;
alter table catalog_items enable row level security;
alter table catalog_media enable row level security;
alter table posts enable row level security;
alter table events enable row level security;
alter table event_registrations enable row level security;
alter table marketplace_listings enable row level security;
alter table listing_applications enable row level security;
alter table listing_messages enable row level security;
alter table subscription_plans enable row level security;
alter table subscriptions enable row level security;
alter table audit_log enable row level security;

-- Helpers
create or replace function is_org_member(p_org_id uuid, p_min_role org_role default 'member')
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from org_members m
    where m.org_id = p_org_id and m.user_id = auth.uid()
      and (p_min_role = 'member'
           or (p_min_role = 'admin' and m.role in ('admin', 'owner'))
           or (p_min_role = 'owner' and m.role = 'owner'))
  )
$$;

create or replace function is_platform_admin()
returns boolean language sql stable security definer as $$
  select coalesce((select platform_admin from user_profiles where id = auth.uid()), false)
$$;

create or replace function has_active_subscription()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from subscriptions s
    where s.user_id = auth.uid()
      and (s.status in ('active', 'trialing')
           or (s.status = 'past_due'
               and s.current_period_end > now() - interval '7 days'))
  )
$$;

-- user_profiles
create policy "own profile read" on user_profiles for select using (id = auth.uid() or is_platform_admin());
create policy "own profile update" on user_profiles for update using (id = auth.uid());
create policy "own profile insert" on user_profiles for insert with check (id = auth.uid());

-- organizations: public sees visible orgs; members/admins see their own
create policy "public read visible orgs" on organizations for select
  using (is_visible or is_org_member(id) or is_platform_admin());
create policy "org admins update marketing fields" on organizations for update
  using (is_org_member(id, 'admin') or is_platform_admin());
-- inserts/verified-field updates happen via service role (sync/claim server actions)

-- compliance_status: org members may see their own standing; otherwise service-role only
create policy "org reads own standing" on compliance_status for select
  using (is_org_member(org_id) or is_platform_admin());

-- org_members
create policy "members read own org membership" on org_members for select
  using (user_id = auth.uid() or is_org_member(org_id, 'admin') or is_platform_admin());
create policy "owner manages members" on org_members for all
  using (is_org_member(org_id, 'owner') or is_platform_admin());

-- org_follows
create policy "follows readable by owner" on org_follows for select
  using (user_id = auth.uid() or is_org_member(org_id, 'admin'));
create policy "user manages own follows" on org_follows for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- catalog: public sees published items of visible orgs
create policy "public read catalog" on catalog_items for select
  using ((status = 'published'
          and exists (select 1 from organizations o where o.id = org_id and o.is_visible))
         or is_org_member(org_id) or is_platform_admin());
create policy "org manages catalog" on catalog_items for all
  using (is_org_member(org_id) or is_platform_admin());
create policy "public read catalog media" on catalog_media for select
  using (exists (select 1 from catalog_items ci where ci.id = item_id));
create policy "org manages catalog media" on catalog_media for all
  using (exists (select 1 from catalog_items ci
                 where ci.id = item_id and is_org_member(ci.org_id)));

-- posts
create policy "public read published posts" on posts for select
  using ((status = 'published'
          and exists (select 1 from organizations o where o.id = org_id and o.is_visible))
         or is_org_member(org_id) or is_platform_admin());
create policy "org manages posts" on posts for all
  using (is_org_member(org_id) or is_platform_admin());

-- events
create policy "public read published events" on events for select
  using ((status = 'published'
          and exists (select 1 from organizations o where o.id = org_id and o.is_visible))
         or is_org_member(org_id) or is_platform_admin());
create policy "org manages events" on events for all
  using (is_org_member(org_id) or is_platform_admin());

-- event_registrations
create policy "registrant or organizer reads" on event_registrations for select
  using (user_id = auth.uid()
         or exists (select 1 from events e where e.id = event_id and is_org_member(e.org_id))
         or is_platform_admin());
create policy "user registers self" on event_registrations for insert
  with check (user_id = auth.uid());
create policy "registrant cancels, organizer decides" on event_registrations for update
  using (user_id = auth.uid()
         or exists (select 1 from events e where e.id = event_id and is_org_member(e.org_id)));

-- marketplace: TEASER columns are safe for public; DETAIL access is enforced
-- in the app layer via a security-definer RPC / server-only queries, and by
-- column privileges below. Base policy exposes rows of active listings.
create policy "public read active listing rows" on marketplace_listings for select
  using ((status = 'active'
          and exists (select 1 from organizations o where o.id = org_id and o.is_visible))
         or is_org_member(org_id, 'owner') or is_platform_admin());
create policy "owner manages listings" on marketplace_listings for all
  using (is_org_member(org_id, 'owner') or is_platform_admin());
-- Column privileges: replace table-level SELECT with a teaser-only column grant
-- (a column-level REVOKE cannot mask a table-level GRANT in Postgres).
-- Detail columns (detail_memorandum, amount_sought, equity_percent,
-- financial_snapshot) are served exclusively server-side (service role) after
-- checking subscription + approved application — including for the owning org.
revoke select on marketplace_listings from anon, authenticated;
grant select (id, org_id, listing_type, status, teaser_headline, sector, region,
              size_band, teaser_summary, attestation_accepted_at, created_at,
              updated_at)
  on marketplace_listings to anon, authenticated;

create policy "applicant or owner reads applications" on listing_applications for select
  using (applicant_id = auth.uid()
         or exists (select 1 from marketplace_listings l
                    where l.id = listing_id and is_org_member(l.org_id, 'owner'))
         or is_platform_admin());
create policy "subscriber applies" on listing_applications for insert
  with check (applicant_id = auth.uid() and has_active_subscription());
create policy "owner decides applications" on listing_applications for update
  using (exists (select 1 from marketplace_listings l
                 where l.id = listing_id and is_org_member(l.org_id, 'owner'))
         or applicant_id = auth.uid());

create policy "thread participants read messages" on listing_messages for select
  using (exists (select 1 from listing_applications a
                 join marketplace_listings l on l.id = a.listing_id
                 where a.id = application_id
                   and (a.applicant_id = auth.uid() or is_org_member(l.org_id, 'owner'))));
create policy "approved participants write messages" on listing_messages for insert
  with check (sender_id = auth.uid()
              and exists (select 1 from listing_applications a
                          join marketplace_listings l on l.id = a.listing_id
                          where a.id = application_id and a.status = 'approved'
                            and (a.applicant_id = auth.uid() or is_org_member(l.org_id, 'owner'))));

-- subscriptions
create policy "plans are public" on subscription_plans for select using (true);
create policy "own subscription read" on subscriptions for select
  using (user_id = auth.uid() or is_platform_admin());
-- writes via service role (Stripe webhooks) only

-- audit_log: admin read; system insert via service role; never update/delete
create policy "admin reads audit log" on audit_log for select using (is_platform_admin());

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index idx_orgs_visible on organizations (is_visible) where is_visible;
create index idx_orgs_search on organizations
  using gin (to_tsvector('english', coalesce(legal_name, '') || ' ' || coalesce(description, '')));
create index idx_catalog_org on catalog_items (org_id, status);
create index idx_posts_org on posts (org_id, status, published_at desc);
create index idx_events_upcoming on events (starts_at) where status = 'published';
create index idx_registrations_event on event_registrations (event_id, status);
create index idx_listings_active on marketplace_listings (status, listing_type);
create index idx_applications_listing on listing_applications (listing_id, status);
create index idx_audit_entity on audit_log (entity_type, entity_id, created_at desc);
