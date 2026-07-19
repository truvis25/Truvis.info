# Business Requirements Document (BRD)

**Product:** Truvis.info — Verified Business Directory, Events & Business Marketplace
**Company:** Truvis (UAE)
**Companion platform:** compliance.truvis.tech (organization document vault & compliance scoring)
**Version:** 1.0 (Draft)
**Date:** 2026-07-19
**Status:** For stakeholder review

---

## 1. Executive Summary

Truvis.info is a public, trust-gated B2B platform with three pillars:

1. **Business directory** — every listed organization is verified through the Truvis compliance platform (compliance.truvis.tech), where it maintains its document vault, KYC/AML posture, and compliance score. A profile appears on Truvis.info only if (a) the organization explicitly authorizes publication and (b) its compliance standing is acceptable. Profiles showcase company details, a designated contact person, product/service catalogs with media, and company posts.
2. **Event management** — organizations create and publish events, accept registrations, approve or reject attendees, and manage attendee lists from their dashboard.
3. **Business marketplace** — organizations announce their financial and corporate status and list opportunities to **raise funds**, **sell equity**, or **sell the business outright**. Subscribed buyers/investors browse opportunities and apply for review access.

The directory, posts, and events are **free**, driving traffic and network effects. The **marketplace and buyer/investor matching are subscription-gated**, forming the primary revenue stream.

The differentiator is **trust by construction**: unlike open directories where anyone can list anything, every organization on Truvis.info is continuously vetted. If the compliance platform flags an organization as high-risk, non-compliant with AML/regulatory requirements, lapsed in renewal, or low-scoring, its presence is **automatically hidden** until remediated.

---

## 2. Business Context & Problem Statement

### 2.1 The trust gap

- B2B counterparty risk is a top concern in the GCC and globally: shell companies, unverifiable claims, and stale registrations pollute open directories.
- Existing directories (generic listing sites, chamber-of-commerce lists) verify little beyond an email address. Buyers, suppliers, and investors must run their own due diligence for every counterparty.
- Business-for-sale and fundraising marketplaces suffer the same problem amplified: unverified financial claims and fraudulent listings destroy trust and deal flow.

### 2.2 The Truvis answer

Truvis already operates the compliance layer (document vault, KYC/AML checks, regulatory monitoring, risk scoring) on compliance.truvis.tech. Truvis.info converts that private compliance standing into **public, monetizable trust**:

- A Truvis.info profile is implicit proof the organization passed and maintains compliance vetting.
- Continuous enforcement (auto-hide on risk/lapse) means the directory never goes stale — a structural advantage no open directory can copy.
- The compliance platform gains a distribution incentive ("get listed") and Truvis.info gains a verification moat, creating a two-product flywheel.

### 2.3 Comparable products & best practices adopted

| Comparable | What they do well | What Truvis.info adopts | Where Truvis.info differs |
|---|---|---|---|
| LinkedIn Company Pages | Profile + posts + follower engagement | Rich org profiles, post feed, SEO-friendly public pages | Profiles are compliance-verified, not self-asserted |
| Crunchbase / ZoomInfo | Structured company data, search/filter, freemium data access | Structured firmographics, faceted search, freemium model | Data sourced from verified vault docs, org-controlled disclosure |
| Dun & Bradstreet (D-U-N-S) | Trust/risk scoring as a product | Verification badge & standing derived from compliance score | Score gates *visibility* rather than being sold as a report |
| Eventbrite / Luma | Event creation, registration, attendee management | Event pages, registration flows, organizer dashboards | Attendee approval workflow (approve/reject) is first-class; B2B focus |
| Acquire.com / Flippa / BizBuySell | Business-for-sale marketplace, buyer subscriptions, NDA-gated data rooms | Listing types (fundraise/equity/full sale), buyer subscription gating, apply-to-review flow | Sellers are pre-verified via compliance platform; no anonymous sellers |
| AngelList / OurCrowd | Startup fundraising discovery | Fundraise listing type, investor profiles | Introduction-only model (no money movement) pending licensing — see §8 |

Best practices carried into requirements: freemium funnel (free directory → paid marketplace), SEO-first public pages, organizer-controlled attendee approval, NDA/review-gated deal detail, verification badges, and continuous (not one-time) vetting.

---

## 3. Vision & Objectives

**Vision:** Become the default place in the region to find, engage, and transact with *verified* businesses.

### Business objectives (first 12 months post-launch)

| # | Objective | KPI | Target |
|---|---|---|---|
| O1 | Seed the directory from the compliance platform's client base | Published org profiles | 200+ profiles |
| O2 | Establish the directory as a traffic asset | Monthly unique visitors; organic search share | 10k MAU; 40% organic |
| O3 | Prove the events pillar | Events published / registrations processed | 50 events; 2,000 registrations |
| O4 | Monetize the marketplace | Paying subscribers; active listings | 100 subscribers; 40 listings |
| O5 | Reinforce the compliance platform funnel | Directory-driven signups to compliance.truvis.tech | 15% of new compliance clients |
| O6 | Maintain trust integrity | Time from compliance flag → profile hidden | < 15 minutes (automated) |

---

## 4. Stakeholders & Actors

| Actor | Description | Primary interest |
|---|---|---|
| **Visitor** (unauthenticated) | Anyone browsing the public directory, profiles, posts, public event pages | Discover verified businesses |
| **Registered user** (individual) | Free account; can follow orgs, register for events, save searches | Engage with orgs and events |
| **Organization owner** | The account that claimed the org (linked to its compliance.truvis.tech org) | Control profile, catalog, posts, events, listings |
| **Organization admin / member** | Additional seats invited by the owner with scoped permissions | Operate day-to-day content and events |
| **Buyer / Investor subscriber** | Paid subscription; browses marketplace, applies to review businesses | Deal discovery with verified counterparties |
| **Platform admin (Truvis staff)** | Operates Truvis.info: moderation, overrides, subscription support, audit | Platform integrity and revenue |
| **Compliance platform (system actor)** | compliance.truvis.tech — source of truth for org identity, authorization grants, compliance standing | Provides verification signals via API/webhooks |

---

## 5. Business Scope

### 5.1 In scope (this product)

1. **Organization profiles & directory** — publication gated on compliance authorization; company details, contact person, verification badge; browse, search, filter by industry/location/size; SEO-optimized public pages.
2. **Product & service catalog** — items with descriptions, specifications, media galleries (images/video/brochures).
3. **Posts** — organization announcements/updates on the profile and an aggregate feed.
4. **Events** — creation, publishing, registration, organizer approval/rejection of attendees, attendee list management, capacity limits.
5. **Marketplace** — financial/corporate status announcements; listings of type *fundraise*, *equity sale*, *business sale*; subscriber browsing; apply-to-review workflow (org approves reviewers before detail/data access); inquiry messaging between approved parties.
6. **Subscriptions & billing** — free tier and paid buyer/investor tier(s); recurring billing; self-serve upgrade/cancel.
7. **Dashboards** — per role: organization dashboard, subscriber dashboard, platform-admin dashboard.
8. **Compliance sync** — consuming status and authorization signals from compliance.truvis.tech; automated hide/show enforcement; manual admin override.

### 5.2 Out of scope (deliberately, for this product/phase)

- KYC/AML processing, document vault, and scoring — these live in compliance.truvis.tech.
- Payment escrow, transaction execution, or fund transfer between buyers and sellers (see §8 regulatory posture).
- Equity issuance, cap-table management, or securities settlement.
- Paid event ticketing (post-V1 candidate; free registration only at launch).
- Native mobile apps (responsive web first).
- Arabic localization at launch (architecture must be i18n-ready; Arabic/RTL is a fast-follow).

---

## 6. Business Model

### 6.1 Revenue streams

| Stream | Tier | Price posture (to validate) | Phase |
|---|---|---|---|
| Buyer/Investor subscription | Monthly/annual SaaS | Mid-market SaaS pricing; annual discount | Launch (V1) |
| Marketplace listing placement for orgs | Included free initially; premium placement later | Freemium → paid boost | Post-V1 |
| Featured directory placement / profile enhancements | Add-on | Sponsored slots, badges | Post-V1 |
| Event ticketing fees | % + fixed per paid ticket | Only when paid ticketing ships | V2 |
| Compliance platform cross-sell | Indirect | Directory as lead-gen for compliance.truvis.tech | Launch |

### 6.2 Free tier (organizations)

Profile publication, catalog, posts, event creation and attendee management are free. Rationale: supply-side liquidity is the platform's asset; friction on supply kills directories. Free organizations are still fully compliance-gated.

### 6.3 Paid tier (buyers/investors)

Marketplace browsing beyond teaser level, applying to review businesses, contacting listing owners, and matching/alerts require an active subscription. Teasers (anonymized/blurred summary of listings) are publicly visible as conversion bait — an Acquire.com/BizBuySell best practice.

---

## 7. Core Business Rules

| ID | Rule |
|---|---|
| BR-1 | An organization profile may be **published** on Truvis.info only when a valid **publication grant** exists from compliance.truvis.tech, authorized by the organization itself in its compliance workspace. |
| BR-2 | Profile identity data (legal name, registration facts, contact person) originates from the compliance vault via the grant; the organization may add marketing content (logo, description, catalog, posts) directly on Truvis.info. |
| BR-3 | If the compliance platform reports the organization as **high risk**, **non-compliant (AML/regulatory)**, **renewal lapsed**, or **score below threshold**, all public presence (profile, catalog, posts, events, listings) is **automatically deactivated/hidden** — target within 15 minutes of the signal. |
| BR-4 | Remediation (status returns to acceptable) automatically restores visibility; no manual re-entry of content is required. |
| BR-5 | If compliance status data becomes **stale** (no successful sync within the configured window, default 72h), the organization is treated as unverified and hidden (fail-safe, not fail-open). |
| BR-6 | Revocation of the publication grant by the organization immediately unpublishes the profile. |
| BR-7 | Marketplace listings are visible in **teaser form** to everyone; full detail requires (a) an active buyer subscription and (b) per-listing approval of the buyer's review application by the listing organization. |
| BR-8 | Event organizers explicitly approve or reject each registration (or enable auto-approve per event); only approved attendees appear on the confirmed attendee list. |
| BR-9 | Platform admins may manually suspend any content or organization notwithstanding compliance status (moderation override); every such action is audit-logged. |
| BR-10 | Truvis.info **introduces** parties only: it never holds client money, executes transactions, or advises on investments. All deal execution happens off-platform. |
| BR-11 | Every visibility state change (publish, hide, restore, suspend) is recorded in an immutable audit log with actor, reason, and timestamp. |

---

## 8. Regulatory & Legal Posture (critical)

Because the marketplace surfaces **equity sale and fundraising** opportunities, Truvis.info must avoid activities that require a securities/financial-promotion license (UAE SCA at federal level; DFSA in DIFC; FSRA in ADGM; analogous regimes elsewhere).

**Mandated posture for launch:**

1. **Introduction-only listing service.** The platform publishes organization-authored announcements and connects interested parties. It does not solicit investment, recommend opportunities, negotiate terms, or take success fees tied to deal completion.
2. **No client money.** No escrow, no payment rails between buyer and seller (subscriptions are platform fees, unrelated to deals).
3. **Disclaimers everywhere.** All marketplace surfaces carry prominent disclaimers: content is provided by the listing organization; Truvis provides no investment advice; users must conduct their own due diligence.
4. **Compliance-verified sellers only** reduces (but does not eliminate) fraud exposure; buyer subscriptions include ToS acknowledging the introduction-only model.
5. **Legal review is a launch gate.** A qualified UAE counsel review of the marketplace module (listing language, fee structure, disclaimers, ToS) is a mandatory milestone before the marketplace goes live (see Development Plan, Phase 4/5). If counsel advises, marketplace features degrade gracefully to "announcements + contact request" without structured deal terms.
6. **Data protection.** UAE PDPL (Federal Decree-Law 45/2021) compliance: lawful basis for processing contact-person personal data (authorized via the compliance grant), user consent records, data-subject rights handling, and processor terms with subprocessors (Supabase, Vercel, Stripe).

---

## 9. Success Metrics

- **Supply:** published profiles; % of compliance-platform clients who authorize publication; catalog items per org.
- **Demand:** MAU, organic search traffic, profile views, follows, event registrations.
- **Marketplace:** subscriber count, MRR, churn, listings, review applications per listing, approved reviews.
- **Trust integrity:** flag-to-hidden latency; stale-sync incidents; moderation actions; zero tolerated incidents of unverified orgs shown as verified.
- **Cross-platform flywheel:** directory-attributed compliance platform signups.

---

## 10. Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Regulatory reclassification of marketplace as licensed activity | Medium | High | §8 posture; legal review gate; feature degradation path |
| R2 | Cold start: empty directory has no visitor value | High | High | Seed from compliance client base (O1); SEO pages indexed early; free tier |
| R3 | Compliance API not ready when Truvis.info needs it | Medium | Medium | Build against a **mocked contract** (see ARCHITECTURE.md §5); contract agreed up front |
| R4 | Orgs fear visibility of being *de-listed* (reputational signal) | Medium | Medium | Hidden ≠ publicly flagged: profile silently unavailable, no "removed for risk" banner |
| R5 | Fraudulent buyer subscribers mining data | Medium | Medium | Per-listing seller approval (BR-7), subscriber identity capture, report/ban tooling |
| R6 | Two-platform account confusion | Medium | Low | SSO with compliance.truvis.tech; clear "managed in compliance platform" labels on vault-sourced fields |
| R7 | Stale compliance data shows a risky org | Low | High | Fail-safe staleness rule (BR-5); webhook + polling redundancy |
| R8 | PDPL breach via contact-person data | Low | High | Consent captured in grant flow; minimal data replication; DPA with subprocessors |

---

## 11. Assumptions & Dependencies

- compliance.truvis.tech will expose the agreed API + webhooks (ARCHITECTURE.md §5) and act as OAuth/OIDC identity provider for org-owner SSO; until then Truvis.info develops against a mock.
- Truvis controls the `truvis.info` domain and can provision DNS.
- Stripe (or an equivalent UAE-supported PSP) is acceptable for subscription billing; deal payments never touch the platform.
- Initial go-to-market focuses on UAE/GCC; the platform is not geo-restricted.
- English-only UI at launch; all user-facing strings externalized for later Arabic/RTL.

---

## 12. Glossary

| Term | Meaning |
|---|---|
| **Publication grant** | The organization's explicit authorization, recorded on compliance.truvis.tech, allowing Truvis.info to publish its profile and specified vault-sourced fields |
| **Compliance standing** | The synced snapshot of {state, risk level, score, renewal expiry} used for visibility decisions |
| **Teaser** | Public, limited view of a marketplace listing (industry, size band, headline) without identity/financial detail |
| **Review application** | A subscriber's request to access a listing's full detail, approved/rejected by the listing organization |
| **Visibility** | Whether an org and all its content are shown publicly; derived, never manually set (except admin suspension) |
