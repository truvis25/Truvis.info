// Core domain types shared across the app.
// Mirrors supabase/migrations/0001_initial_schema.sql — regenerate with
// `supabase gen types typescript` once a live project exists.

export type OrgRole = "owner" | "admin" | "member";

export type ComplianceState =
  | "compliant"
  | "non_compliant"
  | "under_review"
  | "lapsed";

export type RiskLevel = "low" | "medium" | "high";

export interface ComplianceStanding {
  orgId: string;
  state: ComplianceState;
  riskLevel: RiskLevel;
  score: number; // 0-100
  renewalExpiry: string | null; // ISO date
  checkedAt: string; // ISO datetime
  syncedAt: string; // ISO datetime
}

export interface ContactPerson {
  name: string;
  title: string;
  email: string;
  phone: string;
  consentRecordedAt: string;
}

export interface Organization {
  id: string;
  slug: string;
  complianceOrgId: string;
  legalName: string;
  tradeLicenseNo: string | null;
  jurisdiction: string | null;
  incorporationYear: number | null;
  industryCode: string | null;
  sizeBand: string | null;
  contactPerson: ContactPerson | null;
  tagline: string | null;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  website: string | null;
  grantActive: boolean;
  adminSuspended: boolean;
  isVisible: boolean;
}

export type ListingType = "fundraise" | "equity_sale" | "business_sale";
export type ListingStatus = "draft" | "active" | "paused" | "closed";
export type ApplicationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "withdrawn";

export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type RegistrationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "waitlisted"
  | "cancelled";
