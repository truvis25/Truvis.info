import { describe, expect, it } from "vitest";
import { mergeFeed, type FeedPost, type HomeEvent, type MemberOrg } from "./feed";
import type { PublicListing } from "@/components/listing-card";

const NOW = Date.parse("2026-07-20T12:00:00Z");
const iso = (daysAgo: number) =>
  new Date(NOW - daysAgo * 24 * 60 * 60 * 1000).toISOString();

const org = (id: string, createdDaysAgo: number): MemberOrg => ({
  org_id: id,
  created_at: iso(createdDaysAgo),
  slug: `org-${id}`,
  legal_name: `Org ${id}`,
  tagline: null,
  jurisdiction: null,
  industry_code: null,
  size_band: null,
  logo_url: null,
  cover_url: null,
  avg_rating: null,
  review_count: 0,
  follower_count: 0,
});

const post = (orgId: string, daysAgo: number, id = `p-${orgId}-${daysAgo}`): FeedPost => ({
  id,
  title: "Update",
  body: { text: "hello" },
  published_at: iso(daysAgo),
  org_id: orgId,
  organizations: { slug: `org-${orgId}`, legal_name: `Org ${orgId}`, logo_url: null },
});

const event = (orgId: string | null, createdDaysAgo: number, slug: string): HomeEvent => ({
  slug,
  title: "Event",
  starts_at: iso(-5),
  venue_address: null,
  online_url: null,
  banner_url: null,
  external_source: orgId ? null : "luma",
  luma_event_url: null,
  created_at: iso(createdDaysAgo),
  org_id: orgId,
  organizations: orgId
    ? { slug: `org-${orgId}`, legal_name: `Org ${orgId}`, logo_url: null }
    : null,
});

const listing = (createdDaysAgo: number, id: string): PublicListing => ({
  id,
  listing_type: "fundraise",
  teaser_headline: "Opportunity",
  sector: null,
  region: null,
  size_band: null,
  teaser_summary: null,
  created_at: iso(createdDaysAgo),
  reveal_identity: false,
  org_slug: null,
  org_legal_name: null,
  org_logo_url: null,
});

describe("mergeFeed", () => {
  it("is deterministic and sorted newest-first", () => {
    const input = {
      posts: [post("a", 1), post("b", 3)],
      members: [org("a", 10), org("c", 2)],
      events: [event("a", 4, "e1")],
      listings: [listing(5, "l1")],
      orgCount: 3,
      followedOrgIds: new Set<string>(),
      nowMs: NOW,
    };
    const one = mergeFeed(input);
    const two = mergeFeed(input);
    expect(one).toEqual(two);
    const ts = one.map((i) => i.ts);
    expect([...ts].sort().reverse()).toEqual(ts);
  });

  it("dedupes member cards for orgs already present higher up", () => {
    const result = mergeFeed({
      posts: [post("a", 1)],
      members: [org("a", 10)],
      events: [],
      listings: [],
      orgCount: 2,
      followedOrgIds: new Set(),
      nowMs: NOW,
    });
    expect(result.filter((i) => i.orgId === "a")).toHaveLength(1);
    expect(result[0].kind).toBe("post");
  });

  it("keeps every org as a member item while the network is small, filters old joins at scale", () => {
    const small = mergeFeed({
      posts: [],
      members: [org("old", 400)],
      events: [],
      listings: [],
      orgCount: 5,
      followedOrgIds: new Set(),
      nowMs: NOW,
    });
    expect(small).toHaveLength(1);

    const large = mergeFeed({
      posts: [],
      members: [org("old", 400), org("new", 5)],
      events: [],
      listings: [],
      orgCount: 25,
      followedOrgIds: new Set(),
      nowMs: NOW,
    });
    expect(large.map((i) => i.orgId)).toEqual(["new"]);
  });

  it("pins fresh followed items first but not stale ones", () => {
    const result = mergeFeed({
      posts: [post("followed", 6), post("other", 1), post("followed-stale", 20)],
      members: [],
      events: [],
      listings: [],
      orgCount: 3,
      followedOrgIds: new Set(["followed", "followed-stale"]),
      nowMs: NOW,
    });
    expect(result[0].orgId).toBe("followed");
    expect(result[result.length - 1].orgId).toBe("followed-stale");
  });

  it("breaks up runs of 3+ same-kind items when a differing item exists", () => {
    const result = mergeFeed({
      posts: [post("a", 1), post("b", 2), post("c", 3), post("d", 5)],
      members: [],
      events: [event("e", 4, "ev")],
      listings: [],
      orgCount: 6,
      followedOrgIds: new Set(),
      nowMs: NOW,
    });
    for (let i = 2; i < result.length; i++) {
      const run =
        result[i].kind === result[i - 1].kind &&
        result[i].kind === result[i - 2].kind;
      expect(run).toBe(false);
    }
  });

  it("caps at 14 items", () => {
    const result = mergeFeed({
      posts: Array.from({ length: 20 }, (_, i) => post(`p${i}`, i + 1, `id-${i}`)),
      members: [],
      events: [],
      listings: [],
      orgCount: 30,
      followedOrgIds: new Set(),
      nowMs: NOW,
    });
    expect(result).toHaveLength(14);
  });
});
