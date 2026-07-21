import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
    <main className="flex-1">
      {/* Deal-room band — the section's dark signature surface with photography */}
      <header className="art-on-petroleum relative overflow-hidden bg-gradient-to-br from-petroleum-deep via-petroleum to-[#03427a] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-2/3 opacity-25 [mask-image:linear-gradient(to_left,black,transparent)]"
        >
          <Image
            src="/photos/network-signing.jpg"
            alt=""
            fill
            sizes="66vw"
            className="object-cover grayscale"
          />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 [mask-image:linear-gradient(to_top,black,transparent)]"
        >
          <BrandArt seed="truvis-marketplace" variant="horizon" draw />
        </div>
        <div className="relative mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-6 px-6 pb-16 pt-12 lg:px-12">
          <div className="max-w-2xl">
            <h1 className="font-display text-3xl font-bold tracking-tight">Marketplace</h1>
            <p className="mt-2 text-white/70">
              Fundraises, equity and business sales from compliance-verified
              sellers — anonymous until both sides agree.
            </p>
            <Link
              href="/pricing"
              className="link-engraved mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-brand"
            >
              Get access <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <p className="font-display text-6xl font-extrabold tabular-nums text-emerald-brand">
            {all.length}
            <span className="ml-3 align-middle text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              live opportunities
            </span>
          </p>
        </div>
        <div aria-hidden className="rule-engraved absolute inset-x-0 bottom-0" />
      </header>

      <div className="mx-auto w-full max-w-5xl px-6 pb-14 lg:px-12">
      {/* Search & facets — floats over the band edge */}
      <form
        method="GET"
        className="-mt-8 mb-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-[0_16px_40px_-24px_rgba(2,48,89,0.4)] sm:flex-row sm:items-center"
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

      {/* Type triptych — engraved quick filters */}
      <nav aria-label="Filter by opportunity type" className="mb-8 flex gap-2">
        {(
          [
            ["fundraise", "Raise", "text-emerald-deeper dark:text-emerald-brand border-emerald-brand/40 bg-emerald-brand/5"],
            ["equity_sale", "Equity", "text-cyan-700 dark:text-cyan-accent border-cyan-accent/40 bg-cyan-accent/5"],
            ["business_sale", "Sale", "text-petroleum dark:text-foreground border-petroleum/30 bg-petroleum/5"],
          ] as const
        ).map(([value, label, tint]) => (
          <Link
            key={value}
            href={type === value ? "/marketplace" : `/marketplace?type=${value}`}
            aria-pressed={type === value}
            className={`embossed inline-flex flex-col items-center gap-1 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-transform motion-safe:hover:-translate-y-0.5 ${tint} ${
              type === value ? "ring-2 ring-ring" : ""
            }`}
          >
            <span aria-hidden className="relative inline-block size-5">
              <BrandArt
                seed={`truvis-${value}`}
                variant="medallion"
                rings={2}
                accent={value === "equity_sale" ? "cyan" : "emerald"}
              />
            </span>
            {label}
          </Link>
        ))}
      </nav>

      {/* How the marketplace works — three steps, at a glance */}
      <div className="mb-8 grid gap-3 md:grid-cols-3">
        {(
          [
            ["01", "Browse sealed teasers", "Every listing comes from a verified seller; identities stay sealed by default."],
            ["02", "Subscribe and apply", "Access lets you apply to review any live opportunity in full."],
            ["03", "Reveal on approval", "When the seller approves, full detail and identity unlock for you."],
          ] as const
        ).map(([step, title, copy]) => (
          <div key={step} className="flex gap-4 rounded-xl border border-border bg-card p-4">
            <span
              aria-hidden
              className="ledger-numeral mt-0.5 shrink-0 select-none font-display text-2xl font-extrabold tracking-tight"
            >
              {step}
            </span>
            <div>
              <h2 className="text-sm font-bold text-petroleum dark:text-foreground">{title}</h2>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{copy}</p>
            </div>
          </div>
        ))}
      </div>

      {trial ? (
        <p role="status" className="mb-6 rounded-md border border-emerald-brand/30 bg-emerald-brand/5 px-4 py-3 text-sm text-emerald-deeper dark:text-emerald-brand">
          Trial activated — you can now apply to review listings.
        </p>
      ) : null}

      <div className="mb-6">
        <MarketplaceDisclaimer />
      </div>

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
            <li key={listing.id} className="reveal">
              <ListingCard listing={listing} />
            </li>
          ))}
        </ul>
      )}
      </div>
    </main>
  );
}
