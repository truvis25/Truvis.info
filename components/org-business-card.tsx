import Image from "next/image";
import Link from "next/link";
import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating-stars";

// Row shape returned by the search_orgs RPC (directory + home featured strip).
export type DirectoryOrg = {
  slug: string;
  legal_name: string;
  tagline: string | null;
  jurisdiction: string | null;
  industry_code: string | null;
  size_band: string | null;
  logo_url: string | null;
  cover_url: string | null;
  avg_rating: number | null;
  review_count: number;
  follower_count: number;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

// The organization "business card": cover strip, overlapping logo, verified
// mark, key facts, and social proof (rating + followers). Whole card links
// to the org's public profile.
export function OrgBusinessCard({ org }: { org: DirectoryOrg }) {
  const chips = [org.jurisdiction, org.industry_code, org.size_band].filter(
    (chip): chip is string => Boolean(chip),
  );
  return (
    <Link href={`/orgs/${org.slug}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_16px_40px_-16px_rgba(2,48,89,0.35)]">
        <div className="relative h-20 shrink-0 bg-gradient-to-r from-petroleum-deep via-petroleum to-[#03427a]">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 85% 20%, rgba(16,185,129,0.35), transparent 55%), radial-gradient(circle at 15% 90%, rgba(6,182,212,0.3), transparent 45%)",
            }}
          />
          {org.cover_url ? (
            <>
              <Image
                src={org.cover_url}
                alt=""
                fill
                sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                className="object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-petroleum-deep/60 to-transparent" />
            </>
          ) : null}
        </div>
        <div className="-mt-7 px-5">
          {org.logo_url ? (
            <Image
              src={org.logo_url}
              alt=""
              width={56}
              height={56}
              className="size-14 rounded-lg bg-card object-contain shadow-md ring-4 ring-card"
            />
          ) : (
            <span className="flex size-14 items-center justify-center rounded-lg bg-gradient-to-br from-petroleum to-petroleum-deep font-display text-lg font-bold text-white shadow-md ring-4 ring-card">
              {initials(org.legal_name)}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 px-5 pb-4 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-base font-bold leading-snug text-petroleum transition-colors group-hover:text-emerald-deeper dark:text-foreground dark:group-hover:text-emerald-brand">
              {org.legal_name}
            </h2>
            <VerifiedBadge />
          </div>
          <p className="min-h-10 text-sm leading-5 text-muted-foreground line-clamp-2">
            {org.tagline ?? "Verified organization on Truvis."}
          </p>
          {chips.length ? (
            <div className="flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <Badge key={chip} variant="outline" className="font-medium">
                  {chip}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-between border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
          {org.review_count > 0 ? (
            <span className="flex items-center gap-1.5">
              <RatingStars value={org.avg_rating} count={org.review_count} size="sm" />
              <span className="font-semibold text-foreground">{org.avg_rating}</span>
              <span>({org.review_count})</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <RatingStars value={null} size="sm" />
              <span>New</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users aria-hidden className="size-3.5" />
            <span>
              {org.follower_count}
              <span className="sr-only"> followers</span>
            </span>
          </span>
        </div>
      </Card>
    </Link>
  );
}
