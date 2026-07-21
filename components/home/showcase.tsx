import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Handshake,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BrandArt } from "@/components/brand-art";
import { SealBadge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { EventDateTile } from "@/components/event-date-tile";
import { TYPE_THEME, type PublicListing } from "@/components/listing-card";
import type { HomeEvent, MemberOrg } from "@/lib/home/feed";

// Anonymous-home explainer sections. Photography lives in /public/photos —
// branded placeholders generated in-repo; overwrite the same filenames with
// real photos to swap them (see public/photos/README.md).

/* ------------------------------ Hero photo ------------------------------ */

export function HeroShowcase({ orgCount }: { orgCount: number }) {
  return (
    // Decorative: the register count is already announced in the hero stats.
    <div aria-hidden className="relative hidden w-full max-w-sm shrink-0 lg:block">
      <div className="absolute inset-0 translate-x-4 translate-y-4 rotate-2 rounded-2xl border border-white/15 bg-white/5" />
      <figure className="group relative -rotate-1 overflow-hidden rounded-2xl border border-white/20 bg-petroleum-deep shadow-[0_32px_64px_-24px_rgba(1,21,39,0.85)] transition-transform duration-300 motion-safe:hover:rotate-0">
        <div className="duotone relative aspect-[4/3]">
          <Image
            src="/photos/hero-summit.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 384px, 0px"
            className="object-cover"
          />
          <div aria-hidden className="duotone-overlay" />
        </div>
        <figcaption className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/60">
            The verified network
          </span>
          <span className="font-display text-sm font-extrabold text-emerald-brand">
            {orgCount} on the register
          </span>
        </figcaption>
      </figure>
      <SealBadge seed="truvis-hero-seal" className="absolute -right-5 -top-5" />
    </div>
  );
}

/* --------------------------- Section heading ---------------------------- */

function SectionHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-deeper dark:text-emerald-brand">
        <span aria-hidden className="relative inline-block size-3">
          <BrandArt seed="truvis-hero" variant="medallion" rings={1} accent="emerald" />
        </span>
        {eyebrow}
        <span aria-hidden className="relative inline-block size-3">
          <BrandArt seed="truvis-hero" variant="medallion" rings={1} accent="emerald" />
        </span>
      </p>
      <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-petroleum dark:text-foreground sm:text-3xl">
        {title}
      </h2>
      <p className="mt-2 text-muted-foreground">{copy}</p>
    </div>
  );
}

/* --------------------------- Pillar triptych ---------------------------- */

const PILLARS = {
  directory: {
    Icon: Building2,
    chip: "text-emerald-deeper dark:text-emerald-brand border-emerald-brand/40 bg-emerald-brand/5",
    accent: "emerald" as const,
  },
  events: {
    Icon: CalendarDays,
    chip: "text-cyan-700 dark:text-cyan-accent border-cyan-accent/40 bg-cyan-accent/5",
    accent: "cyan" as const,
  },
  marketplace: {
    Icon: Handshake,
    chip: "text-petroleum dark:text-foreground border-petroleum/30 bg-petroleum/5",
    accent: "emerald" as const,
  },
};

function PillarCard({
  pillar,
  href,
  title,
  count,
  countLabel,
  copy,
  cta,
  children,
}: {
  pillar: keyof typeof PILLARS;
  href: string;
  title: string;
  count: number;
  countLabel: string;
  copy: string;
  cta: string;
  children: React.ReactNode;
}) {
  const { Icon, chip } = PILLARS[pillar];
  return (
    <Link href={href} className="group block h-full">
      <Card className="flex h-full flex-col p-6 transition duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_16px_40px_-16px_rgba(2,48,89,0.35)]">
        <div className="flex items-center justify-between gap-3">
          <span
            className={`embossed relative inline-flex size-11 items-center justify-center rounded-xl border ${chip}`}
          >
            <span aria-hidden className="pointer-events-none absolute inset-1 opacity-60">
              <BrandArt
                seed={`truvis-pillar-${pillar}`}
                variant="medallion"
                rings={2}
                accent={PILLARS[pillar].accent}
              />
            </span>
            <Icon className="relative size-5" aria-hidden />
          </span>
          <span className="font-display text-2xl font-extrabold tabular-nums text-petroleum dark:text-foreground">
            {count}
            <span className="ml-1.5 align-middle text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              {countLabel}
            </span>
          </span>
        </div>
        <h3 className="mt-4 font-display text-lg font-bold text-petroleum dark:text-foreground">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{copy}</p>
        <div aria-hidden className="rule-engraved my-4" />
        <div className="min-h-16 flex-1">{children}</div>
        <p className="link-engraved mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-deeper dark:text-emerald-brand">
          {cta} <ArrowRight className="size-4" aria-hidden />
        </p>
      </Card>
    </Link>
  );
}

function OrgMonogram({ org }: { org: Pick<MemberOrg, "legal_name" | "logo_url"> }) {
  return org.logo_url ? (
    <Image
      src={org.logo_url}
      alt=""
      width={36}
      height={36}
      className="size-9 shrink-0 rounded-lg border border-border bg-white object-contain p-0.5"
    />
  ) : (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-petroleum to-petroleum-deep text-xs font-bold text-white">
      {org.legal_name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function PillarTriptych({
  topOrg,
  nextEvent,
  topListing,
  orgCount,
  eventCount,
  listingCount,
}: {
  topOrg?: MemberOrg;
  nextEvent?: HomeEvent;
  topListing?: PublicListing;
  orgCount: number;
  eventCount: number;
  listingCount: number;
}) {
  const listingTheme = topListing ? TYPE_THEME[topListing.listing_type] : null;
  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <SectionHeading
          eyebrow="One standard, three registers"
          title="Everything here is published by a verified business"
          copy="Truvis.info is three public registers in one place — browse companies, meet them at events, and review their opportunities."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="reveal">
            <PillarCard
              pillar="directory"
              href="/directory"
              title="Business Directory"
              count={orgCount}
              countLabel="verified"
              copy="Engraved business cards for every organization — profile, catalogue, reviews and standing."
              cta="Browse the directory"
            >
              {topOrg ? (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3">
                  <OrgMonogram org={topOrg} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-petroleum dark:text-foreground">
                      {topOrg.legal_name}
                    </p>
                    <RatingStars value={topOrg.avg_rating} count={topOrg.review_count} />
                  </div>
                  <ShieldCheck className="ml-auto size-4 shrink-0 text-emerald-brand" aria-hidden />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  The first business cards are being engraved now.
                </p>
              )}
            </PillarCard>
          </div>
          <div className="reveal">
            <PillarCard
              pillar="events"
              href="/events"
              title="Events"
              count={eventCount}
              countLabel="published"
              copy="Summits, forums and open days hosted by the network — plus community events via Lu.ma."
              cta="See what's on"
            >
              {nextEvent ? (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3">
                  <EventDateTile date={nextEvent.starts_at} seed={nextEvent.slug} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-petroleum dark:text-foreground">
                      {nextEvent.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {nextEvent.venue_address ?? (nextEvent.online_url ? "Online" : "Details inside")}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  The next gathering will be announced here.
                </p>
              )}
            </PillarCard>
          </div>
          <div className="reveal">
            <PillarCard
              pillar="marketplace"
              href="/marketplace"
              title="Marketplace"
              count={listingCount}
              countLabel="live"
              copy="Fundraises, equity and business sales from vetted sellers — anonymous until both sides agree."
              cta="Review opportunities"
            >
              {topListing && listingTheme ? (
                <div className="rounded-xl border border-border bg-secondary/40 p-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${listingTheme.badge}`}
                  >
                    <listingTheme.Icon className="size-3.5" aria-hidden />
                    {listingTheme.label}
                  </span>
                  <p className="mt-2 truncate text-sm font-semibold text-petroleum dark:text-foreground">
                    {topListing.teaser_headline}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  New opportunities are prepared under seal.
                </p>
              )}
            </PillarCard>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- How it works ----------------------------- */

const STEPS = [
  {
    Icon: ShieldCheck,
    title: "Verified upstream",
    copy: "Every organization passes onboarding and continuous checks on the Truvis Compliance platform before it can appear here.",
  },
  {
    Icon: BadgeCheck,
    title: "Claims its public card",
    copy: "One step publishes the engraved business card — logo, catalogue, contacts and a live certificate of standing.",
  },
  {
    Icon: Handshake,
    title: "Does business in the open",
    copy: "Posts updates, hosts events and lists marketplace opportunities. If standing lapses, the listing is paused automatically.",
  },
] as const;

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="border-t border-border">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-deeper dark:text-emerald-brand">
            <span aria-hidden className="relative inline-block size-3">
              <BrandArt seed="truvis-hero" variant="medallion" rings={1} accent="emerald" />
            </span>
            How admission works
          </p>
          <h2
            id="how-title"
            className="mt-3 font-display text-2xl font-bold tracking-tight text-petroleum dark:text-foreground sm:text-3xl"
          >
            No self-declared profiles. Every entry is earned.
          </h2>
          <ol className="mt-8 space-y-7">
            {STEPS.map((step, index) => (
              <li key={step.title} className="reveal relative flex gap-5">
                <span
                  aria-hidden
                  className="ledger-numeral mt-0.5 shrink-0 select-none font-display text-3xl font-extrabold tracking-tight"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="flex items-center gap-2 font-display text-base font-bold text-petroleum dark:text-foreground">
                    <step.Icon className="size-4 text-emerald-brand" aria-hidden />
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.copy}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-8 rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
            <span className="font-semibold text-petroleum dark:text-foreground">
              Visiting?
            </span>{" "}
            Browsing is free — follow organizations, register for events and
            request access to marketplace deals.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <a href="https://compliance.truvis.tech" target="_blank" rel="noopener noreferrer">
                Start verification
                <ArrowRight aria-hidden />
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link href="/signup">Claim your profile</Link>
            </Button>
          </div>
        </div>
        {/* Photo collage — placeholders, replace files in /public/photos */}
        <div aria-hidden className="relative hidden pb-10 pl-8 lg:block">
          <figure className="duotone relative aspect-[4/3] overflow-hidden rounded-2xl border border-border shadow-[0_24px_48px_-24px_rgba(2,48,89,0.45)]">
            <Image
              src="/photos/network-signing.jpg"
              alt=""
              fill
              sizes="(min-width: 1024px) 560px, 0px"
              className="object-cover"
            />
            <div aria-hidden className="duotone-overlay" />
          </figure>
          <figure className="duotone absolute -bottom-0 left-0 w-1/2 overflow-hidden rounded-2xl border-4 border-background shadow-[0_24px_48px_-24px_rgba(2,48,89,0.6)]">
            <Image
              src="/photos/network-forum.jpg"
              alt=""
              width={600}
              height={450}
              className="h-auto w-full object-cover"
            />
            <div aria-hidden className="duotone-overlay" />
          </figure>
          <SealBadge seed="truvis-admission" className="absolute -top-5 right-6" />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Photo band ------------------------------ */

export function PhotoBand() {
  return (
    <section
      aria-label="Meet the network in person"
      className="group relative overflow-hidden border-y border-border"
    >
      <div className="duotone absolute inset-0">
        <Image
          src="/photos/network-harbour.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div aria-hidden className="duotone-overlay" />
      </div>
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-petroleum-deep/90 via-petroleum/60 to-transparent"
      />
      <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-4 px-6 py-20 lg:px-8">
        <p className="font-display text-2xl font-bold leading-snug tracking-tight text-white sm:text-3xl">
          Trust is the shortest distance
          <br />
          between two businesses.
        </p>
        <p className="max-w-md text-sm text-white/75">
          Meet the register in person — summits, forums and signings across the
          Gulf, published by verified hosts.
        </p>
        <Button asChild size="lg" className="mt-2">
          <Link href="/events">
            Browse events
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}

/* ------------------------- Hub section heading -------------------------- */

export function LiveNetworkHeading() {
  return (
    <div className="mx-auto max-w-7xl px-6 pt-12 lg:px-8">
      <SectionHeading
        eyebrow="Live from the network"
        title="The register, right now"
        copy="Real posts, events and opportunities from verified organizations — updated continuously."
      />
    </div>
  );
}
