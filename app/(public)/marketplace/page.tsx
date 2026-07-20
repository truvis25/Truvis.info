import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Handshake } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MarketplaceDisclaimer } from "@/components/marketplace-disclaimer";
import { ListingCard, type PublicListing } from "@/components/listing-card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Fundraising, equity and acquisition opportunities from compliance-verified businesses.",
};

export const dynamic = "force-dynamic";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ trial?: string }>;
}) {
  const { trial } = await searchParams;
  const supabase = await createClient();
  // Anonymity-safe listing feed: identity fields come back non-null only for
  // listings whose owner opted into reveal_identity.
  const { data: listings } = await supabase.rpc("get_public_listings");

  const list = (listings ?? []) as PublicListing[];

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
              <ListingCard listing={listing} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
