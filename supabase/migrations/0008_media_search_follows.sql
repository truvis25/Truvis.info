-- Phase 5.5 "Polish": media storage, directory search, follower helpers
-- (PRD DIR-3/DIR-4/DIR-5/DIR-8, CAT-2).

-- ---------------------------------------------------------------------------
-- Public media bucket: org branding + catalog images. Public read via CDN;
-- writes restricted to members of the org that owns the path org/<org_id>/…
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('public-media', 'public-media', true, 5242880,
        array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

create policy "org members upload own media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'public-media'
    and (storage.foldername(name))[1] = 'org'
    and is_org_member(((storage.foldername(name))[2])::uuid)
  );

create policy "org members update own media" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'public-media'
    and (storage.foldername(name))[1] = 'org'
    and is_org_member(((storage.foldername(name))[2])::uuid)
  );

create policy "org members delete own media" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'public-media'
    and (storage.foldername(name))[1] = 'org'
    and is_org_member(((storage.foldername(name))[2])::uuid)
  );

create policy "public reads public media" on storage.objects
  for select using (bucket_id = 'public-media');

-- ---------------------------------------------------------------------------
-- Directory search (DIR-4/DIR-5): SECURITY INVOKER so RLS keeps hidden orgs
-- out; uses the GIN index from migration 0001.
-- ---------------------------------------------------------------------------
create or replace function search_orgs(
  p_query text default null,
  p_industry text default null,
  p_jurisdiction text default null
)
returns table (
  slug text,
  legal_name text,
  tagline text,
  jurisdiction text,
  industry_code text,
  size_band text,
  logo_url text
)
language sql
stable
set search_path = public
as $$
  select o.slug, o.legal_name, o.tagline, o.jurisdiction, o.industry_code,
         o.size_band, o.logo_url
  from organizations o
  where (nullif(trim(coalesce(p_query, '')), '') is null
         or to_tsvector('english', coalesce(o.legal_name, '') || ' ' || coalesce(o.description, ''))
            @@ websearch_to_tsquery('english', p_query)
         or o.legal_name ilike '%' || p_query || '%')
    and (nullif(p_industry, '') is null or o.industry_code = p_industry)
    and (nullif(p_jurisdiction, '') is null or o.jurisdiction = p_jurisdiction)
  order by o.legal_name
$$;

grant execute on function search_orgs(text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Follower helpers (DIR-8): public count without exposing follower rows.
-- ---------------------------------------------------------------------------
create or replace function get_follower_count(p_org_id uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*) from org_follows where org_id = p_org_id
$$;

grant execute on function get_follower_count(uuid) to anon, authenticated;
