# Product Requirements Document (PRD)

**Product:** Truvis.info
**Version:** 1.0 (Draft) · **Date:** 2026-07-19
**Related docs:** [BRD.md](./BRD.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)

Requirement IDs are stable (`AUTH-1`, `DIR-3`, …) and referenced from the development plan. Priorities use MoSCoW: **M**ust (MVP), **S**hould (V1), **C**ould (V2), **W**on't (this horizon).

---

## 1. Personas

| Persona | Snapshot | Top jobs-to-be-done |
|---|---|---|
| **Sara — Procurement lead** (visitor → registered user) | Sources suppliers for a Dubai trading group | Find verified suppliers fast; check contact person; follow orgs; attend industry events |
| **Omar — SME owner** (org owner) | Runs a logistics company already on compliance.truvis.tech | Publish a credible profile without re-entering documents; showcase services; run a customer open-day event; quietly explore selling a stake |
| **Lena — Marketing manager** (org member) | Handles content for Omar's company | Post updates, maintain catalog, manage event attendees — without access to marketplace listings |
| **Rashid — Investor** (buyer subscriber) | Family-office associate screening GCC SME deals | Browse verified opportunities; apply for detail access; track applications; get matched alerts |
| **Admin — Truvis operations** (platform admin) | Truvis staff | Keep the directory clean, handle disputes, monitor compliance sync health, manage subscriptions |

## 2. Role & Permission Matrix

| Capability | Visitor | Registered user | Org member | Org admin | Org owner | Subscriber | Platform admin |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Browse directory, profiles, posts, public events | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Follow orgs, save searches | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Register for events | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit org profile/catalog/posts | — | — | ✅* | ✅ | ✅ | — | override |
| Create events, manage attendees | — | — | ✅* | ✅ | ✅ | — | override |
| Create/manage marketplace listings | — | — | — | — | ✅ | — | override |
| Approve/reject review applications | — | — | — | — | ✅ | — | — |
| View marketplace teasers | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View full listing detail | — | — | — | — | own org | ✅ (after approval) | ✅ |
| Apply to review a listing | — | — | — | — | — | ✅ | — |
| Moderation, suspensions, audit log | — | — | — | — | — | — | ✅ |

\* Org members hold granular permissions granted by owner/admin (content vs. events).

An individual account can hold multiple hats simultaneously (e.g., org owner **and** subscriber).

---

## 3. Functional Requirements

### Module 1 — Auth & SSO (`AUTH`)

| ID | Requirement | Priority |
|---|---|---|
| AUTH-1 | Email/password + email OTP sign-up and sign-in via Supabase Auth; verified email required before any org action | M |
| AUTH-2 | "Continue with Truvis Compliance" SSO: OAuth2/OIDC against compliance.truvis.tech; links the compliance identity to the Truvis.info account | M |
| AUTH-3 | Org claim flow: an org-owner account is bound to a compliance-platform organization via the SSO identity + publication grant (no self-serve org creation without a grant) | M |
| AUTH-4 | Owner can invite members by email with role (admin/member) and permission scopes (content, events); invitees join via magic link | S |
| AUTH-5 | Session management: secure HTTP-only cookies, refresh rotation, sign-out everywhere | M |
| AUTH-6 | Account deletion & data export (PDPL data-subject rights) | S |

**Story (AUTH-3):** As Omar, when I sign in with my compliance account and my org has granted publication, I see "Claim Logistics Co. profile" and become its owner in one step.
**Acceptance:** grant absent → claim unavailable with guidance link to compliance.truvis.tech; grant present → org created/bound, owner role assigned, audit-logged.

### Module 2 — Org Profiles & Directory (`DIR`)

| ID | Requirement | Priority |
|---|---|---|
| DIR-1 | Public org profile page at `/orgs/[slug]`: identity block (legal name, verification badge, industry, location, founding year, size band), about, contact person card, catalog, posts, upcoming events | M |
| DIR-2 | Vault-sourced fields (legal name, registration facts, contact person) are read-only on Truvis.info, labeled "Verified via Truvis Compliance", and refreshed from the grant payload | M |
| DIR-3 | Org-editable marketing content: logo, cover, tagline, description, website, social links, gallery | M |
| DIR-4 | Directory browse at `/directory` with faceted filters (industry, emirate/country, size, has-catalog, has-events) + keyword search | M |
| DIR-5 | Search: Postgres full-text across org name, description, catalog items; ranked results; empty-state guidance | M |
| DIR-6 | Visibility engine: profile and ALL child content render only when `org.is_visible = true` (see CMP module); hidden orgs return 404 on public routes, and dashboards show a "profile hidden" banner with reason category | M |
| DIR-7 | SEO: SSR/ISR public pages, per-org metadata, OpenGraph images, `sitemap.xml` limited to visible orgs, JSON-LD `Organization` schema | M |
| DIR-8 | Follow an org (registered users); follower count on profile; followed orgs feed on user dashboard | S |
| DIR-9 | Verification badge levels reflecting compliance score bands (e.g., Verified / Verified+) | C |

### Module 3 — Catalog (`CAT`)

| ID | Requirement | Priority |
|---|---|---|
| CAT-1 | CRUD for products/services: name, type (product/service), category, description, specs (key-value), price indication (optional, free text), status (draft/published) | M |
| CAT-2 | Media per item: images, video links, PDF brochures via Supabase Storage; public delivery through CDN; max sizes enforced | M |
| CAT-3 | Public catalog item page `/orgs/[slug]/catalog/[itemSlug]` with gallery and "Contact this organization" CTA | M |
| CAT-4 | Catalog section on profile with category grouping and ordering controlled by the org | S |
| CAT-5 | Catalog items searchable from the global directory search (DIR-5) | S |

### Module 4 — Posts (`POST`)

| ID | Requirement | Priority |
|---|---|---|
| POST-1 | Orgs publish posts (rich text + images + link preview); drafts and scheduled publish | M (drafts M, scheduling C) |
| POST-2 | Posts appear on the org profile; global feed `/feed` aggregates posts of visible orgs (newest first; followed-first for signed-in users) | S |
| POST-3 | Report-post flow for users; reported posts enter admin moderation queue | S |
| POST-4 | Post analytics for the org (views, follower reach) | C |

### Module 5 — Events (`EVT`)

| ID | Requirement | Priority |
|---|---|---|
| EVT-1 | Event CRUD: title, description, banner, venue (physical address and/or online URL), start/end datetime with timezone, capacity, registration deadline, visibility (public/unlisted), status (draft/published/cancelled/completed) | M |
| EVT-2 | Public event page `/events/[slug]` + events index `/events` with upcoming/past filters; events of hidden orgs are hidden | M |
| EVT-3 | Registration by signed-in users: single-click register with profile info + optional organizer questions | M |
| EVT-4 | Approval workflow: per-event mode `auto-approve` or `manual`; in manual mode organizer approves/rejects each registration; capacity enforced on approvals; waitlist when full | M (waitlist S) |
| EVT-5 | Organizer dashboard: registration list with statuses (pending/approved/rejected/waitlist/cancelled), search, bulk approve, CSV export | M (bulk/CSV S) |
| EVT-6 | Attendee notifications: registration received, approved, rejected, event updated/cancelled (email) | M |
| EVT-7 | Attendee view: "My events" on user dashboard with status per registration; self-cancel | M |
| EVT-8 | Check-in mode (mark attendance) and post-event stats | C |
| EVT-9 | Paid ticketing | W (this horizon; revisit V2+) |

### Module 6 — Marketplace (`MKT`)

| ID | Requirement | Priority |
|---|---|---|
| MKT-1 | Listing CRUD (org owner only), types: `fundraise` (amount sought, instrument note), `equity_sale` (% offered), `business_sale` (full sale); common fields: headline, sector, region, size band, anonymized summary, detailed memorandum (rich text + attachments), status (draft/active/paused/closed) | M |
| MKT-2 | **Teaser vs. detail separation:** public/marketplace index shows teasers only (no org identity, no financials); full detail (org identity, memorandum, attachments) requires subscriber + per-listing approval | M |
| MKT-3 | Financial/status announcements: structured self-declared snapshot (revenue band, employees, profitability flag, year) attached to listing; labeled as organization-provided, not Truvis-verified | M |
| MKT-4 | Apply-to-review flow: subscriber submits application (intro message + acknowledgment of confidentiality terms) → org owner approves/rejects → approval unlocks detail + opens inquiry thread | M |
| MKT-5 | Inquiry messaging between listing org and approved applicants (thread per application; email notification on new message) | M |
| MKT-6 | Subscriber tools: saved listings, application tracker (statuses), match alerts on saved criteria (email) | S (alerts S) |
| MKT-7 | Regulatory guardrails: mandatory disclaimers on every marketplace surface; listing creation includes org attestation of accuracy; no payment/escrow features of any kind | M |
| MKT-8 | Listing lifecycle rules: hidden org ⇒ listings hidden AND applications frozen; closing a listing notifies applicants | M |
| MKT-9 | Data-room lite: versioned attachments visible only to approved applicants, watermarked with viewer identity | C |

### Module 7 — Subscriptions & Billing (`SUB`)

| ID | Requirement | Priority |
|---|---|---|
| SUB-1 | Plans: Free (default) and Buyer/Investor Pro (monthly + annual). Plan catalog server-side, price IDs in Stripe | M |
| SUB-2 | Stripe Checkout for purchase; Stripe Billing customer portal for card update/cancel; webhook-driven entitlement sync (`subscriptions` table is source of truth for gating) | M |
| SUB-3 | Gating middleware: MKT detail/apply/messaging require active entitlement; grace period on past-due (configurable, default 7 days) | M |
| SUB-4 | Invoices/receipts via Stripe emails; VAT fields (UAE TRN) on customer records | S |
| SUB-5 | Admin tools: comp accounts, refunds (via Stripe), subscription overview | S |

### Module 8 — Compliance Sync (`CMP`)

The contract is specified in [ARCHITECTURE.md §5](./ARCHITECTURE.md). Product behavior:

| ID | Requirement | Priority |
|---|---|---|
| CMP-1 | Ingest publication grants (org identity payload incl. contact person + authorized field list); create/update the org's verified fields from grant payloads | M |
| CMP-2 | Ingest compliance standing `{state, risk_level, score, renewal_expiry, checked_at}` via webhook + scheduled polling fallback; persist as `compliance_status` cache | M |
| CMP-3 | Visibility derivation (single function, single source of truth): `is_visible = grant.active AND state = 'compliant' AND risk_level ≠ 'high' AND score ≥ threshold AND renewal not expired AND sync not stale (≤72h) AND NOT admin_suspended` | M |
| CMP-4 | State transitions apply platform-wide ≤15 min from signal receipt; each transition audit-logged with cause | M |
| CMP-5 | Org dashboard shows current standing category and remediation pointer (link to compliance.truvis.tech); exact scores/reasons stay in the compliance platform | M |
| CMP-6 | Grant revocation (org-initiated) unpublishes immediately (BR-6) | M |
| CMP-7 | Mock compliance service (same contract) for dev/staging until the real API ships | M |

### Module 9 — Dashboards (`DSH`)

| ID | Requirement | Priority |
|---|---|---|
| DSH-1 | **Org dashboard** `/dashboard`: visibility status banner, profile completeness, quick stats (views, followers, upcoming events, pending registrations, listing applications), nav to profile/catalog/posts/events/listings management | M |
| DSH-2 | **User dashboard**: my registrations (EVT-7), followed orgs, saved searches | M (saved searches S) |
| DSH-3 | **Subscriber dashboard**: extends user dashboard with saved listings, application tracker, match alerts settings, billing status | M |
| DSH-4 | **Admin dashboard** `/admin`: org registry with visibility states + override, moderation queue, compliance sync health (last webhook, stale orgs), subscription metrics, audit log browser | M |

### Module 10 — Admin & Moderation (`ADM`)

| ID | Requirement | Priority |
|---|---|---|
| ADM-1 | Admin role separated at the database level (RLS); all admin actions audit-logged | M |
| ADM-2 | Manual suspension/unsuspension of orgs, posts, events, listings with reason codes (BR-9) | M |
| ADM-3 | Moderation queue for reported content (POST-3) with resolve/remove actions | S |
| ADM-4 | Immutable `audit_log` (append-only) covering visibility changes, admin actions, grant events, subscription entitlement changes | M |

---

## 4. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Performance | Public pages LCP < 2.5s on 4G; directory search P95 < 800ms; ISR for profiles (revalidate on change + max-age) |
| SEO | SSR/ISR for all public routes; canonical URLs; structured data; only visible orgs indexable |
| Security | Supabase RLS on every table (deny-by-default); service-role keys server-side only; signed URLs for private media (marketplace attachments); webhook HMAC verification; rate limiting on auth, search, applications; OWASP ASVS L1 baseline, pen test before marketplace launch |
| Privacy (PDPL) | Consent trail from grants; minimal replication of personal data; deletion workflows; DPAs with Supabase/Vercel/Stripe |
| i18n-readiness | All strings via message catalog (e.g., `next-intl`); no hard-coded copy in components; layouts tested for RTL flip feasibility; dates/numbers locale-aware |
| Accessibility | WCAG 2.1 AA on public pages and dashboards |
| Reliability | Compliance sync redundant (webhook + poll); fail-safe visibility (BR-5); Supabase PITR backups; status monitoring + alerting (sync staleness, webhook failures, error rates) |
| Auditability | Append-only audit log; admin actions attributable; log retention ≥ 2 years |
| Scale target | Comfortable at 10k orgs / 100k users / 1M page-views/month on Supabase Pro + Vercel Pro without re-architecture |

---

## 5. Release Plan

| Release | Contents | Gate |
|---|---|---|
| **MVP (internal/beta)** | AUTH-1..3,5 · DIR-1..7 · CAT-1..3 · POST-1 · CMP-1..4,7 (mock) · DSH-1..2 · ADM-1..2,4 | Seeded with pilot orgs; visibility engine proven against mock |
| **V1 (public launch)** | + EVT-1..7 · MKT-1..5,7..8 · SUB-1..3 · DSH-3..4 · AUTH-4 · POST-2..3 · remaining S items as capacity allows | Legal review passed (BRD §8); real compliance API live; pen test passed |
| **V2** | C items: badges levels, data-room lite, post analytics, check-in, scheduling; Arabic/RTL; paid ticketing evaluation | Post-launch metrics review |

Traceability: DEVELOPMENT_PLAN.md maps these IDs onto build phases 0–6.

---

## 6. Open Questions

| # | Question | Owner | Needed by |
|---|---|---|---|
| Q1 | Compliance score threshold and risk bands for visibility — exact values? | Compliance team | Phase 1 |
| Q2 | Subscription price points and whether org-side paid features enter V1 | Business | Phase 4 |
| Q3 | Does the compliance platform issue OIDC tokens today, or is that to be built? | Compliance team | Phase 1 (mock unblocks) |
| Q4 | Which entity contracts with subscribers (Truvis FZ-LLC?) — affects ToS/VAT | Legal | Phase 4 |
| Q5 | Contact person consent: captured in compliance grant flow (preferred) or re-confirmed on Truvis.info? | Legal + Compliance | Phase 2 |
