import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSubscription } from "@/lib/billing/actions";

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
        <Link href="/dashboard" className="text-sm text-gray-500 underline underline-offset-4 dark:text-gray-400">
          ← Dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          My review applications
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          {subscription?.active
            ? subscription.status === "trialing" && subscription.current_period_end
              ? `Subscription: trial, ends ${new Date(subscription.current_period_end).toLocaleDateString("en-GB", { dateStyle: "medium" })}.`
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
        <p className="rounded-2xl border border-dashed border-black/15 p-10 text-center text-sm text-gray-500 dark:border-white/20 dark:text-gray-400">
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
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 px-5 py-4 dark:border-white/15"
            >
              <div>
                <Link
                  href={`/marketplace/${app.marketplace_listings?.id}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {app.marketplace_listings?.teaser_headline ?? "Listing"}
                </Link>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(app.created_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}
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
              {app.status === "approved" ? (
                <Link
                  href={`/dashboard/applications/${app.id}`}
                  className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
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
