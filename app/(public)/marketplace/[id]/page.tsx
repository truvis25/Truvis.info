import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { applyToReview, sendListingMessage } from "@/lib/marketplace/actions";
import { getSubscription } from "@/lib/billing/actions";
import { MarketplaceDisclaimer } from "@/components/marketplace-disclaimer";
import { inputCls, buttonCls } from "@/components/form-field";

export const dynamic = "force-dynamic";

const typeLabels: Record<string, string> = {
  fundraise: "Raising funds",
  equity_sale: "Equity for sale",
  business_sale: "Business for sale",
};

export const metadata: Metadata = { title: "Listing" };

type Detail = {
  listing_id: string;
  detail_memorandum: { text?: string } | null;
  amount_sought: number | null;
  equity_percent: number | null;
  financial_snapshot: {
    revenue_band?: string | null;
    employees?: string | null;
    profitable?: boolean;
    year?: number;
  } | null;
  org_legal_name: string;
  org_slug: string;
};

export default async function ListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; applied?: string }>;
}) {
  const { id } = await params;
  const { error, applied } = await searchParams;
  const supabase = await createClient();

  const { data: teaser } = await supabase
    .from("marketplace_listings")
    .select("id, listing_type, status, teaser_headline, sector, region, size_band, teaser_summary")
    .eq("id", id)
    .maybeSingle();
  if (!teaser || teaser.status !== "active") notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const subscription = user ? await getSubscription() : null;

  let application: { id: string; status: string } | null = null;
  let detail: Detail | null = null;
  let messages: Array<{ id: string; body: string; sender_id: string; created_at: string }> = [];

  if (user) {
    const { data: app } = await supabase
      .from("listing_applications")
      .select("id, status")
      .eq("listing_id", id)
      .eq("applicant_id", user.id)
      .maybeSingle();
    application = app;

    if (app?.status === "approved") {
      const { data: detailRows } = await supabase.rpc("get_listing_detail", {
        p_listing_id: id,
      });
      detail = (detailRows as Detail[] | null)?.[0] ?? null;
      const { data: msgs } = await supabase
        .from("listing_messages")
        .select("id, body, sender_id, created_at")
        .eq("application_id", app.id)
        .order("created_at");
      messages = msgs ?? [];
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <Link href="/marketplace" className="text-sm text-gray-500 underline underline-offset-4 dark:text-gray-400">
        ← Marketplace
      </Link>

      <header className="mt-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-foreground px-3 py-0.5 text-xs font-medium text-background">
            {typeLabels[teaser.listing_type] ?? teaser.listing_type}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {[teaser.sector, teaser.region, teaser.size_band].filter(Boolean).join(" · ")}
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {teaser.teaser_headline}
        </h1>
        {teaser.teaser_summary ? (
          <p className="text-gray-600 dark:text-gray-300">{teaser.teaser_summary}</p>
        ) : null}
      </header>

      <div className="mt-6">
        <MarketplaceDisclaimer />
      </div>

      {error ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      ) : null}
      {applied ? (
        <p className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          Application submitted — the organization will review it.
        </p>
      ) : null}

      {detail ? (
        <section className="mt-8 flex flex-col gap-6">
          <div className="rounded-2xl border border-emerald-200 p-6 dark:border-emerald-900">
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-600">
              Full detail unlocked
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              {detail.org_legal_name}
            </h2>
            <Link
              href={`/orgs/${detail.org_slug}`}
              className="text-sm underline underline-offset-4"
            >
              View verified profile
            </Link>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              {detail.amount_sought ? (
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Seeking</dt>
                  <dd className="font-medium">AED {Number(detail.amount_sought).toLocaleString()}</dd>
                </div>
              ) : null}
              {detail.equity_percent ? (
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Equity offered</dt>
                  <dd className="font-medium">{detail.equity_percent}%</dd>
                </div>
              ) : null}
              {detail.financial_snapshot?.revenue_band ? (
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Revenue band</dt>
                  <dd className="font-medium">{detail.financial_snapshot.revenue_band}</dd>
                </div>
              ) : null}
              {detail.financial_snapshot?.employees ? (
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Employees</dt>
                  <dd className="font-medium">{detail.financial_snapshot.employees}</dd>
                </div>
              ) : null}
            </dl>
            {detail.detail_memorandum?.text ? (
              <p className="mt-4 whitespace-pre-line text-sm leading-6 text-gray-700 dark:text-gray-300">
                {detail.detail_memorandum.text}
              </p>
            ) : null}
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Financial figures are self-declared by the organization and not
              verified by Truvis.
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 p-6 dark:border-white/15">
            <h3 className="font-semibold">Messages with the seller</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className={`max-w-[85%] rounded-xl px-4 py-2 text-sm ${
                    message.sender_id === user?.id
                      ? "self-end bg-foreground text-background"
                      : "self-start bg-black/5 dark:bg-white/10"
                  }`}
                >
                  {message.body}
                </li>
              ))}
              {!messages.length ? (
                <li className="text-sm text-gray-500 dark:text-gray-400">
                  No messages yet — introduce yourself.
                </li>
              ) : null}
            </ul>
            <form action={sendListingMessage} className="mt-4 flex gap-2">
              <input type="hidden" name="application_id" value={application!.id} />
              <input type="hidden" name="back" value={`/marketplace/${id}`} />
              <input
                name="body"
                required
                maxLength={2000}
                placeholder="Write a message…"
                className={`${inputCls} flex-1`}
              />
              <button className={buttonCls}>Send</button>
            </form>
          </div>
        </section>
      ) : (
        <section className="mt-8 rounded-2xl border border-black/10 p-6 dark:border-white/15">
          {!user ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <Link href={`/login?next=/marketplace/${id}`} className="font-medium underline underline-offset-4">
                Sign in
              </Link>{" "}
              and subscribe to apply for full access to this opportunity.
            </p>
          ) : application && application.status !== "withdrawn" ? (
            <p className="text-sm font-medium">
              {application.status === "pending"
                ? "Your review application is pending the organization's approval."
                : application.status === "rejected"
                  ? "The organization declined your review application."
                  : "Application status: " + application.status}
            </p>
          ) : !subscription?.active ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Full detail, seller identity, and messaging require an active
                Buyer/Investor subscription.
              </p>
              <Link href="/pricing" className={`${buttonCls} self-start`}>
                View plans
              </Link>
            </div>
          ) : (
            <form action={applyToReview} className="flex flex-col gap-4">
              <input type="hidden" name="listing_id" value={id} />
              <h3 className="font-semibold">Apply to review this opportunity</h3>
              <label className="flex flex-col gap-1 text-sm font-medium">
                Introduce yourself to the seller
                <textarea
                  name="intro_message"
                  rows={3}
                  maxLength={2000}
                  placeholder="Who you are, your mandate, and why you're interested"
                  className={inputCls}
                />
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="confidentiality" required className="mt-1" />
                <span>
                  I agree to keep all disclosed information confidential and to
                  use it solely to evaluate this opportunity.
                </span>
              </label>
              <button className={`${buttonCls} self-start`}>
                Submit application
              </button>
            </form>
          )}
        </section>
      )}
    </main>
  );
}
