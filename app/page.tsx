import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  CalendarDays,
  Handshake,
  ArrowRight,
  Search,
  BadgeCheck,
  EyeOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  OrgBusinessCard,
  type DirectoryOrg,
} from "@/components/org-business-card";
import { ListingCard, type PublicListing } from "@/components/listing-card";

export const revalidate = 300;

const pillars = [
  {
    href: "/directory",
    icon: Building2,
    title: "Verified Directory",
    description:
      "Browse organizations that are vetted and continuously monitored through the Truvis compliance platform.",
    cta: "Browse the directory",
  },
  {
    href: "/events",
    icon: CalendarDays,
    title: "Business Events",
    description:
      "Discover events hosted by verified organizations — with organizer-approved attendance.",
    cta: "See upcoming events",
  },
  {
    href: "/marketplace",
    icon: Handshake,
    title: "Business Marketplace",
    description:
      "Fundraising, equity, and acquisition opportunities from compliance-verified businesses only.",
    cta: "Explore opportunities",
  },
];

const trust = [
  {
    icon: BadgeCheck,
    title: "Verified identity",
    text: "Company facts come from documents vetted on compliance.truvis.tech — never self-asserted.",
  },
  {
    icon: EyeOff,
    title: "Continuous enforcement",
    text: "Organizations that fall out of compliance disappear from the network automatically.",
  },
  {
    icon: Search,
    title: "Diligence-ready deal flow",
    text: "Marketplace sellers are pre-verified; full detail unlocks only with the seller's approval.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const [
    { count: orgCount },
    { count: eventCount },
    { count: listingCount },
    { data: featuredOrgs },
    { data: latestListings },
    { data: upcomingEvents },
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
    supabase.rpc("search_orgs", { p_limit: 6 }),
    supabase.rpc("get_public_listings"),
    supabase
      .from("events")
      .select("slug, title, starts_at, venue_address, organizations!inner(legal_name)")
      .eq("status", "published")
      .gte("starts_at", nowIso)
      .order("starts_at")
      .limit(3),
  ]);

  const featured = ((featuredOrgs ?? []) as DirectoryOrg[]).slice(0, 6);
  const opportunities = ((latestListings ?? []) as PublicListing[]).slice(0, 3);
  const events = (upcomingEvents ?? []) as unknown as Array<{
    slug: string;
    title: string;
    starts_at: string;
    venue_address: string | null;
    organizations: { legal_name: string };
  }>;

  const stats = [
    { value: orgCount ?? 0, label: "Verified organizations" },
    { value: eventCount ?? 0, label: "Published events" },
    { value: listingCount ?? 0, label: "Live opportunities" },
  ];

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-petroleum-deep via-petroleum to-[#03427a] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #10b981 0, transparent 40%), radial-gradient(circle at 80% 70%, #06b6d4 0, transparent 45%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-12 lg:py-32">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-brand/40 bg-emerald-brand/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-brand">
            <ShieldCheck className="size-4" aria-hidden />
            Trust by construction
          </p>
          <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            The network where every business is{" "}
            <span className="bg-gradient-to-r from-emerald-brand to-cyan-accent bg-clip-text text-transparent">
              verified
            </span>
            .
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75">
            Truvis.info publishes only organizations in good standing on the
            Truvis compliance platform — so the businesses you find, meet, and
            deal with are exactly who they say they are.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/directory">
                Browse the directory
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="border border-white/25 bg-white/5 from-transparent to-transparent text-white shadow-none hover:bg-white/10 hover:shadow-none"
            >
              <Link href="/signup">Get your organization listed</Link>
            </Button>
          </div>

          {/* Stats band */}
          <dl className="mt-16 grid max-w-xl grid-cols-3 gap-6 border-t border-white/15 pt-8">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dd className="font-display text-3xl font-extrabold text-emerald-brand">
                  {stat.value}
                </dd>
                <dt className="mt-1 text-xs uppercase tracking-wider text-white/60">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-12">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-petroleum dark:text-foreground">
            One network, three pillars
          </h2>
          <p className="mt-3 text-muted-foreground">
            A directory you can trust, events worth attending, and a
            marketplace where the counterparty is never a mystery.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((pillar) => (
            <Link key={pillar.href} href={pillar.href} className="group">
              <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-16px_rgba(2,48,89,0.25)]">
                <CardContent className="flex h-full flex-col p-7">
                  <span className="mb-5 inline-flex size-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-dark to-emerald-deeper text-white shadow-[0_6px_20px_-6px_rgba(16,185,129,0.45)]">
                    <pillar.icon className="size-6" aria-hidden />
                  </span>
                  <h3 className="font-display text-lg font-bold text-petroleum dark:text-foreground">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {pillar.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-dark">
                    {pillar.cta}
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured verified organizations */}
      {featured.length ? (
        <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-12">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-petroleum dark:text-foreground">
                Featured verified organizations
              </h2>
              <p className="mt-3 text-muted-foreground">
                Every card is backed by vetted records — not self-asserted
                claims.
              </p>
            </div>
            <Button asChild variant="link" className="px-0">
              <Link href="/directory">
                Browse all
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((org) => (
              <li key={org.slug}>
                <OrgBusinessCard org={org} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Live opportunities + upcoming events */}
      {opportunities.length || events.length ? (
        <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 lg:grid-cols-[2fr_1fr] lg:px-12">
          {opportunities.length ? (
            <div>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <h2 className="font-display text-2xl font-bold tracking-tight text-petroleum dark:text-foreground">
                  Latest opportunities
                </h2>
                <Button asChild variant="link" className="px-0">
                  <Link href="/marketplace">
                    Explore the marketplace
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </div>
              <ul className="flex flex-col gap-4">
                {opportunities.map((listing) => (
                  <li key={listing.id}>
                    <ListingCard listing={listing} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {events.length ? (
            <div>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <h2 className="font-display text-2xl font-bold tracking-tight text-petroleum dark:text-foreground">
                  Upcoming events
                </h2>
                <Button asChild variant="link" className="px-0">
                  <Link href="/events">
                    All events
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </div>
              <ul className="flex flex-col gap-3">
                {events.map((event) => (
                  <li key={event.slug}>
                    <Link
                      href={`/events/${event.slug}`}
                      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-petroleum text-emerald-brand">
                        <CalendarDays className="size-5" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">
                          {event.title}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {new Date(event.starts_at).toLocaleDateString("en-GB", {
                            dateStyle: "medium",
                          })}
                          {" · "}
                          {event.organizations.legal_name}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* How it works */}
      <section className="border-y border-border bg-secondary/60 dark:bg-secondary/30">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
          <h2 className="font-display text-2xl font-bold tracking-tight text-petroleum dark:text-foreground">
            How organizations join
          </h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Verify on compliance.truvis.tech",
                text: "Maintain your document vault and compliance standing on the Truvis compliance platform.",
              },
              {
                title: "Claim your public profile",
                text: "Authorize publication and your verified business card goes live in minutes.",
              },
              {
                title: "Appear across the network",
                text: "Directory, events, and marketplace — visible only while your standing holds.",
              },
            ].map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-dark to-emerald-deeper font-display text-sm font-bold text-white shadow-[0_6px_20px_-6px_rgba(16,185,129,0.45)]">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-display text-sm font-bold uppercase tracking-wide text-petroleum dark:text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-3 lg:px-12">
          {trust.map((item) => (
            <div key={item.title} className="flex gap-4">
              <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-petroleum text-emerald-brand">
                <item.icon className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-display text-sm font-bold uppercase tracking-wide text-petroleum dark:text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-12">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-petroleum-deep via-petroleum to-[#03427a] px-8 py-14 text-center text-white lg:px-16">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Your organization is already verified?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            If your organization maintains its vault on compliance.truvis.tech,
            claiming your public profile takes one step.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/signup">
                Claim your profile
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
