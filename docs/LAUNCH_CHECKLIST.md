# Launch Checklist

Operational runbook for taking Truvis.info from its current dormant state to a
live launch. Each section is independent and gated by environment variables —
nothing here changes production behavior until the corresponding vars are set.

---

## 1. Email notifications (SMTP)

Notifications ship code-complete but dormant: with no `SMTP_HOST`, every send
is skipped and logged (`[email] SMTP not configured — skipping: …`).

To activate:

1. Set in the deployment environment (Vercel → Project → Settings → Environment Variables):
   - `SMTP_HOST`, `SMTP_PORT` (587 STARTTLS / 465 implicit TLS), `SMTP_USER`, `SMTP_PASS`
   - `SMTP_FROM` (e.g. `Truvis.info <no-reply@truvis.info>`)
   - `SUPABASE_SERVICE_ROLE_KEY` (required — recipient emails are resolved from `auth.users` via the service role)
2. Redeploy.
3. Verify: trigger a real event registration decision and confirm the email arrives.
   Locally without a provider, run `npx mailpit` and set `SMTP_HOST=localhost SMTP_PORT=1025`
   to inspect rendered HTML in its web UI.

**Note — no delivery outbox (deferred).** Notifications are fire-and-forget:
a failed send is logged but not retried. All underlying state lives in Postgres
and is visible in dashboards, so a lost email loses nothing irrecoverable. Add
an outbox table + drain worker if/when delivery observability matters (requires
a Vercel cron slot — both current slots are in use).

---

## 2. Stripe billing

Billing ships dormant: with no `STRIPE_SECRET_KEY`, the pricing page keeps the
pre-Stripe trial flow and the checkout action refuses politely.

To activate:

1. In the Stripe dashboard, create Products + recurring Prices (monthly + annual).
2. Update the plan catalog with the real price ids:
   ```sql
   update subscription_plans set stripe_price_id = 'price_XXX' where id = 'buyer_pro_monthly';
   update subscription_plans set stripe_price_id = 'price_YYY' where id = 'buyer_pro_annual';
   ```
3. Apply migration `0014_stripe_billing.sql` (adds the unique index on `subscriptions.user_id`
   the webhook upserts against). Pre-flight: `select user_id from subscriptions group by user_id having count(*) > 1;` must return zero rows.
4. Add a webhook endpoint `https://truvis.info/api/webhooks/stripe` subscribed to:
   `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
5. Set env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`.
6. Redeploy.
7. Test-mode flow (before going live): `stripe listen --forward-to localhost:3000/api/webhooks/stripe`,
   checkout with card `4242 4242 4242 4242`, confirm one `subscriptions` row `status='active'`;
   `stripe trigger customer.subscription.deleted` → `status='canceled'`; replay the event id → deduped.

**Trial-user cutover decision:** existing `trialing` rows are replaced in place
on the user's first real checkout (upsert on `user_id`). Decide whether to let
current trials run out naturally or migrate them — both are safe with the unique index.

---

## 3. Compliance API: mock → real cutover

The compliance client is fully env-driven — **no code changes needed** to switch.

1. Run `npm run seed:pilot:remove` first — pilot org ids (`pilot-*`) do not exist
   on the real compliance platform, so the daily poll would stop refreshing them
   and the 72h staleness sweep would hide them ~3 days later anyway.
2. Set env vars:
   - `COMPLIANCE_API_MODE` to anything other than `mock` (or unset it) → selects the real HTTP client
   - `COMPLIANCE_API_BASE_URL`, `COMPLIANCE_API_KEY`
   - `COMPLIANCE_WEBHOOK_SECRET` (HMAC for `/api/webhooks/compliance`)
   - `SUPABASE_SERVICE_ROLE_KEY`
3. The partner API must implement `GET /orgs/{id}/publication-grant`, `GET /orgs/{id}/standing`,
   `GET /orgs?updated_since=…`, and emit `standing.changed` / `grant.activated` / `grant.updated` /
   `grant.revoked` webhooks with the `X-Truvis-Signature` HMAC scheme.
4. Verify: claim one real org end-to-end; hit `/api/cron/compliance-poll` and confirm `refreshed > 0`.

---

## 4. Pilot content seeding

Populates the directory/feed/events/marketplace with ~12 realistic UAE orgs so
launch doesn't show an empty register. Backed by the mock compliance catalog
(`lib/compliance/pilot-data.ts`) — mock and seed share one module so they can't drift.

Commands (require `SUPABASE_SERVICE_ROLE_KEY`; the script prints its target and
requires explicit confirmation when pointed at production):

```bash
npm run seed:pilot            # upsert pilot orgs + content
npm run seed:pilot:remove     # delete everything with a pilot- id (FK-cascades content)
```

**Staging vs prod:** run against a Supabase branch/staging project first and eyeball
the directory. The pilot content *is* the launch content, so the real run targets
production shortly before launch — the script's prod-URL confirmation gate makes
that deliberate. After a prod seed, hit `/api/cron/compliance-poll` and confirm
`refreshed >= 12`. Remove the pilot set at the compliance mock→real cutover (§3).

---

## 5. Monitoring

- Server errors already funnel through `instrumentation.ts` `onRequestError` as
  structured `console.error` lines (searchable in Vercel logs). To upgrade to
  Sentry later: add `@sentry/nextjs`, set `SENTRY_DSN`, and forward from that hook.
- Point a free external uptime monitor at `GET /api/health` (DB-reachability probe).
