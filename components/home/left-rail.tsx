import Image from "next/image";
import Link from "next/link";
import { Building2, CalendarDays, Handshake } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { BrandArt } from "@/components/brand-art";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

// Engraved header strip shared by rail cards.
function RailStrip() {
  return (
    <div className="art-on-petroleum relative h-1.5 bg-gradient-to-r from-petroleum-deep to-petroleum">
      <div aria-hidden className="rule-engraved absolute inset-x-0 bottom-0" />
    </div>
  );
}

export function JoinCard() {
  return (
    <Card className="overflow-hidden p-0">
      <RailStrip />
      <div className="flex flex-col items-center gap-3 p-5 text-center">
        <span className="art-on-petroleum relative flex size-16 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-petroleum to-petroleum-deep">
          <BrandArt seed="truvis-join" variant="medallion" accent="emerald" className="scale-125" />
        </span>
        <h2 className="font-display text-base font-bold">
          Your business card belongs here.
        </h2>
        <p className="text-xs text-muted-foreground">
          Verified organizations get a living profile across the network.
        </p>
        <Button asChild className="w-full">
          <Link href="/signup">Claim your profile</Link>
        </Button>
        <Link href="/login" className="link-engraved text-xs text-muted-foreground">
          Already verified? Sign in
        </Link>
        <ol className="mt-2 w-full border-t border-border/60 pt-3 text-left text-xs text-muted-foreground">
          {[
            "Verify on compliance.truvis.tech",
            "Claim your public profile",
            "Appear across the network",
          ].map((step, index) => (
            <li key={step} className="flex items-center gap-2 py-1">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-dark to-emerald-deeper font-display text-[10px] font-bold text-white">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}

export function ExploreCard({
  orgCount,
  eventCount,
  listingCount,
}: {
  orgCount: number;
  eventCount: number;
  listingCount: number;
}) {
  const rows = [
    { href: "/directory", Icon: Building2, label: "Directory", count: orgCount },
    { href: "/events", Icon: CalendarDays, label: "Events", count: eventCount },
    { href: "/marketplace", Icon: Handshake, label: "Marketplace", count: listingCount },
  ];
  return (
    <Card className="overflow-hidden p-0">
      <RailStrip />
      <ul className="divide-y divide-border/60">
        {rows.map(({ href, Icon, label, count }) => (
          <li key={href}>
            <Link href={href} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary">
              <Icon className="size-4 text-emerald-dark" aria-hidden />
              <span className="flex-1 text-sm font-semibold">{label}</span>
              <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function IdentityCard({
  org,
}: {
  org: {
    slug: string;
    legal_name: string;
    cover_url?: string | null;
    logo_url?: string | null;
    avg_rating?: number | null;
    review_count?: number;
    follower_count?: number;
  };
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="art-on-petroleum relative h-14 bg-gradient-to-r from-petroleum-deep via-petroleum to-[#03427a]">
        {org.cover_url ? (
          <Image src={org.cover_url} alt="" fill sizes="240px" className="object-cover opacity-80" />
        ) : (
          <BrandArt seed={org.slug} variant="card" />
        )}
        <div aria-hidden className="rule-engraved absolute inset-x-0 bottom-0" />
      </div>
      <div className="-mt-6 px-4">
        {org.logo_url ? (
          <Image
            src={org.logo_url}
            alt=""
            width={48}
            height={48}
            className="size-12 rounded-lg bg-card object-contain ring-4 ring-card"
          />
        ) : (
          <span className="flex size-12 items-center justify-center rounded-lg bg-gradient-to-br from-petroleum to-petroleum-deep font-display text-sm font-bold text-white ring-4 ring-card">
            {initials(org.legal_name)}
          </span>
        )}
      </div>
      <div className="px-4 pb-2 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/orgs/${org.slug}`} className="text-sm font-semibold hover:underline">
            {org.legal_name}
          </Link>
          <VerifiedBadge />
        </div>
        <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          {typeof org.avg_rating === "number" ? (
            <RatingStars value={org.avg_rating} count={org.review_count} size="sm" />
          ) : null}
          {typeof org.follower_count === "number"
            ? `${org.follower_count} follower${org.follower_count === 1 ? "" : "s"}`
            : null}
        </p>
      </div>
      <nav className="divide-y divide-border/60 border-t border-border/60 text-sm">
        {[
          ["/dashboard", "Dashboard"],
          ["/dashboard/posts", "Post an update"],
          ["/dashboard/events", "Your events"],
        ].map(([href, label]) => (
          <Link key={href} href={href} className="block px-4 py-2.5 transition-colors hover:bg-secondary">
            {label}
          </Link>
        ))}
      </nav>
    </Card>
  );
}

export function FollowingCard({
  following,
}: {
  following: Array<{ slug: string; legal_name: string; logo_url: string | null }>;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <RailStrip />
      <div className="px-4 pb-2 pt-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-dark">
          Following
        </h2>
      </div>
      {following.length ? (
        <ul className="divide-y divide-border/60">
          {following.map((org) => (
            <li key={org.slug}>
              <Link href={`/orgs/${org.slug}`} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-secondary">
                {org.logo_url ? (
                  <Image
                    src={org.logo_url}
                    alt=""
                    width={32}
                    height={32}
                    className="size-8 rounded bg-card object-contain ring-1 ring-border"
                  />
                ) : (
                  <span className="flex size-8 items-center justify-center rounded bg-gradient-to-br from-petroleum to-petroleum-deep text-[10px] font-bold text-white">
                    {initials(org.legal_name)}
                  </span>
                )}
                <span className="truncate text-sm">{org.legal_name}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="relative overflow-hidden px-4 py-6 text-center">
          <BrandArt seed="empty-following" variant="empty" />
          <p className="relative z-10 text-xs text-muted-foreground">
            Follow organizations to shape your feed.
          </p>
        </div>
      )}
      <div className="border-t border-border/60 px-4 py-2.5">
        <Link href="/directory" className="link-engraved text-xs font-semibold text-emerald-deeper dark:text-emerald-brand">
          Find more to follow →
        </Link>
      </div>
    </Card>
  );
}

export function NetworkLedger({
  orgCount,
  eventCount,
  listingCount,
}: {
  orgCount: number;
  eventCount: number;
  listingCount: number;
}) {
  const rows: Array<[string, number]> = [
    ["Verified organizations", orgCount],
    ["Published events", eventCount],
    ["Live opportunities", listingCount],
  ];
  return (
    <Card className="p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-dark">
        <span aria-hidden className="h-3.5 w-1 rounded-full bg-emerald-brand" />
        Network ledger
      </p>
      <dl className="mt-2 flex flex-col divide-y divide-border/60">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between py-2">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-display text-lg font-extrabold tabular-nums text-petroleum dark:text-foreground">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export function RailFooter() {
  return (
    <p className="px-2 text-xs text-muted-foreground">
      <Link href="/pricing" className="hover:underline">Pricing</Link>
      {" · "}
      <a
        href="https://compliance.truvis.tech"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        compliance.truvis.tech
      </a>
      {" · "}© Truvis
    </p>
  );
}
