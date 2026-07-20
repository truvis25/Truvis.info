-- Full marketplace search: extend the anonymity-safe listing feed with
-- keyword + facet filters. Return type unchanged; argument list grows, so
-- drop + recreate. org_id stays out of reach — identity still flows only
-- through the reveal_identity opt-in.
drop function if exists get_public_listings(uuid);

create function get_public_listings(
  p_listing_id uuid default null,
  p_query text default null,
  p_type text default null,
  p_sector text default null,
  p_region text default null
)
returns table (
  id uuid,
  listing_type listing_type,
  teaser_headline text,
  sector text,
  region text,
  size_band text,
  teaser_summary text,
  created_at timestamptz,
  reveal_identity boolean,
  org_slug text,
  org_legal_name text,
  org_logo_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select l.id, l.listing_type, l.teaser_headline, l.sector, l.region,
         l.size_band, l.teaser_summary, l.created_at, l.reveal_identity,
         case when l.reveal_identity then o.slug end,
         case when l.reveal_identity then o.legal_name end,
         case when l.reveal_identity then o.logo_url end
  from marketplace_listings l
  join organizations o on o.id = l.org_id
  where l.status = 'active'
    and o.is_visible
    and (p_listing_id is null or l.id = p_listing_id)
    and (nullif(trim(coalesce(p_query, '')), '') is null
         or l.teaser_headline ilike '%' || p_query || '%'
         or l.teaser_summary ilike '%' || p_query || '%'
         or l.sector ilike '%' || p_query || '%')
    and (nullif(p_type, '') is null or l.listing_type::text = p_type)
    and (nullif(p_sector, '') is null or l.sector = p_sector)
    and (nullif(p_region, '') is null or l.region = p_region)
  order by l.created_at desc
$$;

grant execute on function get_public_listings(uuid, text, text, text, text) to anon, authenticated;
