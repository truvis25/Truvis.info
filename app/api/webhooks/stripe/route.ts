import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/billing/stripe";
import { mapStripeStatus } from "@/lib/billing/stripe-status";

// Inbound Stripe webhooks. Dormant until STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET
// are set. Events: checkout.session.completed | customer.subscription.updated |
// customer.subscription.deleted. Mirrors the compliance webhook's structure.
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "webhook not configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Idempotency via the shared webhook_events table (first insert wins).
  const { error: dupe } = await supabase
    .from("webhook_events")
    .insert({ event_id: event.id, event_type: event.type, payload: event });
  if (dupe?.code === "23505") {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  if (dupe) {
    return NextResponse.json({ error: dupe.message }, { status: 500 });
  }

  async function syncSubscription(
    sub: Stripe.Subscription,
    userIdHint?: string | null,
  ): Promise<NextResponse> {
    // Resolve the user: subscription metadata first, then a lookup by the
    // Stripe subscription id we may already have on record.
    let userId: string | null = sub.metadata?.user_id ?? userIdHint ?? null;
    if (!userId) {
      const { data } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_subscription_id", sub.id)
        .maybeSingle();
      userId = (data?.user_id as string | undefined) ?? null;
    }
    if (!userId) {
      // Foreign subscription — ack so Stripe stops retrying.
      return NextResponse.json({ ok: true, skipped: "no user" });
    }

    const priceId = sub.items.data[0]?.price.id;
    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("stripe_price_id", priceId ?? "")
      .maybeSingle();
    if (!plan) {
      return NextResponse.json({ ok: true, skipped: "unknown price" });
    }

    // current_period_end lives on the subscription item in recent API versions.
    const periodEnd = sub.items.data[0]?.current_period_end;

    const { error } = await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        plan_id: plan.id,
        stripe_customer_id: String(sub.customer),
        stripe_subscription_id: sub.id,
        status: mapStripeStatus(sub.status),
        current_period_end: periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null,
        cancel_at_period_end: sub.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("audit_log").insert({
      actor_type: "system",
      action: "subscription.stripe.synced",
      entity_type: "subscription",
      entity_id: userId,
      reason: sub.status,
    });
    return NextResponse.json({ ok: true });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (!session.subscription) {
        return NextResponse.json({ ok: true, skipped: "no subscription" });
      }
      const sub = await stripe.subscriptions.retrieve(
        String(session.subscription),
      );
      return syncSubscription(
        sub,
        session.client_reference_id ?? session.metadata?.user_id,
      );
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      return syncSubscription(sub);
    }
    default:
      return NextResponse.json({ ok: true });
  }
}
