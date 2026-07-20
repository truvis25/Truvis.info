import Image from "next/image";
import Link from "next/link";
import { Building2, Lock, PieChart, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { VerifiedBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

const TYPE_THEME = {
  fundraise: {
    label: "Raising funds",
    Icon: TrendingUp,
    border: "border-l-emerald-brand",
    badge: "bg-emerald-brand/10 text-emerald-deeper dark:text-emerald-brand",
  },
  equity_sale: {
    label: "Equity for sale",
    Icon: PieChart,
    border: "border-l-cyan-accent",
    badge: "bg-cyan-accent/10 text-cyan-700 dark:text-cyan-accent",
  },
  business_sale: {
    label: "Business for sale",
    Icon: Building2,
    border: "border-l-petroleum",
    badge: "bg-petroleum/10 text-petroleum dark:bg-white/10 dark:text-foreground",
  },
} as const;

// Marketplace teaser card with a per-type accent. The card body links to the
// listing; a revealed identity renders as a separate sibling link so the org
// profile stays one click away without nesting anchors.
export function ListingCard({ listing }: { listing: PublicListing }) {
  const theme = TYPE_THEME[listing.listing_type] ?? TYPE_THEME.fundraise;
  const meta = [listing.sector, listing.region, listing.size_band]
    .filter(Boolean)
    .join(" · ");
  return (
    <Card
      className={cn(
        "relative border-l-4 p-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-16px_rgba(2,48,89,0.3)]",
        theme.border,
      )}
    >
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
            {listing.org_logo_url ? (
              <Image
                src={listing.org_logo_url}
                alt=""
                width={28}
                height={28}
                className="size-7 rounded bg-card object-contain"
              />
            ) : (
              <span className="flex size-7 items-center justify-center rounded bg-gradient-to-br from-petroleum to-petroleum-deep text-[10px] font-bold text-white">
                {listing.org_legal_name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((word) => word[0]?.toUpperCase() ?? "")
                  .join("")}
              </span>
            )}
            <span className="text-xs font-semibold">{listing.org_legal_name}</span>
            <VerifiedBadge />
          </Link>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock aria-hidden className="size-3.5" />
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
    </Card>
  );
}
