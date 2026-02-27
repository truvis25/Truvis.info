# TruVis.info — Complete Platform Architecture

> **Version:** 1.0.0 MVP
> **Classification:** Strategic Infrastructure Asset
> **Architect:** Claude (Senior Software Architect)
> **Date:** 2026-02-27

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        INTERNET / CDN                           │
│                    (Cloudflare CDN + WAF)                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    LOAD BALANCER (Nginx)                        │
│                 SSL Termination + Rate Limiting                  │
└────────────┬──────────────────────────────┬─────────────────────┘
             │                              │
┌────────────▼────────────┐  ┌─────────────▼──────────────────────┐
│   FRONTEND (Next.js 14) │  │    BACKEND API (Node.js/Express)    │
│   Vercel / VPS          │  │    PM2 Cluster / Docker             │
│   SSR + SSG + ISR       │  │    Port 4000                       │
└────────────┬────────────┘  └─────────────┬──────────────────────┘
             │                              │
             │                 ┌────────────┼──────────────┐
             │                 │            │              │
        ┌────▼─────────────────▼──┐  ┌─────▼───┐  ┌──────▼──────┐
        │   PostgreSQL (Primary)  │  │  Redis  │  │  S3/R2      │
        │   + Read Replica        │  │  Cache  │  │  File Store │
        └─────────────────────────┘  └─────────┘  └─────────────┘
```

---

## 2. Recommended Tech Stack

### Frontend
| Layer | Technology | Reasoning |
|-------|-----------|-----------|
| Framework | **Next.js 14** (App Router) | SSR/SSG for SEO, ISR for directory pages, React ecosystem |
| Language | **TypeScript** | Type safety at scale, better DX |
| Styling | **Tailwind CSS + shadcn/ui** | Utility-first, consistent design system |
| State | **Zustand + React Query** | Lightweight global state + server state caching |
| Forms | **React Hook Form + Zod** | Performant, typed form validation |
| Rich Text | **Tiptap** | Headless, extensible, ProseMirror-based |
| Maps | **Mapbox GL JS** | Premium map rendering for business locations |

### Backend
| Layer | Technology | Reasoning |
|-------|-----------|-----------|
| Runtime | **Node.js 20 LTS** | JS ecosystem consistency, high I/O performance |
| Framework | **Express.js** | Mature, flexible, middleware ecosystem |
| Language | **TypeScript** | Type safety, refactoring confidence |
| ORM | **Prisma** | Type-safe DB access, excellent migrations |
| Auth | **JWT (RS256) + Refresh Tokens** | Stateless, scalable, revocable via Redis |
| Validation | **Zod** | Runtime + compile-time validation |
| Queue | **BullMQ + Redis** | Email jobs, media processing, async tasks |
| Search | **PostgreSQL FTS + pg_trgm** | Full-text search without external dependency for MVP |

### Database & Storage
| Layer | Technology | Reasoning |
|-------|-----------|-----------|
| Primary DB | **PostgreSQL 16** | ACID, JSON support, full-text search, proven scale |
| Cache | **Redis 7** | Session blacklist, rate limiting, job queues |
| File Storage | **Cloudflare R2** | S3-compatible, no egress fees, global CDN |
| Email | **Resend / SendGrid** | Transactional email, high deliverability |

### Infrastructure
| Layer | Technology | Reasoning |
|-------|-----------|-----------|
| Hosting | **Railway / DigitalOcean** | PaaS simplicity with VPS flexibility |
| CI/CD | **GitHub Actions** | Native integration, free for public repos |
| Containers | **Docker + Docker Compose** | Environment parity |
| Reverse Proxy | **Nginx** | SSL, rate limiting, static serving |
| Monitoring | **Sentry + Grafana + Loki** | Error tracking + observability |

---

## 3. Database Schema

### Core Tables

#### `users`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
email           VARCHAR(255) UNIQUE NOT NULL
password_hash   VARCHAR(255) NOT NULL
role            ENUM('company','admin','super_admin') DEFAULT 'company'
email_verified  BOOLEAN DEFAULT false
email_token     VARCHAR(255)
is_active       BOOLEAN DEFAULT true
last_login_at   TIMESTAMP
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### `companies`
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id             UUID REFERENCES users(id) ON DELETE CASCADE
slug                VARCHAR(255) UNIQUE NOT NULL           -- SEO URL
name                VARCHAR(255) NOT NULL
license_number      VARCHAR(100)
description         TEXT                                   -- Rich HTML (sanitized)
tagline             VARCHAR(500)
founded_year        INTEGER
employee_count      ENUM('1-10','11-50','51-200','201-500','500+')
website             VARCHAR(500)
email               VARCHAR(255)
phone               VARCHAR(50)
whatsapp            VARCHAR(50)
address             TEXT
city                VARCHAR(100)
country             VARCHAR(100)
latitude            DECIMAL(10,8)
longitude           DECIMAL(11,8)
logo_url            VARCHAR(500)
cover_url           VARCHAR(500)
video_url           VARCHAR(500)
gallery             JSONB DEFAULT '[]'                     -- Array of image URLs
social_links        JSONB DEFAULT '{}'                     -- {linkedin, twitter, instagram, facebook}
status              ENUM('draft','pending','approved','rejected') DEFAULT 'draft'
rejection_reason    TEXT
profile_score       INTEGER DEFAULT 0                      -- Completeness 0-100
featured            BOOLEAN DEFAULT false
featured_until      TIMESTAMP
featured_order      INTEGER DEFAULT 0
truvis_client       BOOLEAN DEFAULT false                  -- Badge 1
truvis_verified     BOOLEAN DEFAULT false                  -- Badge 2
verified_at         TIMESTAMP
verified_by         UUID REFERENCES users(id)
approved_at         TIMESTAMP
approved_by         UUID REFERENCES users(id)
views_count         INTEGER DEFAULT 0
contact_count       INTEGER DEFAULT 0
last_activity_at    TIMESTAMP DEFAULT NOW()
rank_score          DECIMAL(10,4) DEFAULT 0                -- Computed ranking
meta_title          VARCHAR(255)
meta_description    VARCHAR(500)
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()
```

#### `industries`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
name        VARCHAR(100) NOT NULL
slug        VARCHAR(100) UNIQUE NOT NULL
icon        VARCHAR(100)
is_active   BOOLEAN DEFAULT true
sort_order  INTEGER DEFAULT 0
created_at  TIMESTAMP DEFAULT NOW()
```

#### `categories`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
industry_id   UUID REFERENCES industries(id)
name          VARCHAR(100) NOT NULL
slug          VARCHAR(100) UNIQUE NOT NULL
is_active     BOOLEAN DEFAULT true
sort_order    INTEGER DEFAULT 0
created_at    TIMESTAMP DEFAULT NOW()
```

#### `company_industries` (M2M)
```sql
company_id    UUID REFERENCES companies(id) ON DELETE CASCADE
industry_id   UUID REFERENCES industries(id) ON DELETE CASCADE
is_primary    BOOLEAN DEFAULT false
PRIMARY KEY (company_id, industry_id)
```

#### `company_categories` (M2M)
```sql
company_id    UUID REFERENCES companies(id) ON DELETE CASCADE
category_id   UUID REFERENCES categories(id) ON DELETE CASCADE
PRIMARY KEY (company_id, category_id)
```

#### `truvis_service_tags`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
name        VARCHAR(100) NOT NULL
slug        VARCHAR(100) UNIQUE NOT NULL
description TEXT
icon        VARCHAR(100)
is_active   BOOLEAN DEFAULT true
```

#### `company_service_tags` (M2M)
```sql
company_id      UUID REFERENCES companies(id) ON DELETE CASCADE
tag_id          UUID REFERENCES truvis_service_tags(id) ON DELETE CASCADE
assigned_by     UUID REFERENCES users(id)
assigned_at     TIMESTAMP DEFAULT NOW()
PRIMARY KEY (company_id, tag_id)
```

#### `services` (Company Services/Products)
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
company_id    UUID REFERENCES companies(id) ON DELETE CASCADE
type          ENUM('service','product','capability')
title         VARCHAR(255) NOT NULL
description   TEXT
sort_order    INTEGER DEFAULT 0
created_at    TIMESTAMP DEFAULT NOW()
```

#### `blog_posts`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
company_id      UUID REFERENCES companies(id) ON DELETE CASCADE
author_id       UUID REFERENCES users(id)
title           VARCHAR(500) NOT NULL
slug            VARCHAR(500) UNIQUE NOT NULL
content         TEXT                                       -- Sanitized HTML
excerpt         VARCHAR(1000)
cover_url       VARCHAR(500)
status          ENUM('draft','pending','published','rejected') DEFAULT 'draft'
rejection_reason TEXT
published_at    TIMESTAMP
views_count     INTEGER DEFAULT 0
meta_title      VARCHAR(255)
meta_description VARCHAR(500)
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### `contact_inquiries`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
company_id    UUID REFERENCES companies(id) ON DELETE SET NULL
sender_name   VARCHAR(255) NOT NULL
sender_email  VARCHAR(255) NOT NULL
sender_phone  VARCHAR(50)
subject       VARCHAR(255)
message       TEXT NOT NULL
ip_address    VARCHAR(50)
is_read       BOOLEAN DEFAULT false
created_at    TIMESTAMP DEFAULT NOW()
```

#### `audit_logs`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id       UUID REFERENCES users(id) ON DELETE SET NULL
action        VARCHAR(100) NOT NULL
entity_type   VARCHAR(50)
entity_id     UUID
old_values    JSONB
new_values    JSONB
ip_address    VARCHAR(50)
user_agent    TEXT
created_at    TIMESTAMP DEFAULT NOW()
```

#### `refresh_tokens`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id     UUID REFERENCES users(id) ON DELETE CASCADE
token_hash  VARCHAR(255) UNIQUE NOT NULL
expires_at  TIMESTAMP NOT NULL
revoked     BOOLEAN DEFAULT false
ip_address  VARCHAR(50)
created_at  TIMESTAMP DEFAULT NOW()
```

### Marketplace Tables (Future-Ready)

#### `marketplace_listings`
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
company_id        UUID REFERENCES companies(id)
listed_by         UUID REFERENCES users(id)
type              ENUM('business_for_sale','investment','partnership')
title             VARCHAR(500) NOT NULL
description       TEXT
asking_price      DECIMAL(15,2)
currency          VARCHAR(10) DEFAULT 'USD'
revenue_annual    DECIMAL(15,2)
ebitda            DECIMAL(15,2)
industry_id       UUID REFERENCES industries(id)
country           VARCHAR(100)
city              VARCHAR(100)
is_confidential   BOOLEAN DEFAULT true
nda_required      BOOLEAN DEFAULT true
status            ENUM('draft','active','under_offer','sold','withdrawn') DEFAULT 'draft'
views_count       INTEGER DEFAULT 0
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()
expires_at        TIMESTAMP
```

#### `nda_requests`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
listing_id      UUID REFERENCES marketplace_listings(id)
requester_id    UUID REFERENCES users(id)
full_name       VARCHAR(255) NOT NULL
company_name    VARCHAR(255)
email           VARCHAR(255) NOT NULL
phone           VARCHAR(50)
purpose         TEXT
status          ENUM('pending','approved','rejected') DEFAULT 'pending'
signed_at       TIMESTAMP
created_at      TIMESTAMP DEFAULT NOW()
```

### Monetization Tables

#### `subscription_plans`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            VARCHAR(100) NOT NULL
slug            VARCHAR(100) UNIQUE NOT NULL
description     TEXT
price_monthly   DECIMAL(10,2)
price_annually  DECIMAL(10,2)
currency        VARCHAR(10) DEFAULT 'USD'
features        JSONB DEFAULT '{}'
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMP DEFAULT NOW()
```

#### `company_subscriptions`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
company_id      UUID REFERENCES companies(id) ON DELETE CASCADE
plan_id         UUID REFERENCES subscription_plans(id)
status          ENUM('active','cancelled','expired','past_due') DEFAULT 'active'
billing_cycle   ENUM('monthly','annually')
started_at      TIMESTAMP DEFAULT NOW()
expires_at      TIMESTAMP
cancelled_at    TIMESTAMP
payment_ref     VARCHAR(255)
created_at      TIMESTAMP DEFAULT NOW()
```

---

## 4. Role & Permission Matrix

| Action | Public | Company | Admin | Super Admin |
|--------|--------|---------|-------|-------------|
| View approved profiles | ✅ | ✅ | ✅ | ✅ |
| Search & filter | ✅ | ✅ | ✅ | ✅ |
| Contact form | ✅ | ✅ | ✅ | ✅ |
| Register | ✅ | — | — | — |
| Login | — | ✅ | ✅ | ✅ |
| Create/edit own profile | — | ✅ | ✅ | ✅ |
| Submit for approval | — | ✅ | ✅ | ✅ |
| Submit blog posts | — | ✅ | ✅ | ✅ |
| View own dashboard | — | ✅ | ✅ | ✅ |
| Approve/reject companies | — | ❌ | ✅ | ✅ |
| Assign TruVis badges | — | ❌ | ✅ | ✅ |
| Feature companies | — | ❌ | ✅ | ✅ |
| Moderate blog posts | — | ❌ | ✅ | ✅ |
| Manage industries/categories | — | ❌ | ✅ | ✅ |
| View audit logs | — | ❌ | ✅ | ✅ |
| Manage admins | — | ❌ | ❌ | ✅ |
| Manage subscription plans | — | ❌ | ❌ | ✅ |
| View all companies (any status) | — | ❌ | ✅ | ✅ |
| Delete companies | — | ❌ | ❌ | ✅ |

### Middleware Architecture
```
Request → rateLimiter → authenticate → authorizeRole(['admin']) → handler
```

---

## 5. Full User Flow

### Company Registration Flow
```
1. Register (email + password)
2. Email verification (token link, 24h expiry)
3. Login → JWT issued (access: 15min, refresh: 7d)
4. Dashboard accessed
5. Profile builder (step-by-step wizard):
   Step 1: Basic Info (name, country, city, industry)
   Step 2: Contact & Links
   Step 3: Media (logo, cover, gallery)
   Step 4: Services & Products
   Step 5: Description (rich text)
   Step 6: Review & Submit
6. Status: DRAFT → submitted → PENDING
7. Admin reviews → APPROVED or REJECTED (with reason)
8. Company notified via email
9. If approved → profile goes PUBLIC
10. Company can submit blog posts (status: pending → admin review)
```

### Admin Review Flow
```
1. Admin receives notification (new pending company)
2. Admin Dashboard → Pending Queue
3. View full profile preview
4. Actions:
   - Approve → company notified
   - Reject → reason required → company notified
   - Edit → make corrections before approval
   - Assign TruVis Client badge
   - Assign TruVis Verified badge
   - Assign service tags
   - Mark as Featured
5. All actions logged to audit_logs
```

### Public User Flow
```
1. Land on homepage (featured/verified companies shown)
2. Search by name or keyword
3. Filter: country, city, industry, verified status, TruVis services
4. Sort: A-Z, Recently Added, Verified First
5. View company profile (public view)
6. Send contact inquiry (rate-limited, reCAPTCHA protected)
7. Admin and company notified of inquiry
```

---

## 6. Verification & Badge Logic

### ✔ TruVis Client Badge
- **Qualification:** Company has an existing or past engagement/contract with TruVis Corporate Services
- **Assignment:** Admin-only manual toggle (cannot be self-claimed)
- **Data source:** Internal TruVis CRM cross-reference
- **Display:** Gold checkmark + "TruVis Client" label
- **Abuse prevention:**
  - Admin-only assignment endpoint (`POST /api/admin/companies/:id/badge`)
  - Action logged in `audit_logs`
  - Badge state stored in DB, not in JWT

### ★ TruVis Verified Badge
- **Qualification:** Company has been actively verified (documents reviewed, license confirmed, physical verification if applicable)
- **Additional criteria:** Profile completeness score ≥ 80%, approved status
- **Assignment:** Admin-only with timestamp + admin ID recorded
- **Display:** Premium gold star + "TruVis Verified" label
- **Revocation:** Admin can revoke at any time (logged)

### Ranking Prioritization
```
TruVis Verified (featured) > TruVis Verified > TruVis Client > Approved
```

---

## 7. Approval Workflow Design

```
DRAFT ──[submit]──→ PENDING ──[approve]──→ APPROVED
                         │
                         └──[reject with reason]──→ REJECTED
                                                        │
                                                        └──[resubmit]──→ PENDING
```

### Notification Triggers
| Event | Recipient | Channel |
|-------|-----------|---------|
| Profile submitted | Admin(s) | Email + Dashboard |
| Profile approved | Company | Email |
| Profile rejected | Company | Email (with reason) |
| Blog submitted | Admin(s) | Email + Dashboard |
| Blog approved | Company | Email |
| Blog rejected | Company | Email (with reason) |
| Contact inquiry received | Company + Admin | Email |
| Badge assigned | Company | Email |

---

## 8. Search & Ranking Algorithm

### Rank Score Formula
```
rank_score = (
  (truvis_verified ? 40 : 0) +
  (truvis_client ? 20 : 0) +
  (featured ? 30 : 0) +
  (profile_score * 0.1) +                    -- max 10 pts (profile 0-100)
  (service_tag_count * 2) +                  -- max ~20 pts
  (LEAST(views_count / 100, 10)) +           -- max 10 pts
  (days_since_activity < 30 ? 10 : 0)        -- recency bonus
)
```

### Profile Completeness Score (0–100)
| Field | Points |
|-------|--------|
| Logo uploaded | 15 |
| Cover uploaded | 10 |
| Description (>100 chars) | 15 |
| Services added (≥1) | 10 |
| Industry assigned | 10 |
| Phone + Email + Website | 10 |
| Social links (≥2) | 5 |
| Gallery (≥3 images) | 10 |
| License number | 5 |
| Country + City + Address | 10 |

### Search Implementation
```sql
-- Full-text search with ranking
SELECT c.*,
  ts_rank(
    to_tsvector('english', c.name || ' ' || coalesce(c.description,'') || ' ' || coalesce(c.tagline,'')),
    plainto_tsquery('english', $query)
  ) as text_rank
FROM companies c
WHERE c.status = 'approved'
AND (
  to_tsvector('english', c.name || ' ' || coalesce(c.description,'')) @@ plainto_tsquery('english', $query)
  OR c.name ILIKE '%' || $query || '%'
)
-- Filters applied as WHERE clauses
AND ($country = '' OR c.country = $country)
AND ($industry_id IS NULL OR c.id IN (SELECT company_id FROM company_industries WHERE industry_id = $industry_id))
AND ($truvis_verified IS NULL OR c.truvis_verified = $truvis_verified)
-- Composite sort
ORDER BY
  c.featured DESC,
  c.rank_score DESC,
  text_rank DESC,
  c.approved_at DESC
LIMIT $limit OFFSET $offset;
```

---

## 9. Blog & Content Moderation Architecture

### Blog State Machine
```
DRAFT → PENDING → PUBLISHED
              ↓
           REJECTED (with reason) → [edit] → PENDING
```

### Content Security
- Rich text stored as **sanitized HTML** (DOMPurify server-side via `isomorphic-dompurify`)
- Allowed tags whitelist: `p, h2, h3, h4, ul, ol, li, strong, em, a, blockquote, img`
- Image URLs in blog posts must point to approved CDN domain only
- Admin can edit before publishing
- Keyword blacklist check on submission (configurable)

---

## 10. Security Architecture

### Authentication
- **JWT RS256** (asymmetric): private key signs, public key verifies
- Access token: **15 minutes TTL** (short-lived)
- Refresh token: **7 days TTL**, stored in **HttpOnly cookie** + hashed in DB
- Token rotation: new refresh token on each use
- Revocation: Redis blacklist for access tokens on logout

### Security Layers
```
1. Cloudflare WAF (DDoS, bot protection, country blocking)
2. Nginx rate limiting (1000 req/15min general, 5 req/min auth)
3. Express rate limiter (per-route granular limits)
4. JWT validation middleware
5. Role-based authorization middleware
6. Input validation (Zod schemas on every endpoint)
7. SQL injection: Prisma parameterized queries (no raw SQL)
8. XSS: DOMPurify sanitization on all rich text
9. File upload: type whitelist, size limits, virus scan (ClamAV or SaaS)
10. reCAPTCHA v3 on contact forms + registration
11. CORS: strict origin whitelist
12. Helmet.js: security headers
13. HTTPS only (HSTS enforced)
```

### File Upload Security
```
Allowed types: image/jpeg, image/png, image/webp
Max logo size: 2MB
Max cover size: 5MB
Max gallery image: 5MB (max 20 images)
Processing: Sharp.js resize + WebP conversion before storage
Storage: Cloudflare R2 (private bucket with signed URLs)
Virus scan: ClamAV on upload worker
```

### GDPR Compliance Structure
- Data processing consent on registration
- Cookie consent banner (essential + analytics + marketing)
- Data export endpoint (`GET /api/company/export-data`)
- Account deletion (`DELETE /api/company/account`) — soft delete, 30d retention
- Privacy policy + Terms of Service pages
- Admin contact data encrypted at rest

---

## 11. Scalability Plan

### Phase 1: MVP (0–1K companies)
- Single VPS (4 vCPU, 8GB RAM)
- PostgreSQL on same server
- Redis single instance
- Cloudflare R2 storage

### Phase 2: Growth (1K–10K companies)
- Separate DB server (read replica for search queries)
- Redis Cluster for job queues
- CDN for all static assets
- Migrate to managed PostgreSQL (Supabase / RDS)

### Phase 3: Scale (10K+ companies)
- Elasticsearch for advanced search (replace pg FTS)
- Multiple API server instances (PM2 cluster → Kubernetes)
- DB connection pooling (PgBouncer)
- Search index sharding by region
- Edge functions for public profile pages

---

## 12. Future Marketplace Structural Preparation

### Data Model (Pre-built)
All marketplace tables are included in the schema (`marketplace_listings`, `nda_requests`).

### API Routes (Stubbed)
```
POST   /api/marketplace/listings          -- Create listing
GET    /api/marketplace/listings          -- Public listings (non-confidential)
GET    /api/marketplace/listings/:id      -- Single listing
POST   /api/marketplace/listings/:id/nda -- Request NDA access
PATCH  /api/admin/marketplace/:id        -- Admin manage listing
```

### NDA Workflow
```
1. Public sees listing title + industry + location + price range
2. Confidential details hidden behind "Request Access" button
3. Buyer submits NDA form (name, company, email, purpose)
4. Admin reviews + approves/rejects
5. On approval: buyer gets full details via secure email
6. All NDA activity logged
```

---

## 13. Monetization Strategy

### Tier Structure (UAE Market Pricing)
| Plan | Monthly | Annual | Target |
|------|---------|--------|--------|
| **Free** | 0 | 0 | All verified clients |
| **Essential** | $99/mo | $990/yr | Active SMEs |
| **Professional** | $299/mo | $2,990/yr | Growth companies |
| **Enterprise** | Custom | Custom | Large corporates |

### Revenue Streams

| Stream | How | When |
|--------|-----|------|
| **Featured Listing** | $299–$999/mo for homepage + search boost | Phase 1 |
| **Verified Badge Upgrade** | $199 one-time verification fee | Phase 1 |
| **Premium Analytics** | View who contacted you, profile analytics | Phase 2 |
| **Sponsored Placement** | CPM/CPC banner within search results | Phase 2 |
| **Lead Generation** | Pay-per-verified-inquiry | Phase 2 |
| **Marketplace Commission** | 1–3% on closed business sale transactions | Phase 3 |
| **NDA Management Fee** | $199/listing for managed NDA process | Phase 3 |

### UAE Market Strategy
- **AED pricing display** for local companies
- **Free tier** used as lead magnet for TruVis advisory services
- **Package deals**: TruVis corporate service clients get 12 months free Featured status
- **Annual payment preference**: UAE market prefers annual invoices → 2 months free incentive

---

## 14. SEO & Data Strategy

### SEO Architecture
```
/                              → Homepage (SSG, revalidate 1h)
/directory                     → Directory index (SSR with filters)
/directory/[slug]              → Company profile (ISR, revalidate 24h)
/blog                          → Blog index (SSG, revalidate 1h)
/blog/[slug]                   → Blog post (ISR, revalidate 6h)
/industries/[slug]             → Industry page (SSG)
/sitemap.xml                   → Dynamic sitemap
/robots.txt                    → Crawl rules
```

### Technical SEO
- **Structured data:** `Organization` + `LocalBusiness` JSON-LD on company profiles
- **Open Graph:** Dynamic OG images generated via `@vercel/og`
- **Canonical URLs:** Enforced on all pages
- **Sitemap:** Auto-generated, submitted to Google Search Console
- **Core Web Vitals:** Optimized (Next.js Image, font optimization, bundle splitting)

### Data Strategy
- Profile view analytics (aggregate, not individual tracking)
- Search query analytics → powers trending industries
- Contact inquiry patterns → sales intelligence for TruVis advisory
- Ranking data exported monthly for business review

---

## 15. Deployment & DevOps Structure

### Environment Separation
```
environments/
├── .env.development     -- Local dev
├── .env.staging         -- Staging server
└── .env.production      -- Production (secret manager)
```

### Environment Variables
```bash
# App
NODE_ENV=production
PORT=4000
APP_URL=https://truvis.info
API_URL=https://api.truvis.info

# Database
DATABASE_URL=postgresql://user:pass@host:5432/truvis_prod

# Redis
REDIS_URL=redis://user:pass@host:6379

# JWT (RS256 keys)
JWT_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----...
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----...
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Storage
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=truvis-media
R2_PUBLIC_URL=https://media.truvis.info

# Email
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@truvis.info

# Security
RECAPTCHA_SECRET_KEY=xxx
CORS_ORIGINS=https://truvis.info,https://www.truvis.info

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### CI/CD Pipeline
```yaml
# GitHub Actions: .github/workflows/deploy.yml
Trigger: push to main branch

Pipeline:
1. Install dependencies
2. Run type check (tsc --noEmit)
3. Run linter (ESLint)
4. Run tests (Jest/Vitest)
5. Build Docker image
6. Push to registry
7. Deploy to staging
8. Run smoke tests
9. Deploy to production (manual approval gate)
10. Notify Slack
```

### Backup Strategy
```
PostgreSQL:
  - Automated daily dumps to R2 (retained 30 days)
  - WAL streaming to replica
  - Weekly full backup to separate region

Redis:
  - RDB snapshots every 6 hours
  - AOF persistence enabled

Media files (R2):
  - Versioning enabled
  - Cross-region replication

Code:
  - Git history is the backup
  - GitHub as source of truth
```

---

## Directory Structure (Monorepo)

```
Truvis.info/
├── backend/
│   ├── src/
│   │   ├── config/          -- DB, Redis, storage config
│   │   ├── controllers/     -- Route handlers
│   │   ├── middleware/      -- Auth, roles, rate limiting
│   │   ├── models/          -- Prisma models + computed fields
│   │   ├── routes/          -- Express router definitions
│   │   ├── services/        -- Business logic layer
│   │   ├── utils/           -- Helpers, validators
│   │   └── jobs/            -- BullMQ workers
│   ├── prisma/
│   │   └── schema.prisma    -- Database schema
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/             -- Next.js App Router pages
│   │   ├── components/      -- UI components
│   │   ├── lib/             -- API client, utils
│   │   ├── hooks/           -- Custom React hooks
│   │   ├── store/           -- Zustand stores
│   │   └── types/           -- TypeScript types
│   ├── Dockerfile
│   └── package.json
├── infrastructure/
│   ├── docker/
│   │   └── docker-compose.yml
│   ├── nginx/
│   │   └── nginx.conf
│   └── scripts/
│       ├── backup.sh
│       └── deploy.sh
└── .github/
    └── workflows/
        └── deploy.yml
```
