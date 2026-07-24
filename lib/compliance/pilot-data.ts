import type { PublicationGrant, StandingResponse } from "./types";

// Pilot launch content, doubling as an expanded mock-compliance catalog.
// This is the SINGLE source of truth shared by lib/compliance/mock.ts (so the
// daily compliance-poll cron keeps seeded orgs' synced_at fresh) and by
// scripts/seed-pilot.mts (which writes the org + content rows). Keeping them in
// one module is what stops the mock and the seed from drifting.
//
// Erasable-TS syntax + relative imports only, so `node --experimental-strip-types`
// can load this directly from the seed script.
//
// Visibility recap (compute_org_visibility, migration 0001) — a visible org needs:
//   grant_active AND state='compliant' AND risk<>'high' AND score>=40
//   AND (renewal_expiry null or future) AND synced within 72h.
// The catalog deliberately includes orgs that fail state, risk, and score so
// the visibility engine is exercised end-to-end.

const AUTHORIZED_FIELDS = [
  "legal_name",
  "trade_license_no",
  "jurisdiction",
  "incorporation_year",
  "industry_code",
  "size_band",
  "contact_person",
];

export interface PilotSeed {
  slug: string;
  tagline: string;
  description: string;
  website?: string;
  posts: { title: string; text: string }[];
  events: {
    slug: string;
    title: string;
    description: string;
    daysFromNow: number;
    durationHours: number;
    venue?: string;
  }[];
  catalog: {
    slug: string;
    name: string;
    itemType: "product" | "service";
    category: string;
    description: string;
    priceIndication?: string;
  }[];
}

export interface PilotOrg {
  complianceOrgId: string;
  grant: PublicationGrant;
  standing: Omit<StandingResponse, "orgId">;
  seed: PilotSeed;
}

// Recent-relative timestamps so mock standings never look stale in the 72h window.
const NOW_ISO = new Date().toISOString();
const grantedAt = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

function grant(
  id: string,
  profile: PublicationGrant["profile"],
  status: "active" | "revoked" = "active",
): PublicationGrant {
  return {
    grantId: `grt_${id}`,
    orgId: id,
    status,
    grantedAt,
    authorizedFields: AUTHORIZED_FIELDS,
    profile,
  };
}

function futureExpiry(years = 1): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

export const pilotOrgs: PilotOrg[] = [
  {
    complianceOrgId: "pilot-ae-001",
    grant: grant("pilot-ae-001", {
      legalName: "Gulf Horizon Logistics LLC",
      tradeLicenseNo: "CN-2210045",
      jurisdiction: "AE-DU",
      incorporationYear: 2012,
      industryCode: "H.52",
      sizeBand: "201-500",
      contactPerson: {
        name: "Omar Al Farsi",
        title: "Managing Director",
        email: "omar@gulfhorizon.example",
        phone: "+97143001200",
        consentRecordedAt: grantedAt,
      },
    }),
    standing: { state: "compliant", riskLevel: "low", score: 88, renewalExpiry: futureExpiry(2), checkedAt: NOW_ISO },
    seed: {
      slug: "gulf-horizon-logistics",
      tagline: "End-to-end freight and customs across the GCC",
      description:
        "Gulf Horizon Logistics moves temperature-controlled and general cargo across road, air, and sea corridors from Jebel Ali. Bonded warehousing, customs brokerage, and last-mile distribution under one verified roof.",
      website: "https://gulfhorizon.example",
      posts: [
        { title: "New bonded warehouse online in JAFZA", text: "Our third bonded facility adds 14,000 sqm of racked storage with live temperature telemetry, cutting cross-dock times for reefer cargo by a third." },
        { title: "Q3 corridor update: Riyadh land bridge", text: "We've added twice-weekly consolidated departures on the Dubai–Riyadh land bridge, with customs pre-clearance to shave a day off transit." },
      ],
      events: [
        { slug: "supply-chain-breakfast", title: "Supply Chain Resilience Breakfast", description: "A working breakfast for logistics and procurement leads on de-risking GCC supply lines.", daysFromNow: 21, durationHours: 2, venue: "JAFZA One, Dubai" },
      ],
      catalog: [
        { slug: "customs-brokerage", name: "Customs Brokerage", itemType: "service", category: "Trade Compliance", description: "HS classification, duty optimization, and clearance across UAE ports and airports.", priceIndication: "From AED 350 per declaration" },
        { slug: "bonded-warehousing", name: "Bonded Warehousing", itemType: "service", category: "Warehousing", description: "Duty-suspended racked and reefer storage with WMS visibility.", priceIndication: "From AED 45 / pallet / month" },
      ],
    },
  },
  {
    complianceOrgId: "pilot-ae-002",
    grant: grant("pilot-ae-002", {
      legalName: "Emirates Precision Contracting LLC",
      tradeLicenseNo: "CN-1904488",
      jurisdiction: "AE-AZ",
      incorporationYear: 2009,
      industryCode: "F.41",
      sizeBand: "501+",
      contactPerson: {
        name: "Layla Haddad",
        title: "Commercial Director",
        email: "layla@epc.example",
        phone: "+97124040500",
        consentRecordedAt: grantedAt,
      },
    }),
    standing: { state: "compliant", riskLevel: "medium", score: 71, renewalExpiry: futureExpiry(1), checkedAt: NOW_ISO },
    seed: {
      slug: "emirates-precision-contracting",
      tagline: "Turnkey commercial and civil construction",
      description:
        "A tier-one contractor delivering commercial towers, healthcare facilities, and infrastructure across Abu Dhabi and Al Ain, with an in-house MEP division and a decade-long safety record.",
      website: "https://epc.example",
      posts: [
        { title: "Topping out on the Corniche medical campus", text: "Structural works complete on the 11-storey outpatient campus, handed to fit-out two weeks ahead of programme." },
      ],
      events: [
        { slug: "sustainable-build-forum", title: "Sustainable Build Forum", description: "How Estidama and low-carbon concrete are reshaping tender requirements.", daysFromNow: 35, durationHours: 3, venue: "ADNEC, Abu Dhabi" },
      ],
      catalog: [
        { slug: "design-and-build", name: "Design & Build", itemType: "service", category: "Contracting", description: "Single-point-of-responsibility delivery from concept to handover.", priceIndication: "Project-based" },
        { slug: "mep-services", name: "MEP Engineering", itemType: "service", category: "Engineering", description: "In-house mechanical, electrical, and plumbing design and installation.", priceIndication: "Project-based" },
      ],
    },
  },
  {
    complianceOrgId: "pilot-ae-003",
    grant: grant("pilot-ae-003", {
      legalName: "Cedar Kitchen Foods FZE",
      tradeLicenseNo: "FZ-3320991",
      jurisdiction: "AE-SH",
      incorporationYear: 2017,
      industryCode: "C.10",
      sizeBand: "51-200",
      contactPerson: {
        name: "Nadia Khoury",
        title: "Founder & CEO",
        email: "nadia@cedarkitchen.example",
        phone: "+97165553400",
        consentRecordedAt: grantedAt,
      },
    }),
    standing: { state: "compliant", riskLevel: "low", score: 79, renewalExpiry: futureExpiry(1), checkedAt: NOW_ISO },
    seed: {
      slug: "cedar-kitchen-foods",
      tagline: "Authentic Levantine food, manufactured to spec",
      description:
        "Cedar Kitchen produces chilled and frozen Levantine ready-meals and mezze for retail and HORECA, from an SFDA- and ESMA-certified facility in Sharjah.",
      website: "https://cedarkitchen.example",
      posts: [
        { title: "Now supplying three national grocery chains", text: "Our chilled mezze range landed on shelves nationwide this month — private-label capacity is open for Q4." },
      ],
      events: [],
      catalog: [
        { slug: "private-label-mezze", name: "Private-Label Mezze", itemType: "product", category: "Food Manufacturing", description: "Hummus, moutabal, and labneh produced to your brand and spec.", priceIndication: "MOQ 5,000 units" },
        { slug: "frozen-ready-meals", name: "Frozen Ready-Meals", itemType: "product", category: "Food Manufacturing", description: "Blast-frozen Levantine meals with 12-month shelf life.", priceIndication: "From AED 6.50 / unit" },
      ],
    },
  },
  {
    complianceOrgId: "pilot-ae-004",
    grant: grant("pilot-ae-004", {
      legalName: "Meridian Cloud Systems FZ-LLC",
      tradeLicenseNo: "FZ-4408123",
      jurisdiction: "AE-DU",
      incorporationYear: 2019,
      industryCode: "J.62",
      sizeBand: "51-200",
      contactPerson: {
        name: "Rashid Noor",
        title: "CTO",
        email: "rashid@meridiancloud.example",
        phone: "+97144209900",
        consentRecordedAt: grantedAt,
      },
    }),
    standing: { state: "compliant", riskLevel: "low", score: 91, renewalExpiry: futureExpiry(2), checkedAt: NOW_ISO },
    seed: {
      slug: "meridian-cloud-systems",
      tagline: "Managed cloud and data platforms for regulated industries",
      description:
        "Meridian builds and operates compliant cloud infrastructure for banks, insurers, and healthcare providers — with data residency in the UAE and SOC 2 controls.",
      website: "https://meridiancloud.example",
      posts: [
        { title: "Launching a UAE-resident data platform", text: "Our new managed data platform keeps regulated workloads inside UAE borders end to end, with audit-ready lineage baked in." },
        { title: "SOC 2 Type II renewed", text: "We've completed our annual SOC 2 Type II examination with zero exceptions across all trust criteria." },
      ],
      events: [
        { slug: "cloud-compliance-clinic", title: "Cloud Compliance Clinic", description: "A hands-on session on data residency and audit readiness for regulated cloud workloads.", daysFromNow: 14, durationHours: 2, venue: "Online" },
      ],
      catalog: [
        { slug: "managed-cloud", name: "Managed Cloud Operations", itemType: "service", category: "Cloud", description: "24/7 operation of your cloud estate with compliance guardrails.", priceIndication: "From AED 18,000 / month" },
      ],
    },
  },
  {
    complianceOrgId: "pilot-ae-005",
    grant: grant("pilot-ae-005", {
      legalName: "Al Noor Specialist Clinics LLC",
      tradeLicenseNo: "CN-2650337",
      jurisdiction: "AE-DU",
      incorporationYear: 2014,
      industryCode: "Q.86",
      sizeBand: "201-500",
      contactPerson: {
        name: "Dr. Huda Salem",
        title: "Medical Director",
        email: "huda@alnoorclinics.example",
        phone: "+97143388220",
        consentRecordedAt: grantedAt,
      },
    }),
    standing: { state: "compliant", riskLevel: "medium", score: 68, renewalExpiry: futureExpiry(1), checkedAt: NOW_ISO },
    seed: {
      slug: "al-noor-specialist-clinics",
      tagline: "Multi-specialty outpatient care across Dubai",
      description:
        "A DHA-licensed network of outpatient clinics offering cardiology, endocrinology, and diagnostic imaging, with same-week specialist appointments.",
      website: "https://alnoorclinics.example",
      posts: [
        { title: "New cardiac imaging suite opens in Al Barsha", text: "Our Al Barsha branch now offers CT angiography and echocardiography on-site, cutting referral wait times." },
      ],
      events: [
        { slug: "womens-heart-health-day", title: "Women's Heart Health Day", description: "Free screenings and a specialist Q&A on cardiovascular risk.", daysFromNow: 28, durationHours: 4, venue: "Al Barsha, Dubai" },
      ],
      catalog: [
        { slug: "cardiology-consult", name: "Cardiology Consultation", itemType: "service", category: "Healthcare", description: "Specialist cardiology assessment with same-week availability.", priceIndication: "From AED 450" },
      ],
    },
  },
  {
    complianceOrgId: "pilot-ae-006",
    grant: grant("pilot-ae-006", {
      legalName: "Sadiq General Trading LLC",
      tradeLicenseNo: "CN-1330876",
      jurisdiction: "AE-AJ",
      incorporationYear: 2008,
      industryCode: "G.46",
      sizeBand: "11-50",
      contactPerson: {
        name: "Yusuf Karimi",
        title: "General Manager",
        email: "yusuf@sadiqtrading.example",
        phone: "+97167445100",
        consentRecordedAt: grantedAt,
      },
    }),
    standing: { state: "compliant", riskLevel: "low", score: 63, renewalExpiry: futureExpiry(1), checkedAt: NOW_ISO },
    seed: {
      slug: "sadiq-general-trading",
      tagline: "Wholesale building materials and industrial supplies",
      description:
        "A long-established Ajman wholesaler supplying contractors with plumbing, electrical, and safety materials across the Northern Emirates.",
      posts: [
        { title: "Expanded PPE line for site safety", text: "We've broadened our certified PPE catalogue with EN- and ANSI-rated ranges, in stock for immediate contractor pickup." },
      ],
      events: [],
      catalog: [
        { slug: "plumbing-supplies", name: "Plumbing Supplies", itemType: "product", category: "Building Materials", description: "Pipes, fittings, and fixtures from stocked inventory.", priceIndication: "Trade pricing" },
        { slug: "site-safety-ppe", name: "Site Safety PPE", itemType: "product", category: "Industrial Supplies", description: "Certified helmets, harnesses, and hi-vis in bulk.", priceIndication: "Trade pricing" },
      ],
    },
  },
  {
    complianceOrgId: "pilot-ae-007",
    grant: grant("pilot-ae-007", {
      legalName: "Marina Bay Hospitality LLC",
      tradeLicenseNo: "CN-2988014",
      jurisdiction: "AE-DU",
      incorporationYear: 2016,
      industryCode: "I.55",
      sizeBand: "201-500",
      contactPerson: {
        name: "Sara Mansour",
        title: "Group Operations Director",
        email: "sara@marinabay.example",
        phone: "+97144778090",
        consentRecordedAt: grantedAt,
      },
    }),
    standing: { state: "compliant", riskLevel: "medium", score: 74, renewalExpiry: futureExpiry(1), checkedAt: NOW_ISO },
    seed: {
      slug: "marina-bay-hospitality",
      tagline: "Restaurants and event venues on the Dubai waterfront",
      description:
        "A hospitality group operating waterfront restaurants and private event spaces, with an in-house catering arm for corporate and social functions.",
      website: "https://marinabay.example",
      posts: [
        { title: "New rooftop event space now booking", text: "Our 200-cover rooftop venue is open for corporate launches and weddings, with full AV and catering." },
      ],
      events: [
        { slug: "corporate-venues-open-house", title: "Corporate Venues Open House", description: "Tour our event spaces and meet the catering team.", daysFromNow: 10, durationHours: 3, venue: "Dubai Marina" },
      ],
      catalog: [
        { slug: "corporate-catering", name: "Corporate Catering", itemType: "service", category: "Hospitality", description: "Full-service catering for launches, conferences, and galas.", priceIndication: "From AED 180 / head" },
      ],
    },
  },
  {
    complianceOrgId: "pilot-ae-008",
    grant: grant("pilot-ae-008", {
      legalName: "Falcon Pay Technologies FZ-LLC",
      tradeLicenseNo: "FZ-5011302",
      jurisdiction: "AE-DU",
      incorporationYear: 2020,
      industryCode: "K.64",
      sizeBand: "51-200",
      contactPerson: {
        name: "Imran Sheikh",
        title: "Head of Partnerships",
        email: "imran@falconpay.example",
        phone: "+97144552210",
        consentRecordedAt: grantedAt,
      },
    }),
    standing: { state: "compliant", riskLevel: "low", score: 84, renewalExpiry: futureExpiry(1), checkedAt: NOW_ISO },
    seed: {
      slug: "falcon-pay-technologies",
      tagline: "Embedded payments for GCC marketplaces",
      description:
        "Falcon Pay provides embedded payment and payout rails for regional marketplaces and platforms, licensed and settlement-ready across the GCC.",
      website: "https://falconpay.example",
      posts: [
        { title: "Instant payouts now live for sellers", text: "Marketplace sellers on our rails can now receive instant settlement to UAE bank accounts, 24/7." },
      ],
      events: [
        { slug: "embedded-finance-meetup", title: "Embedded Finance Meetup", description: "A practitioner meetup on payments, payouts, and compliance for platforms.", daysFromNow: 42, durationHours: 2, venue: "DIFC, Dubai" },
      ],
      catalog: [
        { slug: "payment-gateway", name: "Payment Gateway", itemType: "service", category: "Fintech", description: "Card and wallet acceptance with a single integration.", priceIndication: "Interchange + fee" },
      ],
    },
  },
  {
    complianceOrgId: "pilot-ae-009",
    grant: grant("pilot-ae-009", {
      legalName: "Northern Lights Academy LLC",
      tradeLicenseNo: "CN-2455190",
      jurisdiction: "AE-RK",
      incorporationYear: 2013,
      industryCode: "P.85",
      sizeBand: "51-200",
      contactPerson: {
        name: "Fatima Zayed",
        title: "Principal",
        email: "fatima@nlacademy.example",
        phone: "+97172336600",
        consentRecordedAt: grantedAt,
      },
    }),
    standing: { state: "compliant", riskLevel: "low", score: 77, renewalExpiry: futureExpiry(2), checkedAt: NOW_ISO },
    seed: {
      slug: "northern-lights-academy",
      tagline: "Vocational training and professional certification",
      description:
        "A KHDA-recognised training provider in Ras Al Khaimah delivering accredited courses in logistics, hospitality, and workplace safety for employers and individuals.",
      website: "https://nlacademy.example",
      posts: [
        { title: "New accredited warehouse safety course", text: "Our latest programme certifies warehouse teams to international safety standards, with on-site delivery available." },
      ],
      events: [
        { slug: "employer-skills-briefing", title: "Employer Skills Briefing", description: "How subsidised training can close your team's skills gaps this year.", daysFromNow: 18, durationHours: 2, venue: "Ras Al Khaimah" },
      ],
      catalog: [
        { slug: "safety-certification", name: "Workplace Safety Certification", itemType: "service", category: "Education", description: "Accredited safety training delivered on-site or in-centre.", priceIndication: "From AED 900 / delegate" },
      ],
    },
  },
  // --- Intentionally hidden: exercises the visibility engine's three levers ---
  {
    // Hidden by STATE (non_compliant).
    complianceOrgId: "pilot-ae-010",
    grant: grant("pilot-ae-010", {
      legalName: "Desert Edge Trading LLC",
      tradeLicenseNo: "CN-1770220",
      jurisdiction: "AE-FU",
      incorporationYear: 2011,
      industryCode: "G.46",
      sizeBand: "11-50",
    }),
    standing: { state: "non_compliant", riskLevel: "medium", score: 58, renewalExpiry: futureExpiry(1), checkedAt: NOW_ISO },
    seed: {
      slug: "desert-edge-trading",
      tagline: "General trading (compliance lapsed)",
      description: "This organization is currently not compliant and should not appear in the public directory.",
      posts: [],
      events: [],
      catalog: [],
    },
  },
  {
    // Hidden by RISK (high).
    complianceOrgId: "pilot-ae-011",
    grant: grant("pilot-ae-011", {
      legalName: "Summit Ventures Holding LLC",
      tradeLicenseNo: "CN-2001456",
      jurisdiction: "AE-AZ",
      incorporationYear: 2018,
      industryCode: "K.64",
      sizeBand: "11-50",
    }),
    standing: { state: "compliant", riskLevel: "high", score: 61, renewalExpiry: futureExpiry(1), checkedAt: NOW_ISO },
    seed: {
      slug: "summit-ventures-holding",
      tagline: "Investment holding (high risk)",
      description: "This organization is compliant but flagged high-risk and should be hidden by the visibility engine.",
      posts: [],
      events: [],
      catalog: [],
    },
  },
  {
    // Hidden by SCORE (< 40) — the previously unexercised threshold branch.
    complianceOrgId: "pilot-ae-012",
    grant: grant("pilot-ae-012", {
      legalName: "Blue Harbor Services LLC",
      tradeLicenseNo: "CN-2330781",
      jurisdiction: "AE-SH",
      incorporationYear: 2015,
      industryCode: "B.09",
      sizeBand: "51-200",
    }),
    standing: { state: "compliant", riskLevel: "low", score: 35, renewalExpiry: futureExpiry(1), checkedAt: NOW_ISO },
    seed: {
      slug: "blue-harbor-services",
      tagline: "Energy services (below score threshold)",
      description: "This organization is compliant and low-risk but scores below the visibility threshold and should stay hidden.",
      posts: [],
      events: [],
      catalog: [],
    },
  },
];
