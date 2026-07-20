// Pure, deterministic home-feed assembly (no randomness, no clock reads —
// stable server HTML). Unit-tested in lib/home/feed.test.ts.
import type { DirectoryOrg } from "@/components/org-business-card";
import type { PublicListing } from "@/components/listing-card";

export type FeedPost = {
  id: string;
  title: string;
  body: { text?: string } | null;
  published_at: string | null;
  org_id: string;
  organizations: { slug: string; legal_name: string; logo_url: string | null };
};

export type HomeEvent = {
  slug: string;
  title: string;
  starts_at: string;
  venue_address: string | null;
  online_url: string | null;
  banner_url: string | null;
  external_source: string | null;
  luma_event_url: string | null;
  created_at: string;
  org_id: string | null;
  organizations: { slug: string; legal_name: string; logo_url: string | null } | null;
};

export type MemberOrg = DirectoryOrg & { org_id: string; created_at: string };

export type FeedItem =
  | { kind: "post"; ts: string; orgId: string; data: FeedPost }
  | { kind: "member"; ts: string; orgId: string; data: MemberOrg }
  | { kind: "event"; ts: string; orgId: string | null; data: HomeEvent }
  | { kind: "listing"; ts: string; orgId: null; data: PublicListing };

const DAY_MS = 24 * 60 * 60 * 1000;
const FEED_CAP = 14;
const MEMBER_FILLER_THRESHOLD = 20;

export function mergeFeed({
  posts,
  members,
  events,
  listings,
  orgCount,
  followedOrgIds,
  nowMs,
}: {
  posts: FeedPost[];
  members: MemberOrg[];
  events: HomeEvent[];
  listings: PublicListing[];
  orgCount: number;
  followedOrgIds: Set<string>;
  nowMs: number;
}): FeedItem[] {
  const items: FeedItem[] = [];

  for (const post of posts) {
    items.push({
      kind: "post",
      ts: post.published_at ?? "",
      orgId: post.org_id,
      data: post,
    });
  }

  // Member filler policy: while the network is small every org is a member
  // item regardless of age; at scale only recent joins qualify.
  for (const member of members) {
    if (
      orgCount >= MEMBER_FILLER_THRESHOLD &&
      nowMs - new Date(member.created_at).getTime() > 30 * DAY_MS
    ) {
      continue;
    }
    items.push({
      kind: "member",
      ts: member.created_at,
      orgId: member.org_id,
      data: member,
    });
  }

  for (const event of events) {
    // Announcement time, not starts_at — future events must not pin the top.
    items.push({
      kind: "event",
      ts: event.created_at,
      orgId: event.org_id,
      data: event,
    });
  }

  for (const listing of listings) {
    items.push({ kind: "listing", ts: listing.created_at, orgId: null, data: listing });
  }

  items.sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0));

  // De-dupe: drop a member card when that org already appears higher up.
  const seenOrgs = new Set<string>();
  const deduped: FeedItem[] = [];
  for (const item of items) {
    if (item.kind === "member" && item.orgId && seenOrgs.has(item.orgId)) continue;
    deduped.push(item);
    if (item.orgId) seenOrgs.add(item.orgId);
  }

  // Followed-first (7-day window prevents stale pinning), stable within
  // each partition.
  const followed: FeedItem[] = [];
  const rest: FeedItem[] = [];
  for (const item of deduped) {
    const isFresh = item.ts && nowMs - new Date(item.ts).getTime() <= 7 * DAY_MS;
    if (item.orgId && followedOrgIds.has(item.orgId) && isFresh) followed.push(item);
    else rest.push(item);
  }
  const ordered = [...followed, ...rest];

  // Diversity clamp: break up runs of 3+ same-kind items when possible.
  for (let i = 2; i < ordered.length; i++) {
    if (
      ordered[i].kind === ordered[i - 1].kind &&
      ordered[i].kind === ordered[i - 2].kind
    ) {
      const swapIdx = ordered.findIndex(
        (candidate, j) => j > i && candidate.kind !== ordered[i].kind,
      );
      if (swapIdx > i) {
        const [swapped] = ordered.splice(swapIdx, 1);
        ordered.splice(i, 0, swapped);
      }
    }
  }

  return ordered.slice(0, FEED_CAP);
}

export function isFollowedFresh(
  item: FeedItem,
  followedOrgIds: Set<string>,
  nowMs: number,
): boolean {
  return Boolean(
    item.orgId &&
      followedOrgIds.has(item.orgId) &&
      item.ts &&
      nowMs - new Date(item.ts).getTime() <= 7 * DAY_MS,
  );
}
