-- Phase 1: auth wiring, claim flow, webhook idempotency.

-- ---------------------------------------------------------------------------
-- Auto-create a user_profiles row for every new auth user (AUTH-1)
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into user_profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Webhook idempotency store (ARCHITECTURE.md §5.3; service-role only)
-- ---------------------------------------------------------------------------
create table webhook_events (
  event_id text primary key,
  event_type text not null,
  payload jsonb,
  received_at timestamptz not null default now()
);
alter table webhook_events enable row level security;
-- no policies: only the service role touches this table

-- ---------------------------------------------------------------------------
-- Org claim flow (AUTH-3 / CMP-1): callable by an authenticated user whose
-- server action has fetched the publication grant + standing from the
-- compliance platform. SECURITY DEFINER so the caller needs no direct insert
-- rights on organizations / compliance_status.
--
-- Hardening note (Phase 5): once SUPABASE_SERVICE_ROLE_KEY is provisioned in
-- all environments, route claims exclusively through the service role and
-- drop authenticated EXECUTE on this function, so clients cannot invoke it
-- with a forged grant payload.
-- ---------------------------------------------------------------------------
create or replace function slugify(p_text text)
returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(lower(coalesce(p_text, '')), '[^a-z0-9]+', '-', 'g'))
$$;

create or replace function claim_organization(
  p_compliance_org_id text,
  p_grant jsonb,
  p_standing jsonb
)
returns table (org_id uuid, org_slug text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_org_id uuid;
  v_slug text;
  v_base_slug text;
  v_n int := 1;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;
  if p_grant is null or (p_grant ->> 'status') <> 'active' then
    raise exception 'no active publication grant';
  end if;

  select o.id into v_org_id from organizations o
  where o.compliance_org_id = p_compliance_org_id;

  if v_org_id is not null then
    if exists (select 1 from org_members m where m.org_id = v_org_id) then
      raise exception 'organization already claimed';
    end if;
  else
    v_base_slug := coalesce(nullif(slugify(p_grant #>> '{profile,legalName}'), ''), 'org');
    v_slug := v_base_slug;
    while exists (select 1 from organizations o where o.slug = v_slug) loop
      v_n := v_n + 1;
      v_slug := v_base_slug || '-' || v_n;
    end loop;

    insert into organizations (
      slug, compliance_org_id, legal_name, trade_license_no, jurisdiction,
      incorporation_year, industry_code, size_band, contact_person,
      authorized_fields, grant_active
    ) values (
      v_slug,
      p_compliance_org_id,
      coalesce(p_grant #>> '{profile,legalName}', 'Unnamed Organization'),
      p_grant #>> '{profile,tradeLicenseNo}',
      p_grant #>> '{profile,jurisdiction}',
      (p_grant #>> '{profile,incorporationYear}')::int,
      p_grant #>> '{profile,industryCode}',
      p_grant #>> '{profile,sizeBand}',
      p_grant #> '{profile,contactPerson}',
      coalesce(array(select jsonb_array_elements_text(p_grant -> 'authorizedFields')), '{}'),
      true
    )
    returning id into v_org_id;
  end if;

  insert into org_members (org_id, user_id, role) values (v_org_id, v_user, 'owner');

  if p_standing is not null then
    insert into compliance_status (org_id, state, risk_level, score, renewal_expiry, checked_at, synced_at, raw_payload)
    values (
      v_org_id,
      (p_standing ->> 'state')::compliance_state,
      (p_standing ->> 'riskLevel')::risk_level,
      (p_standing ->> 'score')::int,
      (p_standing ->> 'renewalExpiry')::date,
      coalesce((p_standing ->> 'checkedAt')::timestamptz, now()),
      now(),
      p_standing
    )
    on conflict (org_id) do update set
      state = excluded.state,
      risk_level = excluded.risk_level,
      score = excluded.score,
      renewal_expiry = excluded.renewal_expiry,
      checked_at = excluded.checked_at,
      synced_at = excluded.synced_at,
      raw_payload = excluded.raw_payload;
  end if;

  insert into audit_log (actor_id, actor_type, action, entity_type, entity_id, payload)
  values (v_user, 'user', 'org.claimed', 'organization', v_org_id::text,
          jsonb_build_object('compliance_org_id', p_compliance_org_id));

  return query select v_org_id, (select o.slug from organizations o where o.id = v_org_id);
end;
$$;

revoke execute on function claim_organization(text, jsonb, jsonb) from public, anon;
grant execute on function claim_organization(text, jsonb, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Standing ingestion used by webhook + cron (service role) — one code path
-- shared with claim_organization's upsert semantics.
-- ---------------------------------------------------------------------------
create or replace function ingest_standing(p_compliance_org_id text, p_standing jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  select id into v_org_id from organizations where compliance_org_id = p_compliance_org_id;
  if v_org_id is null then
    return; -- org not on this platform yet
  end if;

  insert into compliance_status (org_id, state, risk_level, score, renewal_expiry, checked_at, synced_at, raw_payload)
  values (
    v_org_id,
    (p_standing ->> 'state')::compliance_state,
    (p_standing ->> 'riskLevel')::risk_level,
    (p_standing ->> 'score')::int,
    (p_standing ->> 'renewalExpiry')::date,
    coalesce((p_standing ->> 'checkedAt')::timestamptz, now()),
    now(),
    p_standing
  )
  on conflict (org_id) do update set
    state = excluded.state,
    risk_level = excluded.risk_level,
    score = excluded.score,
    renewal_expiry = excluded.renewal_expiry,
    checked_at = excluded.checked_at,
    synced_at = excluded.synced_at,
    raw_payload = excluded.raw_payload;
end;
$$;

revoke execute on function ingest_standing(text, jsonb) from public, anon, authenticated;
