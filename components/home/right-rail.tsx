import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, BadgeCheck, EyeOff, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/ui/badge";
import { BrandArt } from "@/components/brand-art";
import { EventDateTile } from "@/components/event-date-tile";
import { TYPE_THEME } from "@/components/listing-card";
import { toggleFollow } from "@/lib/orgs/actions";
import { LOCALE, PLATFORM_TZ, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MemberOrg, HomeEvent } from "@/lib/home/feed";
import type { PublicListing } from "@/components/listing-card";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function RailModule({
  title,
  moreHref,
  moreLabel = "All →",
  children,
}: {
  title: string;
  moreHref: string;
  moreLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-0">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-dark">
          <span aria-hidden className="h-3.5 w-1 rounded-full bg-emerald-brand" />
          {title}
        </h2>
        <Link
          href={moreHref}
          className="link-engraved text-xs font-semibold text-emerald-deeper dark:text-emerald-brand"
        >
          {moreLabel}
        </Link>
      </div>
      <div aria-hidden className="rule-engraved mx-4" />
      {children}
    </Card>
  );
}

export function OrgSpotlight({
  orgs,
  orgCount,
  followedOrgIds,
  signedIn,
}: {
  orgs: MemberOrg[];
  orgCount: number;
  followedOrgIds: Set<string>;
  signedIn: boolean;
}) {
  return (
    <RailModule title="Businesses to follow" moreHref="/directory" moreLabel={`Browse all ${orgCount} →`}>
      <ul>
        {orgs.map((org) => (
          <li key={org.slug} className="flex items-center gap-3 px-4 py-3">
            {org.logo_url ? (
              <Image
                src={org.logo_url}
                alt=""
                width={40}
                height={40}
                className="size-10 rounded-lg bg-card object-contain ring-1 ring-border"
              />
            ) : (
              <span className="art-on-petroleum relative flex size-10 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-petroleum to-petroleum-deep text-xs font-bold text-white">
                <BrandArt seed={org.slug} variant="medallion" rings={1} className="scale-125 opacity-60" />
                <span className="relative z-10">{initials(org.legal_name)}</span>
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Link href={`/orgs/${org.slug}`} className="truncate text-sm font-semibold hover:underline">
                  {org.legal_name}
                </Link>
                <VerifiedBadge />
              </div>
              <p className="text-xs text-muted-foreground">
                {org.follower_count} follower{org.follower_count === 1 ? "" : "s"}
                {org.industry_code ? ` · ${org.industry_code}` : ""}
              </p>
            </div>
            {signedIn ? (
              <form action={toggleFollow}>
                <input type="hidden" name="org_id" value={org.org_id} />
                <input type="hidden" name="org_slug" value={org.slug} />
                <input type="hidden" name="following" value={followedOrgIds.has(org.org_id) ? "1" : "0"} />
                <input type="hidden" name="return_to" value="/" />
                <Button
                  size="sm"
                  variant={followedOrgIds.has(org.org_id) ? "outline" : "primary"}
                  type="submit"
                  className="h-7 rounded-full px-3 text-xs"
                >
                  {followedOrgIds.has(org.org_id) ? (
                    <>
                      <span aria-hidden>✓</span>
                      <span className="sr-only">Following</span>
                    </>
                  ) : (
                    "+ Follow"
                  )}
                </Button>
              </form>
            ) : (
              <Link
                href="/login?next=/"
                className="inline-flex h-7 items-center rounded-full border border-border px-3 text-xs font-semibold hover:bg-secondary"
              >
                + Follow
              </Link>
            )}
          </li>
        ))}
        {orgs.length <= 1 ? (
          <li className="flex items-center gap-3 px-4 py-3">
            <span className="relative flex size-10 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border">
              <BrandArt seed="truvis-ghost" variant="medallion" rings={1} className="opacity-30" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-muted-foreground">Your organization here</p>
              <Link href="/signup" className="link-engraved text-xs font-semibold text-emerald-deeper dark:text-emerald-brand">
                Get verified →
              </Link>
            </div>
          </li>
        ) : null}
      </ul>
    </RailModule>
  );
}

export function EventsRail({
  events,
  signedIn,
}: {
  events: HomeEvent[];
  signedIn: boolean;
}) {
  const upcoming = [...events]
    .sort((a, b) => (a.starts_at < b.starts_at ? -1 : 1))
    .slice(0, 3);
  return (
    <RailModule title="Upcoming events" moreHref="/events">
      {upcoming.length ? (
        <ul className="pb-1">
          {upcoming.map((event) => (
            <li key={event.slug}>
              <Link href={`/events/${event.slug}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary">
                <EventDateTile date={event.starts_at} seed={event.slug} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.starts_at).toLocaleDateString(LOCALE, { weekday: "short", timeZone: PLATFORM_TZ })}{" "}
                    {formatTime(event.starts_at)}
                    {" · "}
                    {event.organizations?.legal_name ?? "via Luma"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="relative overflow-hidden px-4 py-8 text-center">
          <BrandArt seed="empty-events" variant="empty" />
          <p className="relative z-10 text-xs text-muted-foreground">
            No upcoming events — verified organizers publish here.
          </p>
          <Link
            href={signedIn ? "/dashboard/events" : "/signup"}
            className="link-engraved relative z-10 text-xs font-semibold text-emerald-deeper dark:text-emerald-brand"
          >
            Host an event →
          </Link>
        </div>
      )}
    </RailModule>
  );
}

export function DealRoom({ listings }: { listings: PublicListing[] }) {
  const top = listings.slice(0, 2);
  return (
    <RailModule title="Deal room" moreHref="/marketplace">
      {top.length ? (
        <ul className="pb-1">
          {top.map((listing) => {
            const theme = TYPE_THEME[listing.listing_type] ?? TYPE_THEME.fundraise;
            return (
              <li key={listing.id}>
                <Link href={`/marketplace/${listing.id}`} className="block px-4 py-3 transition-colors hover:bg-secondary">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      theme.badge,
                    )}
                  >
                    {theme.label}
                  </span>
                  <p className="mt-1 text-sm font-semibold leading-snug line-clamp-2">
                    {listing.teaser_headline}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-4 py-4 text-xs text-muted-foreground">
          Verified sellers list here first.{" "}
          <Link href="/signup" className="link-engraved font-semibold text-emerald-deeper dark:text-emerald-brand">
            Get verified →
          </Link>
        </p>
      )}
    </RailModule>
  );
}

const TRUST_POINTS = [
  { Icon: BadgeCheck, text: "Facts come from vetted documents, never self-asserted." },
  { Icon: EyeOff, text: "Lapsed compliance removes a profile automatically." },
  { Icon: Search, text: "Deal flow is pre-verified; detail unlocks with seller approval." },
];

export function TrustSeal() {
  return (
    <Card className="art-on-petroleum relative overflow-hidden bg-gradient-to-br from-petroleum-deep via-petroleum to-[#03427a] p-5 text-white">
      <div aria-hidden className="pointer-events-none absolute -bottom-8 -right-8 size-36 opacity-40">
        <BrandArt seed="truvis-trust" variant="medallion" rings={3} accent="emerald" />
      </div>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-brand">
        <ShieldCheck className="size-4" aria-hidden />
        Why every card is real
      </p>
      <ul className="mt-3 flex flex-col gap-2.5">
        {TRUST_POINTS.map(({ Icon, text }) => (
          <li key={text} className="flex items-start gap-2 text-xs leading-5 text-white/80">
            <Icon className="mt-0.5 size-3.5 shrink-0 text-emerald-brand" aria-hidden />
            {text}
          </li>
        ))}
      </ul>
      <Button asChild size="sm" className="mt-4">
        <Link href="/signup">Claim your profile</Link>
      </Button>
    </Card>
  );
}

export function GrowReach({
  postCount,
  eventCount,
  listingCount,
}: {
  postCount: number;
  eventCount: number;
  listingCount: number;
}) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-dark">
        Grow your reach
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {postCount} update{postCount === 1 ? "" : "s"} · {eventCount} event
        {eventCount === 1 ? "" : "s"} · {listingCount} listing
        {listingCount === 1 ? "" : "s"}
      </p>
      <div className="mt-3 flex flex-col gap-1.5 text-xs">
        <Link href="/dashboard/posts" className="link-engraved font-semibold text-emerald-deeper dark:text-emerald-brand">
          Share an update →
        </Link>
        <Link href="/dashboard/events" className="link-engraved font-semibold text-emerald-deeper dark:text-emerald-brand">
          Host an event →
        </Link>
        <Link href="/dashboard/listings" className="link-engraved font-semibold text-emerald-deeper dark:text-emerald-brand">
          List an opportunity →
        </Link>
      </div>
    </Card>
  );
}
