-- Phase 5: moderation, admin tooling, and marketplace anonymity hardening
-- (PRD ADM-2/ADM-3, POST-3, SUB-5, DSH-4; PR #6 hardening note).

-- ---------------------------------------------------------------------------
-- Content reports (POST-3)
-- ---------------------------------------------------------------------------
create type report_status as enum ('open', 'resolved', 'dismissed');

create table content_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  reporter_id uuid not null references user_profiles (id) on delete cascade,
  reason text not null,
  status report_status not null default 'open',
  resolved_by uuid references user_profiles (id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table content_reports enable row level security;

create policy "user reports content" on content_reports for insert
  with check (reporter_id = auth.uid());
create policy "admin reads reports" on content_reports for select
  using (is_platform_admin());
create policy "admin resolves reports" on content_reports for update
  using (is_platform_admin());

create index idx_reports_open on content_reports (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Admin RPCs (ADM-2 / SUB-5) — audit-logged, admin-only
-- ---------------------------------------------------------------------------
create or replace function admin_set_org_suspension(
  p_org_id uuid,
  p_suspend boolean,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_platform_admin() then
    raise exception 'not authorized';
  end if;

  update organizations
     set admin_suspended = p_suspend,
         suspension_reason = case when p_suspend then p_reason else null end,
         updated_at = now()
   where id = p_org_id;

  insert into audit_log (actor_id, actor_type, action, entity_type, entity_id, reason)
  values (auth.uid(), 'admin',
          case when p_suspend then 'org.suspended' else 'org.unsuspended' end,
          'organization', p_org_id::text, p_reason);
end;
$$;

revoke execute on function admin_set_org_suspension(uuid, boolean, text) from public, anon;
grant execute on function admin_set_org_suspension(uuid, boolean, text) to authenticated;

-- Complimentary subscription management until Stripe billing ships (SUB-5).
create or replace function admin_grant_subscription(p_email text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid;
begin
  if not is_platform_admin() then
    raise exception 'not authorized';
  end if;

  select id into v_user from auth.users where email = lower(p_email);
  if v_user is null then
    raise exception 'no account found for %', p_email;
  end if;

  insert into subscriptions (user_id, plan_id, stripe_customer_id, stripe_subscription_id, status, current_period_end)
  values (v_user, 'buyer_pro_monthly', 'comp:' || v_user, 'comp:' || v_user, 'active', now() + interval '1 year')
  on conflict (stripe_subscription_id) do update set
    status = 'active',
    current_period_end = now() + interval '1 year',
    updated_at = now();

  insert into audit_log (actor_id, actor_type, action, entity_type, entity_id)
  values (auth.uid(), 'admin', 'subscription.comp.granted', 'subscription', v_user::text);
end;
$$;

create or replace function admin_revoke_subscription(p_email text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid;
begin
  if not is_platform_admin() then
    raise exception 'not authorized';
  end if;

  select id into v_user from auth.users where email = lower(p_email);
  if v_user is null then
    raise exception 'no account found for %', p_email;
  end if;

  update subscriptions
     set status = 'canceled', cancel_at_period_end = true, updated_at = now()
   where user_id = v_user;

  insert into audit_log (actor_id, actor_type, action, entity_type, entity_id)
  values (auth.uid(), 'admin', 'subscription.revoked', 'subscription', v_user::text);
end;
$$;

revoke execute on function admin_grant_subscription(text) from public, anon;
grant execute on function admin_grant_subscription(text) to authenticated;
revoke execute on function admin_revoke_subscription(text) from public, anon;
grant execute on function admin_revoke_subscription(text) to authenticated;

-- Admin overview of subscriptions with account emails (auth schema is not
-- API-exposed, so emails must come through a definer function).
create or replace function admin_list_subscriptions()
returns table (email text, plan_id text, status subscription_status, current_period_end timestamptz)
language sql
stable
security definer
set search_path = public, auth
as $$
  select u.email::text, s.plan_id, s.status, s.current_period_end
  from subscriptions s join auth.users u on u.id = s.user_id
  where is_platform_admin()
  order by s.created_at desc
$$;

revoke execute on function admin_list_subscriptions() from public, anon;
grant execute on function admin_list_subscriptions() to authenticated;

-- ---------------------------------------------------------------------------
-- Marketplace anonymity hardening: the public teaser column grant no longer
-- includes org_id, so listings cannot be linked to organizations through the
-- REST API by any client role. Owners fetch their own listings via RPC.
-- ---------------------------------------------------------------------------
revoke select on marketplace_listings from anon, authenticated;
grant select (id, listing_type, status, teaser_headline, sector, region,
              size_band, teaser_summary, attestation_accepted_at, created_at,
              updated_at)
  on marketplace_listings to anon, authenticated;

create or replace function get_my_listings()
returns table (
  id uuid,
  listing_type listing_type,
  status listing_status,
  teaser_headline text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select l.id, l.listing_type, l.status, l.teaser_headline, l.created_at
  from marketplace_listings l
  where is_org_member(l.org_id, 'owner')
  order by l.created_at desc
$$;

revoke execute on function get_my_listings() from public, anon;
grant execute on function get_my_listings() to authenticated;
