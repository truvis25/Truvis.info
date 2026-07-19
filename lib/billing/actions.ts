"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
