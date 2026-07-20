import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Handshake, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MarketplaceDisclaimer } from "@/components/marketplace-disclaimer";
import { ListingCard, type PublicListing } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { BrandArt } from "@/components/brand-art";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Fundraising, equity and acquisition opportunities from compliance-verified businesses.",
};

export const dynamic = "force-dynamic";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ trial?: string; q?: string; type?: string; sector?: string; region?: string }>;
}) {
  const { trial, q, type, sector, region } = await searchParams;
  const supabase = await createClient();
  // Anonymity-safe listing feed: identity fields come back non-null only for
  // listings whose owner opted into reveal_identity. Second unfiltered call
  // supplies the facet option lists.
  const [{ data: listings }, { data: allListings }] = await Promise.all([
    supabase.rpc("get_public_listings", {
      p_query: q ?? null,
      p_type: type ?? null,
      p_sector: sector ?? null,
      p_region: region ?? null,
    }),
    supabase.rpc("get_public_listings"),
  ]);

  const list = (listings ?? []) as PublicListing[];
  const all = (allListings ?? []) as PublicListing[];
  const sectors = [...new Set(all.map((l) => l.sector).filter(Boolean))] as string[];
  const regions = [...new Set(all.map((l) => l.region).filter(Boolean))] as string[];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-14 lg:px-12">
      <header className="mb-6 max-w-2xl">
        <h1 className="font-display text-3xl font-bold tracking-tight text-petroleum dark:text-foreground">
          Marketplace
        </h1>
        <p className="mt-2 text-muted-foreground">
          Opportunities from compliance-verified organizations. Identities and
          full details unlock with a subscription and the seller&apos;s
          approval — some sellers choose to disclose their identity up front.
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

      <div className="mb-6">
        <MarketplaceDisclaimer />
      </div>

      {/* Search & facets */}
      <form
        method="GET"
        className="mb-8 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center"
        role="search"
        aria-label="Search the marketplace"
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search opportunities…"
            aria-label="Search listings"
            className="pl-9"
          />
        </div>
        <Select name="type" defaultValue={type ?? ""} aria-label="Filter by type" className="sm:w-44">
          <option value="">All types</option>
          <option value="fundraise">Raising funds</option>
          <option value="equity_sale">Equity for sale</option>
          <option value="business_sale">Business for sale</option>
        </Select>
        <Select name="sector" defaultValue={sector ?? ""} aria-label="Filter by sector" className="sm:w-40">
          <option value="">All sectors</option>
          {sectors.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select name="region" defaultValue={region ?? ""} aria-label="Filter by region" className="sm:w-36">
          <option value="">All regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </Select>
        <Button type="submit" variant="primary">Search</Button>
      </form>

      {list.length === 0 ? (
        <div className="relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-border py-20 text-center">
          <BrandArt seed="empty-marketplace" variant="empty" />
          <Handshake className="relative z-10 size-10 text-muted-foreground/50" aria-hidden />
          <p className="relative z-10 font-medium">
            {q || type || sector || region
              ? "No listings match your search."
              : "No active listings right now."}
          </p>
          {q || type || sector || region ? (
            <Link
              href="/marketplace"
              className="link-engraved relative z-10 text-sm font-medium text-emerald-dark"
            >
              Clear the filters
            </Link>
          ) : null}
          <Button asChild variant="outline" size="sm" className="relative z-10">
            <Link href="/signup">Post an opportunity</Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((listing) => (
            <li key={listing.id}>
              <ListingCard listing={listing} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
