# Truvis.info

Verified business directory, event management, and business marketplace — the public companion to [compliance.truvis.tech](https://compliance.truvis.tech). Only organizations in good compliance standing are visible; standing is synced continuously and visibility is enforced automatically.

## Documentation

| Doc | Contents |
|---|---|
| [docs/BRD.md](docs/BRD.md) | Business requirements: vision, market, business rules, revenue model, regulatory posture |
| [docs/PRD.md](docs/PRD.md) | Product requirements: personas, role matrix, functional requirements by module (AUTH/DIR/CAT/POST/EVT/MKT/SUB/CMP/DSH/ADM), NFRs, release plan |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, data model, security model, and the compliance-platform API contract |
| [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md) | A-to-Z roadmap: Phases 0–6 from scaffold to live platform |

## Stack

Next.js 16 (App Router, TypeScript, Tailwind) · Supabase (Postgres, Auth, Storage, RLS) · Vercel · Stripe.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase keys; keep COMPLIANCE_API_MODE=mock
npm run dev
```

Database schema lives in [`supabase/migrations/`](supabase/migrations/) and is applied with the Supabase CLI (`supabase db push`).

## Repository layout

```
app/(public)/     public SEO surface: directory, org profiles, events, marketplace, feed
app/(dashboard)/  org / user / subscriber dashboards
app/admin/        platform administration
components/       UI components
lib/              supabase clients, compliance API client (+mock), visibility rule
supabase/         SQL migrations
docs/             BRD, PRD, architecture, development plan
```

## Status

Phase 0 (Foundations) — see [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md) for what ships next.
