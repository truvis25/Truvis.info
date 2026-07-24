// Map Stripe's subscription statuses onto our narrower DB enum
// (subscription_status: active, trialing, past_due, canceled, incomplete).
//
// Kept as a pure module so it's unit-testable and reused by the webhook.
// Degrade-to-canceled choices: `unpaid` = retries exhausted (entitlement off,
// not the 7-day past_due grace); `paused`/`incomplete_expired` are likewise
// non-entitled terminal-ish states with no DB enum value.
export type DbSubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete";

export function mapStripeStatus(status: string): DbSubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
    case "past_due":
    case "incomplete":
      return status;
    case "canceled":
    case "unpaid":
    case "paused":
    case "incomplete_expired":
      return "canceled";
    default:
      return "canceled";
  }
}
