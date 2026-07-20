import type { Metadata } from "next";
import { Check } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { startTrial, getSubscription } from "@/lib/billing/actions";
import { buttonCls } from "@/components/form-field";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Buyer/Investor access to the Truvis.info marketplace.",
};

export const dynamic = "force-dynamic";

const freeFeatures = [
  "Browse the verified directory",
  "Follow organizations and read updates",
  "Register for events",
  "See marketplace teasers",
];

const proFeatures = [
  "Full marketplace listing details",
  "Apply to review opportunities",
  "Message sellers after approval",
  "Verified counterparties only",
];

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const subscription = user ? await getSubscription() : null;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
      <header className="mb-10 text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight text-petroleum dark:text-foreground">
          Access verified deal flow
        </h1>
        <p className="mt-2 text-muted-foreground">
          The directory, feed, and events are free. Marketplace access is for
          subscribed buyers and investors.
        </p>
      </header>

      {error ? (
        <p className="mx-auto mb-6 max-w-md rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-border p-8">
          <h2 className="text-lg font-semibold">Free</h2>
          <p className="mt-1 text-3xl font-semibold">AED 0</p>
          <ul className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
            {freeFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-2"><Check className="size-4 shrink-0 text-emerald-dark" aria-hidden /> {feature}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border-2 border-foreground p-8">
          <h2 className="text-lg font-semibold">Buyer / Investor Pro</h2>
          <p className="mt-1 text-3xl font-semibold">
            14-day free trial
          </p>
          <p className="text-sm text-muted-foreground">
            Paid plans launch soon — early users get free trial access.
          </p>
          <ul className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
            {proFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-2"><Check className="size-4 shrink-0 text-emerald-dark" aria-hidden /> {feature}</li>
            ))}
          </ul>
          <div className="mt-8">
            {subscription?.active ? (
              <p className="text-sm font-medium text-emerald-dark">
                Your access is active
                {subscription.status === "trialing" && subscription.current_period_end
                  ? ` (trial ends ${new Date(subscription.current_period_end).toLocaleDateString("en-GB", { dateStyle: "medium" })})`
                  : ""}
                .{" "}
                <Link href="/marketplace" className="underline underline-offset-4">
                  Browse the marketplace
                </Link>
              </p>
            ) : subscription ? (
              <p className="text-sm text-muted-foreground">
                Your {subscription.status === "trialing" ? "trial has ended" : `subscription is ${subscription.status}`}.
                Paid plans are launching soon — contact info@truvis.ae to keep
                access.
              </p>
            ) : user ? (
              <form action={startTrial}>
                <button className={buttonCls}>Start free trial</button>
              </form>
            ) : (
              <Link href="/signup" className={`${buttonCls} inline-block`}>
                Create an account to start
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
