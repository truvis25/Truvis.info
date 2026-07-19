# Development Plan — A to Z

**Product:** Truvis.info · **Version:** 1.0 · **Date:** 2026-07-19
**Related docs:** [BRD.md](./BRD.md) · [PRD.md](./PRD.md) · [ARCHITECTURE.md](./ARCHITECTURE.md)

Goal: from this scaffold to a **live, functional business directory + event management + marketplace** with role-based dashboards. Phases are sequential but internally parallelizable; each has explicit exit criteria. Requirement IDs refer to the PRD.

**Team assumption:** 1–2 full-stack engineers + 1 designer (part-time) + product owner. Estimates are engineering calendar weeks for that team; adjust proportionally.

---

## Phase 0 — Foundations (this session + 1 week)

**Scope**
- ✅ Repo scaffold: Next.js 16 + TypeScript + Tailwind, folder structure per ARCHITECTURE.md §2
- ✅ Draft database schema as SQL migration (`supabase/migrations/0001_initial_schema.sql`)
- ✅ CI: lint + typecheck + build on every PR
- ✅ BRD / PRD / Architecture docs (this set)
- Provision cloud: Supabase project (apply migration, enable PITR), Vercel project + domains (`truvis.info`, `staging.truvis.info`), env vars, Vercel Cron
- Design foundation: logo/brand tokens, Tailwind theme, shadcn/ui component baseline
- Tooling: Prettier, commit hooks, preview deployments, Sentry

**Exit criteria:** `main` deploys to staging automatically; migration applied; a hello-world page live on staging domain; CI green.

## Phase 1 — Identity & Org Onboarding (2–3 weeks)

**Scope:** AUTH-1..3, AUTH-5 · CMP-1..4, CMP-7 · ADM-1, ADM-4 skeleton
- Supabase Auth (email/OTP), session handling, protected layouts
- **Mock compliance service** implementing the full contract (ARCHITECTURE §5), with scripted scenarios (grant / revoke / flag / lapse / stale)
- Org claim flow from grant; verified-fields ingestion; `compliance_status` cache
- Visibility engine (trigger + `lib/visibility.ts`) + audit logging of every transition
- Webhook endpoint + cron poller wired to the mock
- SSO (AUTH-2) integrated against mock OIDC if the real provider isn't ready (interface stable either way)

**Exit criteria:** demo: grant an org in the mock → claim → org exists and is visible; flag it high-risk → hidden within one poll/webhook cycle; full audit trail visible in DB.

## Phase 2 — Directory, Profiles, Catalog, Posts (3–4 weeks) → *MVP beta*

**Scope:** DIR-1..7 · CAT-1..3 · POST-1 · DSH-1..2 · ADM-2
- Public profile pages (ISR + revalidation on sync), directory browse with facets, full-text search
- Catalog CRUD + media upload (Supabase Storage) + public item pages
- Posts authoring (rich text) + profile display
- Org dashboard v1 (profile completeness, content management), user dashboard v1
- Admin: org registry + manual suspension
- SEO pass: metadata, OG images, sitemap (visible orgs only), JSON-LD

**Exit criteria:** MVP beta — 5–10 pilot orgs (real compliance clients) published end-to-end via the mock or early real API; Lighthouse SEO/perf ≥ 90 on profile pages; hidden-org leak test passes (no route, sitemap entry, or search result exposes a hidden org).

## Phase 3 — Events & Attendee Management (2–3 weeks)

**Scope:** EVT-1..7 · POST-2 (feed) · AUTH-4 (member invites)
- Event CRUD + public pages + index; registration flow with organizer questions
- Approval workflow (auto/manual), capacity, statuses; organizer registration dashboard
- Email notifications (received/approved/rejected/updated/cancelled)
- "My events" on user dashboard; member invites with event-scope permissions

**Exit criteria:** a pilot org runs a real event through the full lifecycle (publish → registrations → approve/reject → attendee list export) with notifications delivered.

## Phase 4 — Marketplace & Subscriptions (3–4 weeks)

**Scope:** MKT-1..5, MKT-7..8 · SUB-1..3 · DSH-3
- Listing CRUD with teaser/detail split; financial snapshot; attestation + disclaimers (MKT-7)
- Marketplace index (public teasers) + subscriber-gated detail
- Apply-to-review flow + approval + inquiry messaging + notifications
- Stripe: plans, Checkout, portal, webhook entitlement sync, gating middleware
- Subscriber dashboard (saved listings, application tracker, billing)
- ⚠️ **Legal review runs in parallel from the start of this phase** (BRD §8): listing templates, disclaimers, ToS, subscriber terms — counsel sign-off is a Phase 5 gate

**Exit criteria:** end-to-end demo with test cards: subscribe → browse teasers → apply → org approves → detail + messaging unlocked; entitlement revoked on cancellation; hidden org freezes its listings.

## Phase 5 — Hardening, Admin & Real Compliance Integration (2–3 weeks)

**Scope:** DSH-4 · ADM-3 · CMP real-API cutover · SUB-4..5 · POST-3 · security NFRs
- Admin dashboard complete: moderation queue, sync health, subscription overview, audit browser
- Swap mock → real compliance API on staging; contract conformance tests; SSO against production OIDC
- Rate limiting, RLS audit (every table, every policy tested), pen test + fixes
- Legal sign-off applied (copy/ToS/disclaimer changes); PDPL checklist closed
- Load test directory search and profile ISR at target scale

**Exit criteria (launch gates):** real compliance events drive visibility on staging; pen test findings ≥ high severity closed; legal sign-off recorded; on-call/alerting runbook exists.

## Phase 6 — Launch & Post-Launch (1–2 weeks + ongoing)

**Scope**
- Production cutover: DNS on `truvis.info`, production keys, Stripe live mode
- Seed content: onboard the initial cohort of compliance clients (BRD O1), publish launch events
- Analytics dashboards (BRD §9 KPIs); weekly metrics review cadence
- Post-launch backlog: S/C items not yet shipped (waitlists, CSV exports, saved searches, match alerts, badges, data-room lite, post analytics), then **Arabic/RTL** as the first major post-launch initiative

**Exit criteria:** platform live on truvis.info; first paying subscriber; KPI dashboard populated; incident process tested.

---

## Timeline Summary

| Phase | Duration | Cumulative |
|---|---|---|
| 0 Foundations | 1 wk | 1 wk |
| 1 Identity & onboarding | 2–3 wks | ~4 wks |
| 2 Directory (MVP beta) | 3–4 wks | ~8 wks |
| 3 Events | 2–3 wks | ~11 wks |
| 4 Marketplace + billing | 3–4 wks | ~15 wks |
| 5 Hardening + integration | 2–3 wks | ~18 wks |
| 6 Launch | 1–2 wks | **~20 wks (~5 months)** |

Compression options: overlap Phase 3 with late Phase 2; start legal review in Phase 2; add a second engineer for Phases 2–4.

## Environments & Release Process

| Env | Branch/flow | Data |
|---|---|---|
| Preview | every PR (Vercel preview + Supabase branch DB) | seeded fixtures |
| Staging | `main` auto-deploy | mock or staging compliance API; Stripe test mode |
| Production | tagged release, manual promote | real API, Stripe live |

Process: trunk-based; PRs require CI green (lint, typecheck, build, tests as they land) + review; migrations applied via Supabase CLI in CI before deploy; feature flags for marketplace until legal gate clears.

## Standing Workstreams (cross-phase)

- **Testing:** unit (visibility rule, gating), integration (RLS policies via pgTAP or supabase test helpers), E2E happy paths (Playwright) from Phase 2.
- **Design:** Figma flows one phase ahead of build.
- **Compliance-team coordination:** contract review (Phase 0–1), staging keys (Phase 4), production cutover (Phase 5–6).
- **Content/SEO:** industry taxonomy, launch copy, directory landing pages per industry (Phase 2+).

## Immediate Next Actions (after this PR merges)

1. Review/approve BRD & PRD with stakeholders; answer PRD §6 open questions Q1/Q3 with the compliance team.
2. Provision Supabase + Vercel projects; apply `0001_initial_schema.sql`; connect repo for preview deploys.
3. Share ARCHITECTURE.md §5 with the compliance team as the integration contract proposal.
4. Kick off Phase 1 (auth + mock compliance service).
