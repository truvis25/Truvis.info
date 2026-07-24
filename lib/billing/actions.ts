"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/config";
import { getStripe } from "@/lib/billing/stripe";

// Pre-Stripe trial activation (migration 0006). Replaced by Stripe Checkout
// at billing go-live — see docs/DEVELOPMENT_PLAN.md Phase 4/5.
export async function startTrial() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/pricing");

  const { error } = await supabase.rpc("start_trial");
  if (error) {
    redirect(`/pricing?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/marketplace?trial=1");
}

// Stripe Checkout for a paid plan. Dormant until STRIPE_SECRET_KEY is set —
// when Stripe is off, the pricing page never renders the button that calls
// this, and it fails politely if reached directly.
export async function createCheckoutSession(formData: FormData) {
  const planId = String(formData.get("plan_id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/pricing");

  const stripe = getStripe();
  if (!stripe) redirect("/pricing?error=Payments%20are%20not%20yet%20enabled");

  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("id, stripe_price_id")
    .eq("id", planId)
    .eq("active", true)
    .maybeSingle();
  if (
    !plan ||
    plan.stripe_price_id.startsWith("price_pending") ||
    plan.stripe_price_id === "trial"
  ) {
    redirect("/pricing?error=This%20plan%20is%20not%20yet%20available");
  }

  // Already-active subscribers don't need a second checkout; an expired trial
  // row is allowed through (the webhook upserts on user_id and replaces it).
  const existing = await getSubscription();
  if (existing?.active) redirect("/pricing");

  // Build the session outside a redirect-catching try (redirect() throws
  // NEXT_REDIRECT and must not be swallowed).
  let checkoutUrl: string | null = null;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      client_reference_id: user.id,
      customer_email: user.email,
      subscription_data: { metadata: { user_id: user.id, plan_id: plan.id } },
      metadata: { user_id: user.id, plan_id: plan.id },
      success_url: `${SITE_URL}/pricing?checkout=success`,
      cancel_url: `${SITE_URL}/pricing?checkout=cancelled`,
      allow_promotion_codes: true,
    });
    checkoutUrl = session.url;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    redirect(`/pricing?error=${encodeURIComponent(message)}`);
  }
  redirect(checkoutUrl!);
}

export async function getSubscription() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("subscriptions")
    .select("plan_id, status, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return null;
  const active =
    data.status === "active" ||
    (data.status === "trialing" &&
      data.current_period_end != null &&
      new Date(data.current_period_end) > new Date());
  return { ...data, active };
}
