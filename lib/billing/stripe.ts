import "server-only";

import Stripe from "stripe";

// Billing is dormant until STRIPE_SECRET_KEY is set. This is the single seam
// that knows whether Stripe is live; callers gate on isStripeEnabled().
export function isStripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!isStripeEnabled()) return null;
  if (stripe) return stripe;
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-06-24.dahlia",
  });
  return stripe;
}
