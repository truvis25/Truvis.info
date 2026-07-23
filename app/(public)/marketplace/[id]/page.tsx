import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { applyToReview, sendListingMessage } from "@/lib/marketplace/actions";
import { getSubscription } from "@/lib/billing/actions";
import Image from "next/image";
import { MarketplaceDisclaimer } from "@/components/marketplace-disclaimer";
import { VerifiedBadge } from "@/components/ui/badge";
import type { PublicListing } from "@/components/listing-card";
import { inputCls, buttonCls } from "@/components/form-field";
import { formatAed } from "@/lib/format";
import { SectionHeading } from "@/components/section-heading";

export const dynamic = "force-dynamic";

const typeLabels: Record<string, string> = {
  fundraise: "Raising funds",
  equity_sale: "Equity for sale",
  business_sale: "Business for sale",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: teaser } = await supabase
    .from("marketplace_listings")
    .select("teaser_headline, teaser_summary, status")
    .eq("id", id)
    .maybeSingle();
  if (!teaser || teaser.status !== "active") return { title: "Listing" };
  const description = teaser.teaser_summary?.slice(0, 160) || undefined;
  return {
    title: teaser.teaser_headline,
    description,
    openGraph: { title: teaser.teaser_headline, description },
  };
}

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

  const [{ data: teaser }, { data: publicRows }] = await Promise.all([
    supabase
      .from("marketplace_listings")
      .select("id, listing_type, status, teaser_headline, sector, region, size_band, teaser_summary")
      .eq("id", id)
      .maybeSingle(),
    // Opt-in identity reveal: org fields are non-null only when the owner
    // enabled reveal_identity on this listing.
    supabase.rpc("get_public_listings", { p_listing_id: id }),
  ]);
  if (!teaser || teaser.status !== "active") notFound();
  const identity = ((publicRows ?? []) as PublicListing[])[0] ?? null;

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
      <Link href="/marketplace" className="link-engraved text-sm text-muted-foreground">
        ← Marketplace
      </Link>

      <header className="mt-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-petroleum px-3 py-0.5 text-xs font-semibold text-white">
            {typeLabels[teaser.listing_type] ?? teaser.listing_type}
          </span>
          <span className="text-xs text-muted-foreground">
            {[teaser.sector, teaser.region, teaser.size_band].filter(Boolean).join(" · ")}
          </span>
        </div>
        {identity?.org_slug && identity.org_legal_name ? (
          <Link
            href={`/orgs/${identity.org_slug}`}
            className="flex w-fit items-center gap-2.5 rounded-xl border border-border px-3 py-2 transition-colors hover:border-emerald-brand/40 hover:bg-emerald-brand/5"
          >
            {identity.org_logo_url ? (
              <Image
                src={identity.org_logo_url}
                alt=""
                width={32}
                height={32}
                className="size-8 rounded bg-card object-contain"
              />
            ) : (
              <span className="flex size-8 items-center justify-center rounded bg-gradient-to-br from-petroleum to-petroleum-deep text-xs font-bold text-white">
                {identity.org_legal_name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="text-sm">
              <span className="block text-xs text-muted-foreground">Listed by</span>
              <span className="font-semibold">{identity.org_legal_name}</span>
            </span>
            <VerifiedBadge />
          </Link>
        ) : null}
        <h1 className="font-display text-3xl font-bold tracking-tight text-petroleum dark:text-foreground">
          {teaser.teaser_headline}
        </h1>
        {teaser.teaser_summary ? (
          <p className="text-muted-foreground">{teaser.teaser_summary}</p>
        ) : null}
      </header>

      <div className="mt-6">
        <MarketplaceDisclaimer />
      </div>

      {error ? (
        <p className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {applied ? (
        <p className="mt-6 rounded-lg border border-emerald-brand/30 bg-emerald-brand/5 px-4 py-3 text-sm text-emerald-deeper dark:text-emerald-brand">
          Application submitted — the organization will review it.
        </p>
      ) : null}

      {detail ? (
        <section className="mt-8 flex flex-col gap-6">
          <div className="rounded-2xl border border-emerald-200 p-6 dark:border-emerald-900">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-dark">
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
                  <dt className="text-muted-foreground">Seeking</dt>
                  <dd className="font-medium">{formatAed(detail.amount_sought)}</dd>
                </div>
              ) : null}
              {detail.equity_percent ? (
                <div>
                  <dt className="text-muted-foreground">Equity offered</dt>
                  <dd className="font-medium">{detail.equity_percent}%</dd>
                </div>
              ) : null}
              {detail.financial_snapshot?.revenue_band ? (
                <div>
                  <dt className="text-muted-foreground">Revenue band</dt>
                  <dd className="font-medium">{detail.financial_snapshot.revenue_band}</dd>
                </div>
              ) : null}
              {detail.financial_snapshot?.employees ? (
                <div>
                  <dt className="text-muted-foreground">Employees</dt>
                  <dd className="font-medium">{detail.financial_snapshot.employees}</dd>
                </div>
              ) : null}
            </dl>
            {detail.detail_memorandum?.text ? (
              <p className="mt-4 whitespace-pre-line text-sm leading-6 text-foreground/80">
                {detail.detail_memorandum.text}
              </p>
            ) : null}
            <p className="mt-3 text-xs text-muted-foreground">
              Financial figures are self-declared by the organization and not
              verified by Truvis.
            </p>
          </div>

          <div className="rounded-2xl border border-border p-6">
            <SectionHeading as="h3" size="md">Messages with the seller</SectionHeading>
            <ul className="mt-4 flex flex-col gap-3">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className={`max-w-[85%] rounded-xl px-4 py-2 text-sm ${
                    message.sender_id === user?.id
                      ? "self-end bg-petroleum text-white"
                      : "self-start bg-secondary"
                  }`}
                >
                  {message.body}
                </li>
              ))}
              {!messages.length ? (
                <li className="text-sm text-muted-foreground">
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
                aria-label="Message to the listing owner"
                className={`${inputCls} flex-1`}
              />
              <button className={buttonCls}>Send</button>
            </form>
          </div>
        </section>
      ) : (
        <section className="mt-8 rounded-2xl border border-border p-6">
          {!user ? (
            <p className="text-sm text-muted-foreground">
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
              <p className="text-sm text-muted-foreground">
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
              <SectionHeading as="h3" size="md">Apply to review this opportunity</SectionHeading>
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
