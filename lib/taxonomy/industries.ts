// Industry taxonomy: maps the ISIC/NACE-style `industry_code` stored on
// organizations to a human label, a URL slug (for SEO landing pages), and a
// short description. Pure data + lookups — unit-tested.

export interface Industry {
  code: string; // e.g. "H.52"
  slug: string; // e.g. "logistics"
  label: string; // e.g. "Logistics & Transport"
  blurb: string; // one line for landing-page metadata + hero
}

export const INDUSTRIES: Industry[] = [
  { code: "H.52", slug: "logistics", label: "Logistics & Transport", blurb: "Freight, warehousing, customs, and distribution companies." },
  { code: "F.41", slug: "construction", label: "Construction & Contracting", blurb: "Contractors, developers, and civil engineering firms." },
  { code: "C.10", slug: "food-manufacturing", label: "Food & Beverage Manufacturing", blurb: "Food producers, processors, and packaged-goods makers." },
  { code: "J.62", slug: "information-technology", label: "Information Technology", blurb: "Software, cloud, and IT services providers." },
  { code: "Q.86", slug: "healthcare", label: "Healthcare", blurb: "Clinics, hospitals, and medical service providers." },
  { code: "G.46", slug: "wholesale-trade", label: "Wholesale & Trading", blurb: "Wholesalers, distributors, and general trading companies." },
  { code: "I.55", slug: "hospitality", label: "Hospitality & Events", blurb: "Restaurants, venues, catering, and hospitality groups." },
  { code: "K.64", slug: "financial-services", label: "Financial Services", blurb: "Fintech, payments, lending, and investment firms." },
  { code: "B.09", slug: "energy-services", label: "Energy & Utilities Services", blurb: "Energy, oilfield, and utilities service companies." },
  { code: "P.85", slug: "education", label: "Education & Training", blurb: "Schools, academies, and professional training providers." },
  { code: "M.71", slug: "engineering-consulting", label: "Engineering & Consulting", blurb: "Engineering, architecture, and technical consultancies." },
  { code: "G.47", slug: "retail", label: "Retail", blurb: "Retailers and consumer-goods sellers." },
  { code: "C.20", slug: "chemicals-manufacturing", label: "Chemicals & Materials", blurb: "Chemicals, plastics, and materials manufacturers." },
  { code: "N.78", slug: "professional-staffing", label: "Staffing & HR Services", blurb: "Recruitment, staffing, and workforce services." },
  { code: "L.68", slug: "real-estate", label: "Real Estate", blurb: "Property developers, agencies, and management firms." },
];

const BY_CODE = new Map(INDUSTRIES.map((i) => [i.code, i]));
const BY_SLUG = new Map(INDUSTRIES.map((i) => [i.slug, i]));

// Human label for a code — falls back to the raw code so unknown codes still
// render (rather than disappearing).
export function industryLabel(code: string | null | undefined): string {
  if (!code) return "";
  return BY_CODE.get(code)?.label ?? code;
}

export function industryByCode(code: string | null | undefined): Industry | undefined {
  return code ? BY_CODE.get(code) : undefined;
}

export function industryBySlug(slug: string): Industry | undefined {
  return BY_SLUG.get(slug);
}

// Landing-page href for a code, or null when the code has no taxonomy entry.
export function industryHref(code: string | null | undefined): string | null {
  const industry = industryByCode(code);
  return industry ? `/directory/industry/${industry.slug}` : null;
}
