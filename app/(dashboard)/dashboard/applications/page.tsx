import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSubscription } from "@/lib/billing/actions";
import { StatusBadge } from "@/components/status-badge";
import { buttonGhostCls } from "@/components/form-field";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "My applications" };

type ApplicationRow = {
  id: string;
  status: string;
  created_at: string;
  marketplace_listings: { id: string; teaser_headline: string; listing_type: string } | null;
};

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/applications");

  const [subscription, { data: applications }] = await Promise.all([
    getSubscription(),
    supabase
      .from("listing_applications")
      .select("id, status, created_at, marketplace_listings(id, teaser_headline, listing_type)")
      .eq("applicant_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const apps = (applications ?? []) as unknown as ApplicationRow[];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <Link href="/dashboard" className="text-sm text-muted-foreground underline underline-offset-4">
          ← Dashboard
        </Link>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-petroleum dark:text-foreground">
          My review applications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {subscription?.active
            ? subscription.status === "trialing" && subscription.current_period_end
              ? `Subscription: trial, ends ${formatDate(subscription.current_period_end)}.`
              : "Subscription: active."
            : "No active subscription — "}
          {!subscription?.active ? (
            <Link href="/pricing" className="underline underline-offset-4">
              view plans
            </Link>
          ) : null}
        </p>
      </div>

      {apps.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          You haven&apos;t applied to review any listings yet.{" "}
          <Link href="/marketplace" className="underline underline-offset-4">
            Browse the marketplace
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {apps.map((app) => (
            <li
              key={app.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-5 py-4"
            >
              <div>
                <Link
                  href={`/marketplace/${app.marketplace_listings?.id}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {app.marketplace_listings?.teaser_headline ?? "Listing"}
                </Link>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  {formatDate(app.created_at)}
                  <StatusBadge status={app.status} />
                </p>
              </div>
              {app.status === "approved" ? (
                <Link
                  href={`/dashboard/applications/${app.id}`}
                  className={buttonGhostCls}
                >
                  Open thread
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
