# TruVis.info — Verified Business Ecosystem Platform

> A curated, trust-based business infrastructure platform for the UAE and global markets.

---

## Overview

TruVis.info is a **Verified Business Directory & Future Marketplace Ecosystem** built as a strategic long-term revenue-generating asset for TruVis Corporate Services.

**Key capabilities:**
- Curated company profiles with admin approval workflow
- Two-tier verification badge system (TruVis Client / TruVis Verified)
- Full-text search with intelligent ranking algorithm
- Blog & content moderation pipeline
- Future marketplace infrastructure (pre-built schema)
- Monetization layer (subscriptions, featured listings)
- Production-grade security (JWT RS256, rate limiting, audit logs)

See `ARCHITECTURE.md` for the complete system design document.

---

## Repository Structure

```
Truvis.info/
├── backend/              # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── config/       # DB, Redis, app config
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Auth, roles, rate limiting, audit logs
│   │   ├── routes/       # Express router definitions
│   │   ├── services/     # Business logic
│   │   └── utils/        # Profile scoring, slugify, logger
│   └── prisma/
│       ├── schema.prisma # Full database schema
│       └── seed.ts       # Reference data seed
├── frontend/             # Next.js 14 (App Router)
│   └── src/
│       ├── app/          # Pages (public, dashboard, auth)
│       ├── components/   # UI components
│       ├── lib/          # API client, utils
│       ├── store/        # Zustand auth store
│       └── types/        # TypeScript types
├── infrastructure/
│   ├── docker/           # Docker Compose
│   ├── nginx/            # Nginx reverse proxy config
│   └── scripts/          # Backup scripts
├── .github/workflows/    # CI/CD pipeline
├── ARCHITECTURE.md       # Complete system architecture document
└── .env.example          # Environment variable template
```

---

## Quick Start (Development)

```bash
# 1. Install dependencies
cd backend && npm install && cd ../frontend && npm install && cd ..

# 2. Configure environment
cp .env.example .env  # then fill in values

# 3. Database
cd backend
npx prisma migrate dev --name init
npx tsx prisma/seed.ts

# 4. Start servers
# Terminal 1:
cd backend && npm run dev
# Terminal 2:
cd frontend && npm run dev
```

Admin: admin@truvis.info / Admin@TruVis2024! (change immediately)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Node.js 20, Express, TypeScript |
| Database | PostgreSQL 16 (Prisma ORM) |
| Cache | Redis 7 |
| Storage | Cloudflare R2 |
| Email | Resend |
| Auth | JWT RS256 + Refresh tokens |
| Infrastructure | Docker, Nginx, GitHub Actions |

---

## License

Proprietary — TruVis Corporate Services. All rights reserved.