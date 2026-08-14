import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  MapPin,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { HomeData } from "@/lib/home/data";
import { SITE_URL } from "@/lib/config";

const SELECTED_CLIENTS = [
  {
    name: "OXY Technologies Ltd",
    descriptor: "Fintech & payments",
  },
  {
    name: "KUN PENG Technologies LLC",
    descriptor: "Technology & UAE operations",
  },
] as const;

const LISTING_LABELS = {
  fundraise: "Fundraising",
  equity_sale: "Equity opportunity",
  business_sale: "Business sale",
} as const;

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("en-AE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function Metric({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div>
      <dd className="font-display text-2xl font-bold tabular-nums text-petroleum dark:text-white">
        {value}
      </dd>
      <dt className="mt-1 text-xs leading-5 text-muted-foreground">{label}</dt>
    </div>
  );
}

export function PublicLanding({ data }: { data: HomeData }) {
  const nextEvent = [...data.events].sort((a, b) =>
    a.starts_at.localeCompare(b.starts_at),
  )[0];
  const topListing = data.listings[0];
  const featuredOrgs = data.members.slice(0, 3);

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
        name: "Truvis.info",
        url: SITE_URL,
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/directory?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <main className="flex-1 overflow-hidden bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <section className="relative isolate border-b border-border bg-[#faf7f5] dark:bg-background">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-60 [background-image:linear-gradient(rgba(2,48,89,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(2,48,89,0.035)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
        />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.02fr_.98fr] lg:gap-16 lg:px-10 lg:py-24">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-deep-teal dark:text-cyan-accent">
              <ShieldCheck className="size-4 text-emerald-brand" aria-hidden />
              Verified business network
            </p>
            <h1 className="mt-5 max-w-xl font-display text-[clamp(2.65rem,6vw,4.8rem)] font-bold leading-[1.02] tracking-[-0.045em] text-petroleum dark:text-white">
              Find a business you can trust.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#4f5966] dark:text-white/70">
              Search verified organizations, discover their events and review
              business opportunities — all in one clear, trusted network.
            </p>

            <form
              action="/directory"
              method="get"
              className="mt-8 flex max-w-xl flex-col gap-3 rounded-2xl bg-white p-2 shadow-[0_18px_55px_-25px_rgba(2,48,89,0.35)] ring-1 ring-petroleum/10 sm:flex-row dark:bg-card dark:ring-white/10"
            >
              <label htmlFor="home-search" className="sr-only">
                Search verified organizations
              </label>
              <span className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <Search className="size-5 shrink-0 text-emerald-brand" aria-hidden />
                <input
                  id="home-search"
                  name="q"
                  type="search"
                  placeholder="Company, service or industry"
                  className="h-12 min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
                />
              </span>
              <button
                type="submit"
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-petroleum px-6 font-display text-sm font-semibold text-white transition hover:bg-petroleum-light focus-visible:outline-none"
              >
                Search directory
                <ArrowRight className="size-4" aria-hidden />
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              <Link
                href="/directory"
                className="font-semibold text-petroleum underline decoration-petroleum/25 underline-offset-4 transition hover:decoration-petroleum dark:text-white"
              >
                Browse all companies
              </Link>
              <Link
                href="/signup"
                className="font-semibold text-emerald-deeper underline decoration-emerald-brand/30 underline-offset-4 transition hover:decoration-emerald-brand dark:text-emerald-brand"
              >
                Get your business listed
              </Link>
            </div>

            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-5 border-t border-petroleum/10 pt-7 dark:border-white/10">
              <Metric value={data.orgCount} label="Verified organizations" />
              <Metric value={data.eventCount} label="Published events" />
              <Metric value={data.listingCount} label="Live opportunities" />
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none">
            <div
              aria-hidden
              className="absolute -inset-5 -z-10 rounded-[2rem] bg-[linear-gradient(135deg,rgba(13,122,86,.16),rgba(12,110,138,.08),transparent_70%)]"
            />
            <figure className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-petroleum shadow-[0_32px_80px_-36px_rgba(2,48,89,0.55)]">
              <Image
                src="/photos/hero-summit.jpg"
                alt="Business advisers reviewing a company profile in Abu Dhabi"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-petroleum-deep/45 via-transparent to-transparent"
              />
              <figcaption className="absolute inset-x-5 bottom-5 flex items-center gap-3 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur dark:bg-card/95">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f5ef] text-emerald-brand">
                  <BadgeCheck className="size-6" aria-hidden />
                </span>
                <span>
                  <span className="block font-display text-sm font-bold text-petroleum dark:text-white">
                    Verified before listing
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Identity and standing checked upstream
                  </span>
                </span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section aria-labelledby="client-proof-title" className="border-b border-border bg-white dark:bg-card">
        <div className="mx-auto grid max-w-7xl gap-7 px-5 py-9 sm:px-8 md:grid-cols-[240px_1fr] md:items-center lg:px-10">
          <div>
            <p
              id="client-proof-title"
              className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-deep-teal dark:text-cyan-accent"
            >
              Selected client relationships
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Organizations supported by TRUVIS International Services.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {SELECTED_CLIENTS.map((client) => (
              <div
                key={client.name}
                className="flex min-h-20 items-center justify-between gap-5 rounded-xl border border-petroleum/10 bg-[#faf7f5] px-5 py-4 dark:border-white/10 dark:bg-background"
              >
                <div>
                  <p className="font-display text-sm font-bold text-petroleum dark:text-white">
                    {client.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {client.descriptor}
                  </p>
                </div>
                <Check className="size-5 shrink-0 text-emerald-brand" aria-hidden />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-[.78fr_1.22fr] lg:items-end">
            <div>
              <p className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-deep-teal dark:text-cyan-accent">
                One trusted starting point
              </p>
              <h2 className="mt-4 max-w-md font-display text-3xl font-bold tracking-[-0.035em] text-petroleum dark:text-white sm:text-4xl">
                Know who you are dealing with.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground lg:justify-self-end">
              Truvis.info brings company discovery, professional events and
              selected business opportunities together — with verification as
              the entry standard, not an optional badge.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <Link
              href="/directory"
              className="group rounded-2xl border border-border bg-card p-6 transition duration-300 hover:-translate-y-1 hover:border-petroleum/20 hover:shadow-[0_20px_55px_-35px_rgba(2,48,89,.5)]"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-[#ebf4fa] text-petroleum">
                <Building2 className="size-5" aria-hidden />
              </span>
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Directory
              </p>
              <h3 className="mt-2 font-display text-xl font-bold text-petroleum dark:text-white">
                Verified companies
              </h3>
              <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">
                Review identity, services, jurisdiction and live standing
                before you make contact.
              </p>
              <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-petroleum dark:text-white">
                Browse directory
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </Link>

            <Link
              href="/events"
              className="group rounded-2xl border border-border bg-card p-6 transition duration-300 hover:-translate-y-1 hover:border-petroleum/20 hover:shadow-[0_20px_55px_-35px_rgba(2,48,89,.5)]"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-[#e8f5ef] text-emerald-brand">
                <CalendarDays className="size-5" aria-hidden />
              </span>
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Events
              </p>
              <h3 className="mt-2 font-display text-xl font-bold text-petroleum dark:text-white">
                Meet the network
              </h3>
              <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">
                Find summits, forums and focused business sessions published
                by network organizations.
              </p>
              <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-petroleum dark:text-white">
                View events
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </Link>

            <Link
              href="/marketplace"
              className="group rounded-2xl border border-border bg-card p-6 transition duration-300 hover:-translate-y-1 hover:border-petroleum/20 hover:shadow-[0_20px_55px_-35px_rgba(2,48,89,.5)]"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-[#ebf4fa] text-[#0c6e8a]">
                <BriefcaseBusiness className="size-5" aria-hidden />
              </span>
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Marketplace
              </p>
              <h3 className="mt-2 font-display text-xl font-bold text-petroleum dark:text-white">
                Selected opportunities
              </h3>
              <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">
                Review fundraises, equity and business-sale opportunities in a
                controlled introduction environment.
              </p>
              <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-petroleum dark:text-white">
                Explore marketplace
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-petroleum text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:px-10 lg:py-24">
          <div>
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-accent">
              Trust by construction
            </p>
            <h2 className="mt-4 max-w-lg font-display text-3xl font-bold tracking-[-0.035em] text-white sm:text-4xl">
              A profile is published only after verification.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/70">
              Verification happens upstream through Truvis Compliance. The
              public network then makes standing visible and useful.
            </p>

            <ol className="mt-10 space-y-7">
              {[
                ["01", "Verify", "Complete organizational identity and compliance checks."],
                ["02", "Publish", "Claim a clear public profile with services and contacts."],
                ["03", "Connect", "Share events, updates and controlled opportunities."],
              ].map(([number, title, copy]) => (
                <li key={number} className="flex gap-5">
                  <span className="font-display text-sm font-bold tracking-[0.16em] text-cyan-accent">
                    {number}
                  </span>
                  <div>
                    <h3 className="font-display text-base font-semibold text-white">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-white/65">{copy}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="https://compliance.truvis.tech"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 font-display text-sm font-semibold text-petroleum transition hover:bg-[#faf7f5]"
              >
                Start verification
                <ArrowRight className="size-4" aria-hidden />
              </a>
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/25 px-6 font-display text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Claim a profile
              </Link>
            </div>
          </div>

          <div className="relative pb-12 sm:pl-10">
            <figure className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-petroleum-deep shadow-2xl">
              <Image
                src="/photos/network-signing.jpg"
                alt="Compliance professionals reviewing business documents together"
                fill
                sizes="(min-width: 1024px) 52vw, 100vw"
                className="object-cover"
              />
            </figure>
            <figure className="absolute -bottom-2 right-2 w-[46%] overflow-hidden rounded-2xl border-[6px] border-petroleum bg-petroleum-deep shadow-2xl sm:right-auto sm:left-0">
              <Image
                src="/photos/network-forum.jpg"
                alt="Business leaders attending a focused forum in Abu Dhabi"
                width={724}
                height={543}
                className="h-auto w-full object-cover"
              />
            </figure>
          </div>
        </div>
      </section>

      {(featuredOrgs.length > 0 || nextEvent || topListing) && (
        <section className="bg-[#faf7f5] dark:bg-background">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-deep-teal dark:text-cyan-accent">
                  Live from the network
                </p>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.035em] text-petroleum dark:text-white sm:text-4xl">
                  See what is happening now.
                </h2>
              </div>
              <Link
                href="/feed"
                className="inline-flex items-center gap-2 text-sm font-semibold text-petroleum dark:text-white"
              >
                View all activity
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {featuredOrgs[0] ? (
                <Link
                  href={`/orgs/${featuredOrgs[0].slug}`}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Featured company
                    </span>
                    <ShieldCheck className="size-5 text-emerald-brand" aria-hidden />
                  </div>
                  <h3 className="mt-8 font-display text-xl font-bold text-petroleum dark:text-white">
                    {featuredOrgs[0].legal_name}
                  </h3>
                  <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-muted-foreground">
                    {featuredOrgs[0].tagline ??
                      "View its verified profile, services and public standing."}
                  </p>
                  <p className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-[#0c6e8a] dark:text-cyan-accent">
                    {featuredOrgs[0].jurisdiction ?? "Verified organization"}
                    <ArrowRight className="size-3.5" aria-hidden />
                  </p>
                </Link>
              ) : null}

              {nextEvent ? (
                <Link
                  href={
                    nextEvent.external_source === "luma" && nextEvent.luma_event_url
                      ? nextEvent.luma_event_url
                      : `/events/${nextEvent.slug}`
                  }
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Next event
                    </span>
                    <CalendarDays className="size-5 text-emerald-brand" aria-hidden />
                  </div>
                  <p className="mt-8 text-xs font-semibold text-[#0c6e8a] dark:text-cyan-accent">
                    {formatEventDate(nextEvent.starts_at)}
                  </p>
                  <h3 className="mt-2 line-clamp-2 min-h-14 font-display text-xl font-bold text-petroleum dark:text-white">
                    {nextEvent.title}
                  </h3>
                  <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" aria-hidden />
                    {nextEvent.venue_address ??
                      (nextEvent.online_url ? "Online event" : "Details inside")}
                  </p>
                </Link>
              ) : null}

              {topListing ? (
                <Link
                  href={`/marketplace/${topListing.id}`}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Opportunity
                    </span>
                    <BriefcaseBusiness className="size-5 text-emerald-brand" aria-hidden />
                  </div>
                  <p className="mt-8 text-xs font-semibold text-[#0c6e8a] dark:text-cyan-accent">
                    {LISTING_LABELS[topListing.listing_type]}
                  </p>
                  <h3 className="mt-2 line-clamp-2 min-h-14 font-display text-xl font-bold text-petroleum dark:text-white">
                    {topListing.teaser_headline}
                  </h3>
                  <p className="mt-5 text-xs text-muted-foreground">
                    {[topListing.sector, topListing.region].filter(Boolean).join(" · ") ||
                      "Identity protected until access is approved"}
                  </p>
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      )}

      <section className="relative isolate overflow-hidden bg-petroleum">
        <Image
          src="/photos/network-harbour.jpg"
          alt=""
          fill
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-petroleum-deep/95 via-petroleum/80 to-petroleum/25"
        />
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-28">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-accent">
            Built in Abu Dhabi
          </p>
          <h2 className="mt-4 max-w-2xl font-display text-3xl font-bold tracking-[-0.035em] text-white sm:text-5xl">
            Better business starts with better visibility.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/70">
            Discover credible organizations and make the first conversation
            with more context and confidence.
          </p>
          <Link
            href="/directory"
            className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 font-display text-sm font-semibold text-petroleum transition hover:bg-[#faf7f5]"
          >
            Explore the network
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      <section className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 py-16 sm:px-8 md:flex-row md:items-center lg:px-10">
          <div>
            <p className="font-display text-2xl font-bold tracking-[-0.02em] text-petroleum dark:text-white">
              Ready to make your organization visible?
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Verify once, then publish a profile built for confident discovery.
            </p>
          </div>
          <Link
            href="/signup"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-petroleum px-6 font-display text-sm font-semibold text-white transition hover:bg-petroleum-light"
          >
            Get listed
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>
    </main>
  );
}
