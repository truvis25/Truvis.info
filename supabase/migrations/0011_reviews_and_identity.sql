-- Community reviews ("points + comments") on organization profiles, and an
-- opt-in identity reveal for marketplace teasers. Reviews follow the posts
-- moderation model (content_status, archived = removed by admin, reversible);
-- marketplace anonymity remains the default and org_id stays out of the
-- public column grant — identity flows only through get_public_listings.

-- ---------------------------------------------------------------------------
-- org_reviews: one review per user per organization, 1–5 stars + comment.
-- ---------------------------------------------------------------------------
create table org_reviews (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  reviewer_id uuid not null references user_profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 2000),
  status content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, reviewer_id)
);

create index idx_reviews_org on org_reviews (org_id, status, created_at desc);
create index idx_reviews_reviewer on org_reviews (reviewer_id);

alter table org_reviews enable row level security;

-- Public read is deliberate: it lets the SECURITY INVOKER search_orgs
-- aggregate ratings for anon while RLS still hides reviews of hidden orgs.
create policy "public read published reviews" on org_reviews for select
  using ((status = 'published'
          and exists (select 1 from organizations o where o.id = org_id and o.is_visible))
         or reviewer_id = auth.uid()
         or is_platform_admin());

-- Members cannot review their own organization; reviews only on visible orgs.
create policy "user reviews visible org" on org_reviews for insert to authenticated
  with check (reviewer_id = auth.uid()
              and status = 'published'
              and not is_org_member(org_id)
              and exists (select 1 from organizations o where o.id = org_id and o.is_visible));

-- Authors may edit their own review while it is published; the with-check
-- pins status so an admin-archived review cannot be self-restored.
create policy "author updates own review" on org_reviews for update
  using (reviewer_id = auth.uid() and status = 'published')
  with check (reviewer_id = auth.uid() and status = 'published'
              and not is_org_member(org_id));

create policy "author deletes own review" on org_reviews for delete
  using (reviewer_id = auth.uid());

create policy "admin moderates reviews" on org_reviews for update
  using (is_platform_admin());

-- ---------------------------------------------------------------------------
-- Moderation: reviews join the existing report queue. A report targets
-- exactly one of post_id / review_id.
-- ---------------------------------------------------------------------------
alter table content_reports alter column post_id drop not null;
alter table content_reports
  add column review_id uuid references org_reviews (id) on delete cascade;
alter table content_reports
  add constraint chk_report_target check (num_nonnulls(post_id, review_id) = 1);
create index idx_reports_review on content_reports (review_id);

create or replace function admin_remove_review(p_review_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_platform_admin() then
    raise exception 'not authorized';
  end if;

  update org_reviews
     set status = 'archived', updated_at = now()
   where id = p_review_id;

  insert into audit_log (actor_id, actor_type, action, entity_type, entity_id, reason)
  values (auth.uid(), 'admin', 'review.removed', 'org_review', p_review_id::text, p_reason);
end;
$$;

revoke execute on function admin_remove_review(uuid, text) from public, anon;
grant execute on function admin_remove_review(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Public read RPCs. SECURITY DEFINER because anon cannot read user_profiles,
-- yet the public org page shows reviewer names/avatars (same rationale as
-- get_follower_count).
-- ---------------------------------------------------------------------------
create or replace function get_org_reviews(
  p_org_id uuid,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id uuid,
  rating int,
  comment text,
  created_at timestamptz,
  reviewer_id uuid,
  reviewer_name text,
  reviewer_avatar text
)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.rating, r.comment, r.created_at, r.reviewer_id,
         coalesce(nullif(p.display_name, ''), 'Truvis member'),
         p.avatar_url
  from org_reviews r
  join user_profiles p on p.id = r.reviewer_id
  where r.org_id = p_org_id
    and r.status = 'published'
    and exists (select 1 from organizations o where o.id = r.org_id and o.is_visible)
  order by r.created_at desc
  limit least(coalesce(p_limit, 20), 50)
  offset greatest(coalesce(p_offset, 0), 0)
$$;

grant execute on function get_org_reviews(uuid, int, int) to anon, authenticated;

create or replace function get_org_rating(p_org_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'avg', (select round(avg(rating)::numeric, 1) from org_reviews
             where org_id = p_org_id and status = 'published'),
    'count', (select count(*) from org_reviews
               where org_id = p_org_id and status = 'published'),
    'dist', (select jsonb_object_agg(s.star::text, coalesce(c.n, 0))
             from generate_series(1, 5) as s(star)
             left join (select rating, count(*) as n from org_reviews
                         where org_id = p_org_id and status = 'published'
                         group by rating) c on c.rating = s.star)
  )
$$;

grant execute on function get_org_rating(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- search_orgs v2: adds cover_url + rating/follower aggregates for the
-- directory business cards and the home featured strip. Return type changes,
-- so drop + recreate. Stays SECURITY INVOKER — RLS keeps hidden orgs out;
-- the org_reviews public-read policy makes the lateral aggregate anon-safe,
-- and follower counts go through the existing definer helper.
-- ---------------------------------------------------------------------------
drop function if exists search_orgs(text, text, text);

create function search_orgs(
  p_query text default null,
  p_industry text default null,
  p_jurisdiction text default null,
  p_limit int default null
)
returns table (
  slug text,
  legal_name text,
  tagline text,
  jurisdiction text,
  industry_code text,
  size_band text,
  logo_url text,
  cover_url text,
  avg_rating numeric,
  review_count bigint,
  follower_count bigint
)
language sql
stable
set search_path = public
as $$
  select o.slug, o.legal_name, o.tagline, o.jurisdiction, o.industry_code,
         o.size_band, o.logo_url, o.cover_url,
         rv.avg_rating, coalesce(rv.review_count, 0), get_follower_count(o.id)
  from organizations o
  left join lateral (
    select round(avg(r.rating)::numeric, 1) as avg_rating,
           count(*) as review_count
    from org_reviews r
    where r.org_id = o.id and r.status = 'published'
  ) rv on true
  where (nullif(trim(coalesce(p_query, '')), '') is null
         or to_tsvector('english', coalesce(o.legal_name, '') || ' ' || coalesce(o.description, ''))
            @@ websearch_to_tsquery('english', p_query)
         or o.legal_name ilike '%' || p_query || '%')
    and (nullif(p_industry, '') is null or o.industry_code = p_industry)
    and (nullif(p_jurisdiction, '') is null or o.jurisdiction = p_jurisdiction)
  order by o.legal_name
  limit coalesce(p_limit, 1000)
$$;

grant execute on function search_orgs(text, text, text, int) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Marketplace identity reveal (opt-in per listing). org_id remains excluded
-- from the public column grant; identity is exposed only through the definer
-- RPC below and only when the owner opted in.
-- ---------------------------------------------------------------------------
alter table marketplace_listings
  add column reveal_identity boolean not null default false;

revoke select on marketplace_listings from anon, authenticated;
grant select (id, listing_type, status, teaser_headline, sector, region,
              size_band, teaser_summary, attestation_accepted_at,
              reveal_identity, created_at, updated_at)
  on marketplace_listings to anon, authenticated;

create or replace function get_public_listings(p_listing_id uuid default null)
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
  order by l.created_at desc
$$;

grant execute on function get_public_listings(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin KPIs: published review count.
-- ---------------------------------------------------------------------------
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
