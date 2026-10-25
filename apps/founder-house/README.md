# Founder House by TRUVIS

A curated community for founders, startup teams, angels, VC professionals, family offices and ecosystem operators, starting in Abu Dhabi.

This is a standalone Next.js application inside `truvis25/Truvis.info`. Its separate Vercel project is `truvis-founder-house`, with Root Directory `apps/founder-house`. It shares the existing `truvis-info` Supabase project (`hyzotwxtqssefsgryawl`) and the existing `user_profiles.platform_admin` authorisation model.

## Local work

```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

Public Supabase configuration has the same safe defaults as the parent application and can be overridden with the names in `.env.example`. No service-role key is needed or permitted in this Vercel app.

## Runtime

- Next.js serves the responsive landing page, membership form, member room, organiser desk and existing-account login.
- Route handlers verify organiser identity with Supabase Auth and `platform_admin`, then forward authorised requests to the project-bound `founder-house` Supabase Edge Function.
- The Edge Function independently verifies organiser JWTs and roles. It uses Supabase's injected runtime credentials, keeping privileged database credentials inside their own project.
- Private `fh_*` tables store applications, gatherings, RSVPs, publication jobs and rate limits. Direct `anon` and `authenticated` table access is revoked; RLS is enabled.
- PDF CVs (up to 3 MB) are kept in the private `founder-house-cvs` bucket. Only authenticated organisers can download them through the API.
- Approved membership invitations contain a 256-bit random token. Only its hash is stored. The browser exchanges the invitation for a secure HTTP-only cookie. Approval renewals revoke older invitations; membership revocation releases event places.
- Event reservations use a PostgreSQL row lock to enforce capacity and promote the oldest eligible waitlisted member after cancellation.

## Events and distribution

The homepage shows confirmed upcoming events before the community description. Public event pages and `/events/calendar.ics` use only public fields; venues remain private.

Saving a published event automatically attempts all configured channels. Luma and Meetup have native API adapters. Eventbrite and LinkedIn use an authenticated publishing-workflow contract. Each channel has a persisted result, duplicate-create protection, safe retries for definite failures and manual receipt reconciliation for uncertain results. Credentials, paid platform requirements, lifecycle behaviour and the workflow contract are documented in [DISTRIBUTION.md](DISTRIBUTION.md).

Account connections and live external publication tests are not complete. A configured workflow or accepted request is never reported as a confirmed publication. No external accounts or subscriptions were created.

## Email and launch checks

The organiser desk opens on **Launch checks**, showing live database access, upcoming gatherings, channel connections and email activity. It also shows the signed-in email and a local sign-out action.

Application receipts are attempted only after a new application is saved. Duplicate submissions keep the same generic response and do not send another receipt. Approval creates a private invitation and attempts its email. Failed or unconfigured email never undoes the saved application or approval; the organiser receives a clear result and can copy the invitation. Reserved test domains are suppressed. No newsletter, bulk sending or historical backfill runs automatically.

The Edge Function sends via authenticated SMTP with implicit TLS on port 465. The sender is `Founder House by TRUVIS <info@truvis.info>` and replies go to `info@truvis.info`. Only delivery metadata is stored in private `fh_email_deliveries`; SMTP passwords, bodies and invitation tokens are never logged. “Accepted” means accepted by the mail server, not delivered to an inbox. Uncertain sends are not retried automatically.

The sending account still needs its real SMTP credentials and an inbox test. See [EMAIL-AND-ADMIN.md](EMAIL-AND-ADMIN.md) for setup and verification. Do not mark email or owner access launch-ready until those live checks succeed.

## Hostinger DNS

`https://house.truvis.info` is serving the production site over HTTPS. Keep its existing DNS record:

| Type | Name | Target | TTL |
| --- | --- | --- | --- |
| CNAME | house | 65427143e9ea06c8.vercel-dns-016.com | Auto / default |

Use the project-specific target returned by Vercel. Do not change apex, mail, or unrelated subdomains when maintaining this site.

## Verification

`npm test` checks membership validation, email delivery and failure handling, publication privacy and retry behaviour, calendar formatting, and ten semantic contrast pairs. `tests/database.sql` tests approval, capacity, duplicate reservations, cancellation, waitlist promotion, revocation, rate limiting and anonymous access inside a transaction that is rolled back. Production build and the parent app's own test/build are checked separately.

See `BRAND.md` for design choices and `LAUNCH.md` for the proposed community launch rhythm. These are implementation and launch notes, not evidence of existing attendance, investor partnerships or promised outcomes.
