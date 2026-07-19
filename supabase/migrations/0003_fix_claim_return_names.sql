-- Fix: claim_organization's OUT column `org_id` was ambiguous with the
-- compliance_status.org_id column inside the function body (ON CONFLICT).
-- Rename the OUT columns so no body reference can collide.

drop function if exists claim_organization(text, jsonb, jsonb);

create or replace function claim_organization(
  p_compliance_org_id text,
  p_grant jsonb,
  p_standing jsonb
)
returns table (claimed_org_id uuid, claimed_org_slug text)
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
    perform ingest_standing(p_compliance_org_id, p_standing);
  end if;

  insert into audit_log (actor_id, actor_type, action, entity_type, entity_id, payload)
  values (v_user, 'user', 'org.claimed', 'organization', v_org_id::text,
          jsonb_build_object('compliance_org_id', p_compliance_org_id));

  return query select v_org_id, (select o.slug from organizations o where o.id = v_org_id);
end;
$$;

revoke execute on function claim_organization(text, jsonb, jsonb) from public, anon;
grant execute on function claim_organization(text, jsonb, jsonb) to authenticated;
