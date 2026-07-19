import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MarketplaceDisclaimer } from "@/components/marketplace-disclaimer";

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
  // Teaser columns only — detail is gated behind subscription + approval
  // (MKT-2); listings of hidden orgs are filtered by RLS.
  const { data: listings } = await supabase
    .from("marketplace_listings")
    .select("id, listing_type, teaser_headline, sector, region, size_band, teaser_summary")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const list = (listings ?? []) as Teaser[];

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Marketplace</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Opportunities from compliance-verified organizations. Identities and
          full details unlock with a subscription and the seller&apos;s
          approval.
        </p>
        <div className="mt-3 text-sm">
          <Link href="/pricing" className="font-medium underline underline-offset-4">
            Get access →
          </Link>
        </div>
      </header>

      {trial ? (
        <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          Trial activated — you can now apply to review listings.
        </p>
      ) : null}

      <div className="mb-8">
        <MarketplaceDisclaimer />
      </div>

      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/15 p-10 text-center text-gray-500 dark:border-white/20 dark:text-gray-400">
          No active listings right now.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((listing) => (
            <li key={listing.id}>
              <Link
                href={`/marketplace/${listing.id}`}
                className="flex flex-col gap-2 rounded-2xl border border-black/10 p-6 transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-foreground px-3 py-0.5 text-xs font-medium text-background">
                    {typeLabels[listing.listing_type] ?? listing.listing_type}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {[listing.sector, listing.region, listing.size_band]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                <span className="text-lg font-semibold">
                  {listing.teaser_headline}
                </span>
                {listing.teaser_summary ? (
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {listing.teaser_summary}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
