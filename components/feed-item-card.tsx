import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Lock, MapPin, Video } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandArt } from "@/components/brand-art";
import { EventDateTile } from "@/components/event-date-tile";
import { OrgBusinessCard } from "@/components/org-business-card";
import { ListingCard, TYPE_THEME } from "@/components/listing-card";
import { toggleFollow } from "@/lib/orgs/actions";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/lib/home/feed";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function ActorAvatar({
  logoUrl,
  name,
  truvis = false,
}: {
  logoUrl?: string | null;
  name: string;
  truvis?: boolean;
}) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt=""
        width={40}
        height={40}
        className="size-10 rounded-lg bg-card object-contain ring-1 ring-border"
      />
    );
  }
  return (
    <span className="art-on-petroleum relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-petroleum to-petroleum-deep font-display text-sm font-bold text-white">
      <BrandArt
        seed={truvis ? "truvis-hero" : name}
        variant="medallion"
        rings={truvis ? 3 : 1}
        className="scale-[1.3] opacity-60"
      />
      <span className="relative z-10">{truvis ? "T" : initials(name)}</span>
    </span>
  );
}

function FollowControl({
  orgId,
  orgSlug,
  isFollowing,
  signedIn,
}: {
  orgId: string;
  orgSlug: string;
  isFollowing: boolean;
  signedIn: boolean;
}) {
  if (!signedIn) {
    return (
      <Link
        href="/login?next=/"
        className="inline-flex h-7 items-center rounded-full border border-border px-3 text-xs font-semibold hover:bg-secondary"
      >
        + Follow
      </Link>
    );
  }
  return (
    <form action={toggleFollow}>
      <input type="hidden" name="org_id" value={orgId} />
      <input type="hidden" name="org_slug" value={orgSlug} />
      <input type="hidden" name="following" value={isFollowing ? "1" : "0"} />
      <input type="hidden" name="return_to" value="/" />
      <Button
        size="sm"
        variant={isFollowing ? "outline" : "primary"}
        type="submit"
        className="h-7 rounded-full px-3 text-xs"
      >
        {isFollowing ? "Following ✓" : "+ Follow"}
      </Button>
    </form>
  );
}

const KIND_CHIP: Record<string, { label: string; cls: string }> = {
  post: { label: "Update", cls: "bg-emerald-brand/10 text-emerald-deeper dark:text-emerald-brand" },
  member: { label: "New member", cls: "bg-petroleum/10 text-petroleum dark:bg-white/10 dark:text-foreground" },
  event: { label: "Event", cls: "bg-cyan-accent/10 text-cyan-700 dark:text-cyan-accent" },
  notice: { label: "Notice", cls: "border border-border bg-secondary text-muted-foreground" },
};

function Shell({
  followedAccent,
  children,
}: {
  followedAccent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden p-0",
        followedAccent && "border-l-2 border-l-emerald-brand/50",
      )}
    >
      {children}
    </Card>
  );
}

function ActorRow({
  avatar,
  line1,
  line2,
  chip,
}: {
  avatar: React.ReactNode;
  line1: React.ReactNode;
  line2: React.ReactNode;
  chip: { label: string; cls: string };
}) {
  return (
    <>
      <div className="flex items-start gap-3 p-5 pb-3">
        {avatar}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold">{line1}</div>
          <p className="mt-0.5 text-xs text-muted-foreground">{line2}</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            chip.cls,
          )}
        >
          {chip.label}
        </span>
      </div>
      <div aria-hidden className="rule-engraved ml-5 max-w-[60%]" />
    </>
  );
}

function timeLabel(ts: string) {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "recently";
  return formatDate(date);
}

// One feed entry on the home network hub. Server-rendered; five bodies.
export function FeedItemCard({
  item,
  signedIn,
  followedOrgIds,
  followedAccent,
}: {
  item: FeedItem;
  signedIn: boolean;
  followedOrgIds: Set<string>;
  followedAccent: boolean;
}) {
  if (item.kind === "post") {
    const post = item.data;
    const org = post.organizations;
    return (
      <Shell followedAccent={followedAccent}>
        {followedAccent ? (
          <p className="px-5 pt-3 text-[10px] font-semibold uppercase tracking-wide text-emerald-deeper dark:text-emerald-brand">
            From your network
          </p>
        ) : null}
        <ActorRow
          avatar={<ActorAvatar logoUrl={org.logo_url} name={org.legal_name} />}
          line1={
            <>
              <Link href={`/orgs/${org.slug}`} className="truncate hover:underline">
                {org.legal_name}
              </Link>
              <VerifiedBadge />
            </>
          }
          line2={
            <>
              posted an update ·{" "}
              <time dateTime={item.ts}>{timeLabel(item.ts)}</time>
            </>
          }
          chip={KIND_CHIP.post}
        />
        <div className="px-5 pb-4 pt-3">
          <h3 className="font-display text-base font-bold leading-snug">{post.title}</h3>
          <p className="mt-1 whitespace-pre-line text-sm leading-6 text-foreground/80 line-clamp-4">
            {post.body?.text ?? ""}
          </p>
        </div>
        <div className="flex items-center gap-4 border-t border-border/60 px-5 py-2.5 text-xs">
          <Link
            href={`/orgs/${org.slug}#updates`}
            className="link-engraved font-semibold text-emerald-deeper dark:text-emerald-brand"
          >
            Read on profile →
          </Link>
          <FollowControl
            orgId={item.orgId!}
            orgSlug={org.slug}
            isFollowing={followedOrgIds.has(item.orgId!)}
            signedIn={signedIn}
          />
        </div>
      </Shell>
    );
  }

  if (item.kind === "member") {
    const member = item.data;
    return (
      <Shell followedAccent={followedAccent}>
        <ActorRow
          avatar={<ActorAvatar name="Truvis" truvis />}
          line1={<span className="truncate">Truvis Registry</span>}
          line2={
            <>
              <span className="font-semibold text-foreground">{member.legal_name}</span>{" "}
              joined the verified network ·{" "}
              <time dateTime={item.ts}>{timeLabel(item.ts)}</time>
            </>
          }
          chip={KIND_CHIP.member}
        />
        <div className="px-5 pb-4 pt-3">
          <OrgBusinessCard org={member} />
        </div>
        <div className="flex items-center gap-4 border-t border-border/60 px-5 py-2.5 text-xs">
          <Link
            href={`/orgs/${member.slug}`}
            className="link-engraved font-semibold text-emerald-deeper dark:text-emerald-brand"
          >
            View business card →
          </Link>
          <FollowControl
            orgId={item.orgId!}
            orgSlug={member.slug}
            isFollowing={followedOrgIds.has(item.orgId!)}
            signedIn={signedIn}
          />
        </div>
      </Shell>
    );
  }

  if (item.kind === "event") {
    const event = item.data;
    const isLuma = event.external_source === "luma" || !event.organizations;
    const starts = new Date(event.starts_at);
    return (
      <Shell followedAccent={followedAccent}>
        <ActorRow
          avatar={
            isLuma ? (
              <ActorAvatar name="Truvis" truvis />
            ) : (
              <ActorAvatar
                logoUrl={event.organizations!.logo_url}
                name={event.organizations!.legal_name}
              />
            )
          }
          line1={
            isLuma ? (
              <>
                <span className="truncate">Truvis community calendar</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-accent/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-700 dark:text-cyan-accent">
                  <ExternalLink className="size-3" aria-hidden />
                  via Luma
                </span>
              </>
            ) : (
              <>
                <Link
                  href={`/orgs/${event.organizations!.slug}`}
                  className="truncate hover:underline"
                >
                  {event.organizations!.legal_name}
                </Link>
                <VerifiedBadge />
              </>
            )
          }
          line2={
            <>
              is hosting an event ·{" "}
              <time dateTime={item.ts}>{timeLabel(item.ts)}</time>
            </>
          }
          chip={KIND_CHIP.event}
        />
        <div className="px-5 pb-4 pt-3">
          {event.banner_url ? (
            <div className="duotone relative mb-3 h-24 overflow-hidden rounded-lg">
              <Image
                src={event.banner_url}
                alt=""
                fill
                sizes="640px"
                className="object-cover"
              />
              <div aria-hidden className="duotone-overlay" />
            </div>
          ) : null}
          <div className="flex items-center gap-4">
            <EventDateTile date={event.starts_at} seed={event.slug} />
            <div className="min-w-0">
              <h3 className="font-display text-base font-bold leading-snug">
                <Link href={`/events/${event.slug}`} className="hover:text-emerald-deeper dark:hover:text-emerald-brand">
                  {event.title}
                </Link>
              </h3>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{formatDateTime(starts)}</span>
                {event.venue_address ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" aria-hidden /> {event.venue_address}
                  </span>
                ) : null}
                {event.online_url ? (
                  <span className="inline-flex items-center gap-1">
                    <Video className="size-3" aria-hidden /> Online
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 border-t border-border/60 px-5 py-2.5 text-xs">
          <Link
            href={`/events/${event.slug}`}
            className="link-engraved font-semibold text-emerald-deeper dark:text-emerald-brand"
          >
            View event →
          </Link>
          {isLuma && event.luma_event_url ? (
            <a
              href={event.luma_event_url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-engraved inline-flex items-center gap-1 font-semibold text-cyan-700 dark:text-cyan-accent"
            >
              Register on Luma <ExternalLink className="size-3" aria-hidden />
            </a>
          ) : null}
        </div>
      </Shell>
    );
  }

  // listing
  const listing = item.data;
  const theme = TYPE_THEME[listing.listing_type] ?? TYPE_THEME.fundraise;
  return (
    <Shell followedAccent={followedAccent}>
      <ActorRow
        avatar={
          listing.org_logo_url ? (
            <ActorAvatar logoUrl={listing.org_logo_url} name={listing.org_legal_name ?? ""} />
          ) : (
            <span className="relative flex size-10 shrink-0 items-center justify-center rounded-lg border border-border">
              <Lock aria-hidden className="size-4 text-muted-foreground" />
            </span>
          )
        }
        line1={
          listing.org_slug && listing.org_legal_name ? (
            <>
              <Link href={`/orgs/${listing.org_slug}`} className="truncate hover:underline">
                {listing.org_legal_name}
              </Link>
              <VerifiedBadge />
            </>
          ) : (
            <span className="truncate">A verified organization</span>
          )
        }
        line2={
          <>
            listed an opportunity ·{" "}
            <time dateTime={item.ts}>{timeLabel(item.ts)}</time>
          </>
        }
        chip={{ label: theme.label, cls: theme.badge }}
      />
      <div className="px-5 pb-4 pt-3">
        <ListingCard listing={listing} embedded />
      </div>
      <div className="flex items-center gap-4 border-t border-border/60 px-5 py-2.5 text-xs">
        <Link
          href={`/marketplace/${listing.id}`}
          className="link-engraved font-semibold text-emerald-deeper dark:text-emerald-brand"
        >
          Review opportunity →
        </Link>
        <Link
          href="/marketplace"
          className="link-engraved font-semibold text-muted-foreground"
        >
          All deals →
        </Link>
      </div>
    </Shell>
  );
}

// Pinned admission notice shown to anonymous visitors at the top of the feed.
export function NoticeCard() {
  return (
    <Card className="relative overflow-hidden p-0">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-5 -top-5 size-16 opacity-30"
      >
        <BrandArt seed="truvis-notice" variant="medallion" rings={3} />
      </div>
      <ActorRow
        avatar={<ActorAvatar name="Truvis" truvis />}
        line1={<span>Truvis Registry</span>}
        line2={<>to prospective members</>}
        chip={KIND_CHIP.notice}
      />
      <div className="px-5 pb-4 pt-3">
        <h3 className="font-display text-base font-bold leading-snug">
          Admissions are open
        </h3>
        <p className="mt-1 text-sm leading-6 text-foreground/80">
          Organizations verified on compliance.truvis.tech can claim a public
          profile in one step.
        </p>
      </div>
      <div className="flex items-center gap-4 border-t border-border/60 px-5 py-2.5 text-xs">
        <Button asChild size="sm" className="h-7 rounded-full px-3 text-xs">
          <Link href="/signup">Claim your profile</Link>
        </Button>
        <Link
          href="/pricing"
          className="link-engraved font-semibold text-emerald-deeper dark:text-emerald-brand"
        >
          See pricing →
        </Link>
      </div>
    </Card>
  );
}

// "From Truvis" floor cards appended when the real feed is short.
export function SystemCard({ variant }: { variant: "founding" | "marketplace" }) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div aria-hidden className="pointer-events-none absolute -right-6 -top-6 size-20 opacity-20">
        <BrandArt seed={`truvis-${variant}`} variant="medallion" rings={2} accent="emerald" />
      </div>
      <Badge variant="outline" className="mb-2">From Truvis</Badge>
      {variant === "founding" ? (
        <>
          <h3 className="font-display text-base font-bold">
            Be among the founding verified organizations
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Early members anchor the register — and every card is backed by
            vetted records.
          </p>
          <Link href="/signup" className="link-engraved mt-3 inline-block text-xs font-semibold text-emerald-deeper dark:text-emerald-brand">
            Get verified →
          </Link>
        </>
      ) : (
        <>
          <h3 className="font-display text-base font-bold">
            A marketplace where the counterparty is never a mystery
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Fundraising, equity, and acquisition opportunities from verified
            businesses only.
          </p>
          <Link href="/marketplace" className="link-engraved mt-3 inline-block text-xs font-semibold text-emerald-deeper dark:text-emerald-brand">
            Explore the marketplace →
          </Link>
        </>
      )}
    </Card>
  );
}
