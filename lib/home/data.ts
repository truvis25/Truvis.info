import type { SupabaseClient } from "@supabase/supabase-js";
import type { DirectoryOrg } from "@/components/org-business-card";
import type { PublicListing } from "@/components/listing-card";
import type { FeedPost, HomeEvent, MemberOrg } from "./feed";

// Home-hub data. Deliberately uncached in v1: total payload is ~10 rows of
// indexed public queries and the route is force-dynamic anyway (auth
// branch); introduce tag-based caching only if volumes ever warrant it.
export type HomeData = {
  orgCount: number;
  eventCount: number;
  listingCount: number;
  posts: FeedPost[];
  members: MemberOrg[];
  events: HomeEvent[];
  listings: PublicListing[];
};

export async function getHomeData(supabase: SupabaseClient): Promise<HomeData> {
  const nowIso = new Date().toISOString();
  const [
    { count: orgCount },
    { count: eventCount },
    { count: listingCount },
    { data: posts },
    { data: orgs },
    { data: orgMeta },
    { data: events },
    { data: listings },
  ] = await Promise.all([
    supabase.from("organizations").select("*", { count: "exact", head: true }),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("marketplace_listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("posts")
      .select(
        "id, title, body, published_at, org_id, organizations!inner(slug, legal_name, logo_url)",
      )
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(12),
    supabase.rpc("search_orgs", { p_limit: 8 }),
    // search_orgs lacks id/created_at — join in memory by slug.
    supabase
      .from("organizations")
      .select("id, slug, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("events")
      .select(
        "slug, title, starts_at, venue_address, online_url, banner_url, external_source, luma_event_url, created_at, org_id, organizations(slug, legal_name, logo_url)",
      )
      .eq("status", "published")
      .gte("starts_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.rpc("get_public_listings"),
  ]);

  const metaBySlug = new Map(
    ((orgMeta ?? []) as Array<{ id: string; slug: string; created_at: string }>).map(
      (row) => [row.slug, row],
    ),
  );
  const members: MemberOrg[] = ((orgs ?? []) as DirectoryOrg[])
    .map((row) => {
      const meta = metaBySlug.get(row.slug);
      return meta
        ? { ...row, org_id: meta.id, created_at: meta.created_at }
        : null;
    })
    .filter((row): row is MemberOrg => row !== null);

  return {
    orgCount: orgCount ?? 0,
    eventCount: eventCount ?? 0,
    listingCount: listingCount ?? 0,
    posts: (posts ?? []) as unknown as FeedPost[],
    members,
    events: (events ?? []) as unknown as HomeEvent[],
    listings: ((listings ?? []) as PublicListing[]).slice(0, 4),
  };
}
