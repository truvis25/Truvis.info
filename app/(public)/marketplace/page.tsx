import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Handshake, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MarketplaceDisclaimer } from "@/components/marketplace-disclaimer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Fundraising, equity and acquisition opportunities from compliance-verified businesses.",
};

export const dynamic = "force-dynamic";

const typeLabels: Record<string, string> = {
  fundraise: "Raising funds",
  equity_sale: "Equity for sale",
  business_sale: "Business for sale",
};

type Teaser = {
  id: string;
  listing_type: string;
  teaser_headline: string;
  sector: string | null;
  region: string | null;
  size_band: string | null;
  teaser_summary: string | null;
};

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ trial?: string }>;
}) {
  const { trial } = await searchParams;
  const supabase = await createClient();
  const { data: listings } = await supabase
    .from("marketplace_listings")
    .select("id, listing_type, teaser_headline, sector, region, size_band, teaser_summary")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const list = (listings ?? []) as Teaser[];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-14 lg:px-12">
      <header className="mb-6 max-w-2xl">
        <h1 className="font-display text-3xl font-bold tracking-tight text-petroleum dark:text-foreground">
          Marketplace
        </h1>
        <p className="mt-2 text-muted-foreground">
          Opportunities from compliance-verified organizations. Identities and
          full details unlock with a subscription and the seller&apos;s
          approval.
        </p>
        <Button asChild variant="link" className="mt-1 px-0">
          <Link href="/pricing">
            Get access <ArrowRight aria-hidden />
          </Link>
        </Button>
      </header>

      {trial ? (
        <p role="status" className="mb-6 rounded-md border border-emerald-brand/30 bg-emerald-brand/5 px-4 py-3 text-sm text-emerald-deeper dark:text-emerald-brand">
          Trial activated — you can now apply to review listings.
        </p>
      ) : null}

      <div className="mb-8">
        <MarketplaceDisclaimer />
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-20 text-center">
          <Handshake className="size-10 text-muted-foreground/50" aria-hidden />
          <p className="font-medium">No active listings right now.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((listing) => (
            <li key={listing.id}>
              <Link href={`/marketplace/${listing.id}`} className="group block">
                <Card className="transition-all group-hover:-translate-y-0.5 group-hover:shadow-[0_16px_40px_-16px_rgba(2,48,89,0.25)]">
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{typeLabels[listing.listing_type] ?? listing.listing_type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {[listing.sector, listing.region, listing.size_band].filter(Boolean).join(" · ")}
                      </span>
                      <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="size-3.5" aria-hidden /> Identity protected
                      </span>
                    </div>
                    <h2 className="mt-3 font-display text-lg font-bold text-petroleum transition-colors group-hover:text-emerald-deeper dark:text-foreground">
                      {listing.teaser_headline}
                    </h2>
                    {listing.teaser_summary ? (
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {listing.teaser_summary}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
