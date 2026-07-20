-- Luma (lu.ma) two-way integration: org events can opt into publication on
-- the central Truvis Luma calendar (push), and events created directly on
-- that calendar are mirrored locally as community events (pull). Pulled rows
-- have no owning org (org_id nullable) and never accept in-platform
-- registration — the trigger below hard-stops it at the database layer.

-- Pulled Luma events have no owning org.
alter table events alter column org_id drop not null;

alter table events
  add column external_source text check (external_source in ('luma')),
  add column luma_event_id text,
  add column luma_event_url text,
  add column luma_publish boolean not null default false,
  add column luma_synced_at timestamptz,
  add column luma_sync_status text check (luma_sync_status in ('pending', 'synced', 'failed')),
  add column luma_sync_error text;

-- Every event is either org-owned (push side) or Luma-sourced (pull side).
alter table events add constraint events_owner_or_source
  check ((org_id is not null and external_source is null)
      or (org_id is null and external_source = 'luma'));

-- Dedupe + upsert target for the sync cron (covers pushed AND pulled rows).
-- Full (non-partial) unique index: NULLs are distinct so org events are
-- unaffected, and PostgREST upsert can target it with ON CONFLICT.
create unique index idx_events_luma_event_id on events (luma_event_id);

-- Pulled rows fail the existing org-visibility policy (org_id is null), so
-- grant public read tightly scoped to published Luma rows. No new write
-- policy: the cron writes via the service role; "org manages events"
-- evaluates is_org_member(null) = false for everyone else.
create policy "public read luma events" on events for select
  using (external_source = 'luma' and status = 'published');

-- Registration guard: block in-platform registration for Luma-sourced
-- events (their registration lives on lu.ma), on top of the 0005 rules.
create or replace function guard_event_registration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
  v_approved int;
begin
  select * into v_event from events where id = new.event_id;
  if v_event.id is null then
    raise exception 'event not found';
  end if;
  if v_event.external_source is not null then
    raise exception 'registration for this event is handled on lu.ma';
  end if;
  if v_event.status <> 'published' then
    raise exception 'registration is closed for this event';
  end if;
  if v_event.starts_at <= now() then
    raise exception 'this event has already started';
  end if;
  if v_event.registration_deadline is not null and v_event.registration_deadline <= now() then
    raise exception 'the registration deadline has passed';
  end if;

  if v_event.approval_mode = 'auto' then
    if v_event.capacity is not null then
      select count(*) into v_approved
      from event_registrations
      where event_id = new.event_id and status = 'approved';
      if v_approved >= v_event.capacity then
        raise exception 'this event is fully booked';
      end if;
    end if;
    new.status := 'approved';
  else
    new.status := 'pending';
  end if;

  new.decided_by := null;
  new.decided_at := null;
  return new;
end;
$$;

-- Admin KPIs: track the community-calendar share of events.
create or replace function admin_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not is_platform_admin() then
    raise exception 'not authorized';
  end if;

  return jsonb_build_object(
    'users', (select count(*) from auth.users),
    'orgs_total', (select count(*) from organizations),
    'orgs_visible', (select count(*) from organizations where is_visible),
    'follows', (select count(*) from org_follows),
    'catalog_items_published', (select count(*) from catalog_items where status = 'published'),
    'posts_published', (select count(*) from posts where status = 'published'),
    'events_published', (select count(*) from events where status = 'published'),
    'events_luma', (select count(*) from events where external_source = 'luma'),
    'event_registrations', (select count(*) from event_registrations where status <> 'cancelled'),
    'listings_active', (select count(*) from marketplace_listings where status = 'active'),
    'listing_applications', (select count(*) from listing_applications),
    'subscriptions_active', (select count(*) from subscriptions
                              where status = 'active'
                                 or (status = 'trialing' and current_period_end > now())),
    'reports_open', (select count(*) from content_reports where status = 'open'),
    'reviews_published', (select count(*) from org_reviews where status = 'published')
  );
end;
$$;
