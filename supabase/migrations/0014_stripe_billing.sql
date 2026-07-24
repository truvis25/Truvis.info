-- Stripe billing: make "one subscription row per user" declarative.
--
-- start_trial() (migration 0006) already enforces one row per user
-- procedurally, writing a placeholder stripe_subscription_id 'trial:<uid>'.
-- The Stripe webhook needs to upsert on user_id so a real checkout cleanly
-- REPLACES that trial row in place (rather than inserting a second row with a
-- different stripe_subscription_id, which would break getSubscription()'s
-- maybeSingle() and has_active_subscription()).
--
-- Pre-flight before applying (must return zero rows):
--   select user_id from subscriptions group by user_id having count(*) > 1;

create unique index if not exists uniq_subscriptions_user_id
  on subscriptions (user_id);
