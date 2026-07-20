import Image from "next/image";
import Link from "next/link";
import { Building2, Lock, PieChart, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { VerifiedBadge } from "@/components/ui/badge";
import { BrandArt } from "@/components/brand-art";
import { cn } from "@/lib/utils";

// Static engraved octagon frame for the "Identity protected" lock.
const OCTAGON =
  "M8.2 2h7.6l5.4 5.4v7.6l-5.4 5.4H8.2l-5.4-5.4V8.2z";

// Row shape returned by the get_public_listings RPC. Identity fields are
// null unless the listing owner opted into reveal_identity.
export type PublicListing = {
  id: string;
  listing_type: "fundraise" | "equity_sale" | "business_sale";
  teaser_headline: string;
  sector: string | null;
  region: string | null;
  size_band: string | null;
  teaser_summary: string | null;
  created_at: string;
  reveal_identity: boolean;
  org_slug: string | null;
  org_legal_name: string | null;
  org_logo_url: string | null;
};

export const TYPE_THEME = {
  fundraise: {
    label: "Raising funds",
    Icon: TrendingUp,
    border: "border-l-emerald-brand/40",
    badge: "bg-emerald-brand/10 text-emerald-deeper dark:text-emerald-brand",
    strip: "text-emerald-brand",
    accent: "emerald" as const,
    tileIcon: "text-emerald-brand",
  },
  equity_sale: {
    label: "Equity for sale",
    Icon: PieChart,
    border: "border-l-cyan-accent/40",
    badge: "bg-cyan-accent/10 text-cyan-700 dark:text-cyan-accent",
    strip: "text-cyan-accent",
    accent: "cyan" as const,
    tileIcon: "text-cyan-accent",
  },
  business_sale: {
    label: "Business for sale",
    Icon: Building2,
    border: "border-l-petroleum/40",
    badge: "bg-petroleum/10 text-petroleum dark:bg-white/10 dark:text-foreground",
    strip: "text-petroleum dark:text-foreground/40",
    accent: "line" as const,
    tileIcon: "text-emerald-brand",
  },
} as const;

// Marketplace teaser card with a per-type accent and a prominent visual
// tile: the org's real logo when identity is revealed, an engraved seal
// stamp otherwise (anonymity preserved — the art is seeded from the listing
// id, not the org). Card body links to the listing; a revealed identity
// renders as a separate sibling link.
export function ListingCard({
  listing,
  embedded = false,
}: {
  listing: PublicListing;
  embedded?: boolean;
}) {
  const theme = TYPE_THEME[listing.listing_type] ?? TYPE_THEME.fundraise;
  const meta = [listing.sector, listing.region, listing.size_band]
    .filter(Boolean)
    .join(" · ");
  const Shell = embedded ? "div" : Card;
  return (
    <Shell
      className={cn(
        "relative overflow-hidden border-l-4",
        embedded
          ? "rounded-lg bg-transparent p-4"
          : "p-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-16px_rgba(2,48,89,0.3)]",
        theme.border,
      )}
    >
      {/* Perforated security strip along the accent edge */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-1 bg-[repeating-linear-gradient(180deg,currentColor_0_5px,transparent_5px_8px)]",
          theme.strip,
        )}
      />
      <div className="flex gap-5">
        {/* Visual tile: real logo when revealed, engraved seal otherwise */}
        <div className="art-on-petroleum relative hidden size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-petroleum to-petroleum-deep shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] sm:flex">
          {listing.org_logo_url ? (
            <Image
              src={listing.org_logo_url}
              alt=""
              fill
              sizes="80px"
              className="bg-card object-contain p-1.5"
            />
          ) : (
            <>
              <BrandArt
                seed={listing.id}
                variant="medallion"
                accent={theme.accent}
                className="scale-[1.15] opacity-90"
              />
              <theme.Icon
                aria-hidden
                className={cn("relative z-10 size-6", theme.tileIcon)}
              />
            </>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  theme.badge,
                )}
              >
                <theme.Icon aria-hidden className="size-3.5" />
                {theme.label}
              </span>
              {meta ? (
                <span className="text-xs text-muted-foreground">{meta}</span>
              ) : null}
            </div>
            {listing.org_slug && listing.org_legal_name ? (
              <Link
                href={`/orgs/${listing.org_slug}`}
                className="relative z-10 flex items-center gap-2 rounded-lg border border-border/60 px-2.5 py-1.5 transition-colors hover:border-emerald-brand/40 hover:bg-emerald-brand/5"
              >
                <span className="text-xs font-semibold">{listing.org_legal_name}</span>
                <VerifiedBadge />
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="relative inline-flex size-6 items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden
                    className="absolute inset-0"
                  >
                    <path
                      d={OCTAGON}
                      fill="none"
                      stroke="var(--art-line-strong)"
                      strokeWidth="1"
                    />
                  </svg>
                  <Lock aria-hidden className="size-3" />
                </span>
                Identity protected
              </span>
            )}
          </div>
          <h2 className="mt-3 font-display text-lg font-bold leading-snug">
            <Link
              href={`/marketplace/${listing.id}`}
              className="after:absolute after:inset-0 after:content-[''] hover:text-emerald-deeper dark:hover:text-emerald-brand"
            >
              {listing.teaser_headline}
            </Link>
          </h2>
          {listing.teaser_summary ? (
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground line-clamp-2">
              {listing.teaser_summary}
            </p>
          ) : null}
        </div>
      </div>
    </Shell>
  );
}
