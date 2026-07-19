import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getManagedOrg } from "@/lib/orgs/queries";
import {
  createListing,
  setListingStatus,
  decideApplication,
} from "@/lib/marketplace/actions";
import { MarketplaceDisclaimer } from "@/components/marketplace-disclaimer";
import {
  Notice,
  inputCls,
  buttonCls,
  buttonGhostCls,
} from "@/components/form-field";

export const metadata: Metadata = { title: "Marketplace listings" };

type ListingRow = {
  id: string;
  listing_type: string;
  status: string;
  teaser_headline: string;
};

type ApplicationRow = {
  id: string;
  listing_id: string;
  status: string;
  intro_message: string | null;
  created_at: string;
  user_profiles: { display_name: string } | null;
};

const typeLabels: Record<string, string> = {
  fundraise: "Fundraise",
  equity_sale: "Equity sale",
  business_sale: "Business sale",
};

export default async function ListingsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/listings");
  const org = await getManagedOrg(supabase, user.id);
  if (!org) redirect("/dashboard");
  if (org.role !== "owner") redirect("/dashboard");

  // org_id is not API-selectable since migration 0007 (anonymity hardening);
  // owners list their listings through this SECURITY DEFINER RPC instead.
  const { data: listingsData } = await supabase.rpc("get_my_listings");
  const listings = (listingsData ?? []) as ListingRow[];

  const listingIds = listings.map((l) => l.id);
  const { data: applications } = listingIds.length
    ? await supabase
        .from("listing_applications")
        .select("id, listing_id, status, intro_message, created_at, user_profiles(display_name)")
        .in("listing_id", listingIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const apps = (applications ?? []) as unknown as ApplicationRow[];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <Link href="/dashboard" className="text-sm text-gray-500 underline underline-offset-4 dark:text-gray-400">
          ← Dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Marketplace listings
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Announce a fundraise, equity sale, or business sale. The public sees
          an anonymized teaser; full detail unlocks only for subscribers you
          approve.
        </p>
      </div>

      <MarketplaceDisclaimer />
      <Notice error={error} saved={saved} />

      <section className="rounded-2xl border border-black/10 p-6 dark:border-white/15">
        <h2 className="mb-4 font-semibold">Create a listing</h2>
        <form action={createListing} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Type
              <select name="listing_type" className={inputCls} defaultValue="fundraise">
                <option value="fundraise">Fundraise</option>
                <option value="equity_sale">Equity sale</option>
                <option value="business_sale">Business sale (full)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Teaser headline (public, anonymized)
              <input name="teaser_headline" required maxLength={140} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Sector
              <input name="sector" maxLength={80} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Region
              <input name="region" maxLength={80} placeholder="e.g. UAE" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Size band
              <input name="size_band" maxLength={40} placeholder="e.g. 51-200 staff" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Amount sought (AED, optional)
              <input name="amount_sought" type="number" min={0} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Equity offered % (optional)
              <input name="equity_percent" type="number" min={0.1} max={100} step={0.1} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Revenue band (self-declared)
              <input name="revenue_band" maxLength={60} placeholder="e.g. AED 5-10M" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Employees
              <input name="employees" maxLength={40} placeholder="e.g. 85" className={inputCls} />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Public teaser summary (no identifying details)
            <textarea name="teaser_summary" rows={2} maxLength={500} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Confidential memorandum (approved reviewers only)
            <textarea name="detail_memorandum" rows={6} maxLength={20000} className={inputCls} />
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="profitable" className="mt-1" />
            <span>The business is currently profitable</span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="attestation" required className="mt-1" />
            <span>
              I attest on behalf of the organization that the information
              provided is accurate and that I am authorized to publish this
              listing.
            </span>
          </label>
          <button type="submit" className={`${buttonCls} self-start`}>
            Create listing (draft)
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Your listings ({listings.length})</h2>
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 px-5 py-4 dark:border-white/15"
          >
            <div>
              <p className="font-medium">{listing.teaser_headline}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {typeLabels[listing.listing_type]} ·{" "}
                <span className={listing.status === "active" ? "text-emerald-600" : ""}>
                  {listing.status}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/dashboard/listings/${listing.id}`} className={buttonGhostCls}>
                Edit
              </Link>
              {listing.status === "draft" || listing.status === "paused" ? (
                <form action={setListingStatus}>
                  <input type="hidden" name="id" value={listing.id} />
                  <input type="hidden" name="status" value="active" />
                  <button className={buttonGhostCls}>Activate</button>
                </form>
              ) : listing.status === "active" ? (
                <>
                  <form action={setListingStatus}>
                    <input type="hidden" name="id" value={listing.id} />
                    <input type="hidden" name="status" value="paused" />
                    <button className={buttonGhostCls}>Pause</button>
                  </form>
                  <form action={setListingStatus}>
                    <input type="hidden" name="id" value={listing.id} />
                    <input type="hidden" name="status" value="closed" />
                    <button className={`${buttonGhostCls} text-red-600 dark:text-red-400`}>
                      Close
                    </button>
                  </form>
                </>
              ) : null}
            </div>
          </div>
        ))}
        {!listings.length ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No listings yet.</p>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Review applications ({apps.length})</h2>
        {apps.map((app) => (
          <div
            key={app.id}
            className="rounded-xl border border-black/10 px-5 py-4 dark:border-white/15"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">
                  {app.user_profiles?.display_name || "Subscriber"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(app.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                  {" · "}
                  <span
                    className={
                      app.status === "approved"
                        ? "text-emerald-600"
                        : app.status === "pending"
                          ? "text-amber-600"
                          : ""
                    }
                  >
                    {app.status}
                  </span>
                </p>
              </div>
              {app.status === "pending" ? (
                <div className="flex items-center gap-2">
                  <form action={decideApplication}>
                    <input type="hidden" name="application_id" value={app.id} />
                    <input type="hidden" name="decision" value="approve" />
                    <button className={buttonGhostCls}>Approve</button>
                  </form>
                  <form action={decideApplication}>
                    <input type="hidden" name="application_id" value={app.id} />
                    <input type="hidden" name="decision" value="reject" />
                    <button className={`${buttonGhostCls} text-red-600 dark:text-red-400`}>
                      Reject
                    </button>
                  </form>
                </div>
              ) : app.status === "approved" ? (
                <Link href={`/dashboard/applications/${app.id}`} className={buttonGhostCls}>
                  Open thread
                </Link>
              ) : null}
            </div>
            {app.intro_message ? (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                “{app.intro_message}”
              </p>
            ) : null}
          </div>
        ))}
        {!apps.length ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No applications yet.
          </p>
        ) : null}
      </section>
    </main>
  );
}
