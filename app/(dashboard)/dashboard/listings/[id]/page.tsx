import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getManagedOrg } from "@/lib/orgs/queries";
import { updateListing } from "@/lib/marketplace/actions";
import { MarketplaceDisclaimer } from "@/components/marketplace-disclaimer";
import { Notice, inputCls, buttonCls } from "@/components/form-field";

export const metadata: Metadata = { title: "Edit listing" };

type Detail = {
  listing_id: string;
  detail_memorandum: { text?: string } | null;
  amount_sought: number | null;
  equity_percent: number | null;
  financial_snapshot: {
    revenue_band?: string | null;
    employees?: string | null;
    profitable?: boolean;
  } | null;
};

export default async function EditListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/listings/${id}`);
  const org = await getManagedOrg(supabase, user.id);
  if (!org || org.role !== "owner") redirect("/dashboard");

  const [{ data: teaser }, { data: detailRows }] = await Promise.all([
    supabase
      .from("marketplace_listings")
      .select("id, listing_type, status, teaser_headline, sector, region, size_band, teaser_summary, reveal_identity")
      .eq("id", id)
      .maybeSingle(),
    supabase.rpc("get_listing_detail", { p_listing_id: id }),
  ]);
  if (!teaser) notFound();
  const detail = ((detailRows as Detail[] | null) ?? [])[0] ?? null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-14 lg:px-12">
      <div>
        <Link href="/dashboard/listings" className="text-sm text-muted-foreground underline underline-offset-4">
          ← Listings
        </Link>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-petroleum dark:text-foreground">
          Edit listing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Status: {teaser.status}. Changes to an active listing are visible
          immediately.
        </p>
      </div>

      <MarketplaceDisclaimer />
      <Notice error={error} saved={saved} />

      <form action={updateListing} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
        <input type="hidden" name="id" value={teaser.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Type
            <select name="listing_type" defaultValue={teaser.listing_type} className={inputCls}>
              <option value="fundraise">Fundraise</option>
              <option value="equity_sale">Equity sale</option>
              <option value="business_sale">Business sale (full)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Teaser headline (public, anonymized)
            <input name="teaser_headline" required maxLength={140} defaultValue={teaser.teaser_headline} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Sector
            <input name="sector" maxLength={80} defaultValue={teaser.sector ?? ""} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Region
            <input name="region" maxLength={80} defaultValue={teaser.region ?? ""} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Size band
            <input name="size_band" maxLength={40} defaultValue={teaser.size_band ?? ""} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Amount sought (AED)
            <input name="amount_sought" type="number" min={0} defaultValue={detail?.amount_sought ?? ""} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Equity offered %
            <input name="equity_percent" type="number" min={0.1} max={100} step={0.1} defaultValue={detail?.equity_percent ?? ""} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Revenue band
            <input name="revenue_band" maxLength={60} defaultValue={detail?.financial_snapshot?.revenue_band ?? ""} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Employees
            <input name="employees" maxLength={40} defaultValue={detail?.financial_snapshot?.employees ?? ""} className={inputCls} />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Public teaser summary
          <textarea name="teaser_summary" rows={2} maxLength={500} defaultValue={teaser.teaser_summary ?? ""} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Confidential memorandum
          <textarea name="detail_memorandum" rows={6} maxLength={20000} defaultValue={detail?.detail_memorandum?.text ?? ""} className={inputCls} />
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="profitable" defaultChecked={Boolean(detail?.financial_snapshot?.profitable)} className="mt-1" />
          <span>The business is currently profitable</span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="reveal_identity" defaultChecked={Boolean(teaser.reveal_identity)} className="mt-1" />
          <span>
            Reveal our identity on the public teaser (shows your logo, name,
            and a link to your verified profile — leave off to stay anonymous
            until you approve a reviewer)
          </span>
        </label>
        <button type="submit" className={`${buttonCls} self-start`}>Save changes</button>
      </form>
    </main>
  );
}
