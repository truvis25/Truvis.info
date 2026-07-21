import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getManagedOrg } from "@/lib/orgs/queries";
import { getHomeData } from "@/lib/home/data";
import { mergeFeed, isFollowedFresh } from "@/lib/home/feed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { BrandArt } from "@/components/brand-art";
import { SITE_URL } from "@/lib/config";
import {
  FeedItemCard,
  NoticeCard,
  SystemCard,
} from "@/components/feed-item-card";
import {
  JoinCard,
  ExploreCard,
  IdentityCard,
  FollowingCard,
  NetworkLedger,
  RailFooter,
} from "@/components/home/left-rail";
import {
  OrgSpotlight,
  EventsRail,
  DealRoom,
  TrustSeal,
  GrowReach,
} from "@/components/home/right-rail";
import {
  HeroShowcase,
  PillarTriptych,
  HowItWorks,
  PhotoBand,
} from "@/components/home/showcase";

export const dynamic = "force-dynamic";

// LinkedIn-style feed filters: view → feed item kind.
const FEED_VIEWS = {
  posts: { kind: "post", label: "Updates", empty: "No updates yet — verified organizations post here." },
  events: { kind: "event", label: "Events", empty: "No event announcements right now." },
  deals: { kind: "listing", label: "Deals", empty: "No live opportunities in the feed right now." },
  members: { kind: "member", label: "New members", empty: "New members are announced here." },
} as const;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const activeView = (view && view in FEED_VIEWS ? view : "all") as
    | keyof typeof FEED_VIEWS
    | "all";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const signedIn = Boolean(user);
  const nowMs = Date.parse(new Date().toISOString());

  const data = await getHomeData(supabase);

  // Per-request personalization (never cached).
  let followedOrgIds = new Set<string>();
  let following: Array<{ slug: string; legal_name: string; logo_url: string | null }> = [];
  let managedOrg: Awaited<ReturnType<typeof getManagedOrg>> = null;
  let ownCounts = { posts: 0, events: 0, listings: 0 };
  if (user) {
    const [{ data: follows }, managed] = await Promise.all([
      supabase
        .from("org_follows")
        .select("org_id, organizations(slug, legal_name, logo_url)")
        .eq("user_id", user.id)
        .limit(5),
      getManagedOrg(supabase, user.id),
    ]);
    followedOrgIds = new Set((follows ?? []).map((f) => f.org_id as string));
    following = (follows ?? [])
      .map((f) => f.organizations as unknown as { slug: string; legal_name: string; logo_url: string | null })
      .filter(Boolean);
    managedOrg = managed;
    if (managed) {
      const [{ count: p }, { count: e }, { count: l }] = await Promise.all([
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("org_id", managed.id),
        supabase.from("events").select("*", { count: "exact", head: true }).eq("org_id", managed.id),
        supabase.rpc("get_my_listings").then((res) => ({ count: (res.data ?? []).length })),
      ]);
      ownCounts = { posts: p ?? 0, events: e ?? 0, listings: l ?? 0 };
    }
  }

  const feed = mergeFeed({
    posts: data.posts,
    members: data.members,
    events: data.events,
    listings: data.listings,
    orgCount: data.orgCount,
    followedOrgIds,
    nowMs,
  });

  const visibleFeed =
    activeView === "all"
      ? feed
      : feed.filter((item) => item.kind === FEED_VIEWS[activeView].kind);

  const managedMember = managedOrg
    ? data.members.find((m) => m.slug === managedOrg.slug)
    : undefined;

  const stats: Array<[number, string]> = [
    [data.orgCount, data.orgCount === 1 ? "Verified organization" : "Verified organizations"],
    [data.eventCount, data.eventCount === 1 ? "Published event" : "Published events"],
    [data.listingCount, data.listingCount === 1 ? "Live opportunity" : "Live opportunities"],
  ];

  const upcomingSorted = [...data.events].sort((a, b) =>
    a.starts_at < b.starts_at ? -1 : 1,
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Truvis.info",
        url: SITE_URL,
        logo: `${SITE_URL}/brand/logo.png`,
      },
      {
        "@type": "WebSite",
        url: SITE_URL,
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/directory?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "ItemList",
        itemListElement: data.members.map((member, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${SITE_URL}/orgs/${member.slug}`,
          name: member.legal_name,
        })),
      },
      ...upcomingSorted.slice(0, 3).map((event) => ({
        "@type": "Event",
        name: event.title,
        startDate: event.starts_at,
        url:
          event.external_source === "luma" && event.luma_event_url
            ? event.luma_event_url
            : `${SITE_URL}/events/${event.slug}`,
        ...(event.venue_address
          ? { location: { "@type": "Place", address: event.venue_address } }
          : event.online_url
            ? { location: { "@type": "VirtualLocation", url: `${SITE_URL}/events/${event.slug}` } }
            : {}),
        ...(event.organizations
          ? { organizer: { "@type": "Organization", name: event.organizations.legal_name } }
          : {}),
      })),
    ],
  };

  const FeedHeading = signedIn ? "h1" : "h2";

  return (
    <main className="flex-1 bg-secondary/40 dark:bg-background">
      <script
        type="application/ld+json"
        // Escape < so org-authored titles can never break out of the script tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* Gate band — anonymous only */}
      {!signedIn ? (
        <section className="art-on-petroleum relative overflow-hidden bg-gradient-to-br from-petroleum-deep via-petroleum to-[#03427a] text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 size-[420px] opacity-50 md:opacity-80 [mask-image:radial-gradient(closest-side,black_55%,transparent_100%)]"
          >
            <BrandArt
              seed="truvis-hero"
              variant="hero"
              draw
              className="origin-center motion-safe:animate-[spin_240s_linear_infinite]"
            />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 [mask-image:linear-gradient(to_top,black,transparent)]"
          >
            <BrandArt seed="truvis-hero" variant="horizon" draw />
          </div>
          <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-6 py-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-8 lg:py-16">
            <div className="max-w-2xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-brand/40 bg-emerald-brand/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-brand">
                <ShieldCheck className="size-4" aria-hidden />
                Trust by construction
              </p>
              <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                The network where every business is{" "}
                <span className="bg-gradient-to-r from-emerald-brand to-cyan-accent bg-clip-text text-transparent">
                  verified
                </span>
                .
              </h1>
              <p className="mt-3 max-w-xl text-white/75">
                A public business directory, an events calendar and a
                private-deal marketplace — open only to organizations in
                continuous good standing on Truvis Compliance.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/signup">
                    Join the network
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="border border-white/25 bg-white/5 from-transparent to-transparent text-white shadow-none hover:bg-white/10 hover:shadow-none"
                >
                  <Link href="/directory">Browse the directory</Link>
                </Button>
              </div>
              <dl className="mt-8 flex gap-8 border-t border-white/10 pt-6">
                {stats.map(([value, label]) => (
                  <div key={label} className="border-l border-white/15 pl-4 first:border-l-0 first:pl-0">
                    <dd className="font-display text-2xl font-extrabold text-emerald-brand">
                      {value}
                    </dd>
                    <dt className="mt-0.5 text-[11px] uppercase tracking-wider text-white/60">
                      {label}
                    </dt>
                  </div>
                ))}
              </dl>
            </div>
            <HeroShowcase orgCount={data.orgCount} />
          </div>
          <div aria-hidden className="rule-engraved absolute inset-x-0 bottom-0" />
        </section>
      ) : null}

      {/* Live network strip — key facts, static (replaces the marquee ticker) */}
      {!signedIn ? (
        <div className="border-b border-border bg-background">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-6 py-2.5 text-center text-xs text-muted-foreground lg:px-8">
            <span>
              <span className="font-semibold tabular-nums text-foreground">{data.orgCount}</span>{" "}
              verified organization{data.orgCount === 1 ? "" : "s"}
            </span>
            {upcomingSorted[0] ? (
              <>
                <span aria-hidden className="text-border">•</span>
                <span className="max-w-[18rem] truncate">
                  Next event:{" "}
                  <span className="font-medium text-foreground">{upcomingSorted[0].title}</span>
                </span>
              </>
            ) : null}
            {data.listings[0] ? (
              <>
                <span aria-hidden className="hidden text-border sm:inline">•</span>
                <span className="hidden max-w-[18rem] truncate sm:inline">
                  Latest opportunity:{" "}
                  <span className="font-medium text-foreground">{data.listings[0].teaser_headline}</span>
                </span>
              </>
            ) : null}
            <span aria-hidden className="text-border">•</span>
            <Link
              href="/signup"
              className="link-engraved font-semibold text-emerald-deeper dark:text-emerald-brand"
            >
              Admissions open
            </Link>
          </div>
        </div>
      ) : null}

      {/* Explainer narrative — anonymous only: what it is, how it works */}
      {!signedIn ? (
        <>
          <PillarTriptych
            topOrg={data.members[0]}
            nextEvent={upcomingSorted[0]}
            topListing={data.listings[0]}
            orgCount={data.orgCount}
            eventCount={data.eventCount}
            listingCount={data.listingCount}
          />
          <HowItWorks />
          <PhotoBand />
        </>
      ) : null}

      {/* Hub grid */}
      <section
        id="network"
        className="mx-auto grid w-full max-w-7xl scroll-mt-20 grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)_320px] lg:items-start lg:px-8"
      >
        {/* Left rail */}
        <aside aria-label="Your profile" className="order-2 flex flex-col gap-4 lg:order-1 lg:sticky lg:top-20">
          {signedIn ? (
            <>
              {managedOrg ? (
                <IdentityCard
                  org={{
                    slug: managedOrg.slug,
                    legal_name: managedOrg.legal_name,
                    cover_url: managedMember?.cover_url,
                    logo_url: managedMember?.logo_url,
                    avg_rating: managedMember?.avg_rating,
                    review_count: managedMember?.review_count,
                    follower_count: managedMember?.follower_count,
                  }}
                />
              ) : (
                <JoinCard />
              )}
              <FollowingCard following={following} />
            </>
          ) : (
            <>
              <JoinCard />
              <ExploreCard
                orgCount={data.orgCount}
                eventCount={data.eventCount}
                listingCount={data.listingCount}
              />
            </>
          )}
          <NetworkLedger
            orgCount={data.orgCount}
            eventCount={data.eventCount}
            listingCount={data.listingCount}
          />
          <RailFooter />
        </aside>

        {/* Center feed */}
        <div className="order-1 flex min-w-0 flex-col gap-4 lg:order-2">
          <div className="flex items-end justify-between gap-3 px-1">
            <div>
              <FeedHeading className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.16em] text-petroleum dark:text-foreground">
                <span aria-hidden className="h-4 w-1 rounded-full bg-emerald-brand" />
                Network activity
              </FeedHeading>
              <p className="mt-1 text-xs text-muted-foreground">
                Live posts, events and opportunities from verified organizations.
              </p>
            </div>
            <Link
              href="/feed"
              className="link-engraved shrink-0 text-xs font-semibold text-emerald-deeper dark:text-emerald-brand"
            >
              Full feed →
            </Link>
          </div>

          {/* Composer slot */}
          <Card className="p-3">
            {signedIn && managedOrg ? (
              <Link href="/dashboard/posts" className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-petroleum to-petroleum-deep text-xs font-bold text-white">
                  {managedOrg.legal_name.slice(0, 2).toUpperCase()}
                </span>
                <span className="flex-1 rounded-full border border-border bg-secondary/60 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-emerald-brand/40 hover:bg-emerald-brand/5">
                  Share an update from {managedOrg.legal_name}…
                </span>
              </Link>
            ) : (
              <form action="/directory" method="get" className="flex gap-2">
                <Input
                  name="q"
                  placeholder="Search verified organizations…"
                  aria-label="Search verified organizations"
                  className="flex-1"
                />
                <Button type="submit" variant="primary">Search</Button>
              </form>
            )}
          </Card>

          {/* Feed filters — slice the stream like LinkedIn's feed views */}
          <nav aria-label="Filter the feed" className="flex flex-wrap gap-1.5 px-1">
            {(
              [
                ["all", "All"],
                ...Object.entries(FEED_VIEWS).map(
                  ([key, config]) => [key, config.label] as const,
                ),
              ] as ReadonlyArray<readonly [string, string]>
            ).map(([key, label]) => (
              <Link
                key={key}
                href={key === "all" ? "/#network" : `/?view=${key}#network`}
                aria-current={activeView === key ? "page" : undefined}
                className={
                  activeView === key
                    ? "inline-flex h-7 items-center rounded-full border border-petroleum bg-petroleum px-3 text-xs font-semibold text-white dark:border-emerald-brand dark:bg-emerald-brand dark:text-petroleum-deep"
                    : "inline-flex h-7 items-center rounded-full border border-border px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                }
              >
                {label}
              </Link>
            ))}
          </nav>

          <ol className="flex flex-col gap-4">
            {!signedIn && activeView === "all" ? (
              <li>
                <NoticeCard />
              </li>
            ) : null}
            {visibleFeed.map((item) => (
              <li
                key={`${item.kind}-${item.kind === "post" ? item.data.id : item.kind === "listing" ? item.data.id : item.data.slug}`}
                className="reveal"
              >
                <article>
                  <FeedItemCard
                    item={item}
                    signedIn={signedIn}
                    followedOrgIds={followedOrgIds}
                    followedAccent={isFollowedFresh(item, followedOrgIds, nowMs)}
                  />
                </article>
              </li>
            ))}
            {activeView !== "all" && visibleFeed.length === 0 ? (
              <li>
                <Card className="flex flex-col items-center gap-2 p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    {FEED_VIEWS[activeView].empty}
                  </p>
                  <Link
                    href="/#network"
                    className="link-engraved text-xs font-semibold text-emerald-deeper dark:text-emerald-brand"
                  >
                    Back to the full feed →
                  </Link>
                </Card>
              </li>
            ) : null}
            {activeView === "all" && feed.length < 6 ? (
              <>
                <li><SystemCard variant="founding" /></li>
                {feed.length < 5 ? (
                  <li><SystemCard variant="marketplace" /></li>
                ) : null}
              </>
            ) : null}
          </ol>

          {/* Feed footer */}
          <div className="py-6 text-center">
            <div aria-hidden className="rule-engraved mx-auto max-w-xs" />
            <p className="mt-4 text-xs text-muted-foreground">
              {data.orgCount} organization
              {data.orgCount === 1 ? "" : "s"} on the register ·{" "}
              <Link href="/feed" className="link-engraved font-semibold text-emerald-deeper dark:text-emerald-brand">
                Full feed →
              </Link>{" "}
              ·{" "}
              <Link href="/directory" className="link-engraved font-semibold text-emerald-deeper dark:text-emerald-brand">
                Browse directory →
              </Link>
            </p>
          </div>
        </div>

        {/* Right rail */}
        <aside aria-label="Discovery" className="order-3 flex flex-col gap-4 lg:sticky lg:top-20">
          <OrgSpotlight
            orgs={data.members
              .filter(
                (m) =>
                  !followedOrgIds.has(m.org_id) &&
                  m.slug !== managedOrg?.slug,
              )
              .slice(0, 3)}
            orgCount={data.orgCount}
            followedOrgIds={followedOrgIds}
            signedIn={signedIn}
          />
          <EventsRail events={data.events} signedIn={signedIn} />
          <DealRoom listings={data.listings} />
          {signedIn && managedOrg ? (
            <GrowReach
              postCount={ownCounts.posts}
              eventCount={ownCounts.events}
              listingCount={ownCounts.listings}
            />
          ) : (
            <TrustSeal />
          )}
        </aside>
      </section>

      {/* Colophon CTA strip — anonymous only */}
      {!signedIn ? (
        <section className="border-t border-border bg-background">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-12 lg:px-8">
            <div>
              <h2 className="font-display text-xl font-bold text-petroleum dark:text-foreground">
                Already verified on compliance.truvis.tech?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Claiming your public profile takes one step.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/signup">
                Claim your profile
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
