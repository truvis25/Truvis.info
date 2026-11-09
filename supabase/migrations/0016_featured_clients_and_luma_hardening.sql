-- Publish the two user-approved client profiles in the same organizations
-- table that powers /directory, and add a stable correlation slug for
-- race-free Truvis -> Luma -> webhook round trips.

alter table events add column luma_slug text;

alter table events add constraint events_luma_slug_length
  check (luma_slug is null or char_length(luma_slug) between 3 and 50);

create unique index idx_events_luma_slug
  on events (luma_slug)
  where luma_slug is not null;

insert into organizations (
  slug,
  compliance_org_id,
  legal_name,
  jurisdiction,
  incorporation_year,
  industry_code,
  size_band,
  authorized_fields,
  grant_active,
  tagline,
  description
)
values
  (
    'oxy-technologies',
    'client-oxy-technologies',
    'OXY Technologies Ltd',
    'AE-AZ',
    null,
    'K.64',
    '11-50',
    array['legal_name', 'jurisdiction', 'industry_code', 'size_band'],
    true,
    'Intelligence for life and commerce',
    'An Abu Dhabi Global Market technology company building connected payment and commerce products for the UAE market.'
  ),
  (
    'kun-peng-technologies',
    'client-kun-peng-technologies',
    'KUN PENG TECHNOLOGIES - SOLE PROPRIETORSHIP L.L.C.',
    'AE-AZ',
    2022,
    'J.62',
    null,
    array['legal_name', 'jurisdiction', 'incorporation_year', 'industry_code'],
    true,
    'Technology, AI and business innovation',
    'An Abu Dhabi technology company working across software design, IT consultancy, artificial intelligence and financial-technology innovation.'
  )
on conflict (compliance_org_id) do update set
  slug = excluded.slug,
  legal_name = excluded.legal_name,
  jurisdiction = excluded.jurisdiction,
  incorporation_year = excluded.incorporation_year,
  industry_code = excluded.industry_code,
  size_band = excluded.size_band,
  authorized_fields = excluded.authorized_fields,
  grant_active = excluded.grant_active,
  tagline = excluded.tagline,
  description = excluded.description,
  updated_at = now();

with client_standing (compliance_org_id, score) as (
  values
    ('client-oxy-technologies'::text, 70),
    ('client-kun-peng-technologies'::text, 70)
)
insert into compliance_status (
  org_id,
  state,
  risk_level,
  score,
  renewal_expiry,
  checked_at,
  synced_at,
  raw_payload
)
select
  o.id,
  'compliant'::compliance_state,
  'low'::risk_level,
  s.score,
  null,
  now(),
  now(),
  jsonb_build_object(
    'source', 'manual_client_profile_review',
    'checkedAt', now(),
    'publicFieldsOnly', true
  )
from client_standing s
join organizations o on o.compliance_org_id = s.compliance_org_id
on conflict (org_id) do update set
  state = excluded.state,
  risk_level = excluded.risk_level,
  score = excluded.score,
  renewal_expiry = excluded.renewal_expiry,
  checked_at = excluded.checked_at,
  synced_at = excluded.synced_at,
  raw_payload = excluded.raw_payload;

-- Keep the original fixture for development/audit, but do not present an
-- obviously synthetic company as a live production directory profile.
update organizations
set admin_suspended = true,
    suspension_reason = 'Demo fixture hidden from the production directory',
    updated_at = now()
where compliance_org_id = 'org-demo-1';

-- Retain the historical rows without exposing the old mock calendar as real.
update events
set status = 'cancelled',
    luma_sync_status = 'failed',
    luma_sync_error = 'Production mock fixture retired',
    updated_at = now()
where external_source = 'luma'
  and luma_event_id like 'evt-mock-%';
