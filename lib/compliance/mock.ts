import type {
  ComplianceApiClient,
  PublicationGrant,
  StandingResponse,
} from "./types";

// Mock implementation of the partner API (docs/ARCHITECTURE.md §5.5).
// Lets every feature build and demo before the real API ships (PRD CMP-7).
// Scenario orgs cover the visibility matrix: compliant, high-risk, lapsed, revoked.

const grants: Record<string, PublicationGrant> = {
  "org-demo-1": {
    grantId: "grt_demo_1",
    orgId: "org-demo-1",
    status: "active",
    grantedAt: "2026-07-01T08:00:00Z",
    authorizedFields: [
      "legal_name",
      "trade_license_no",
      "jurisdiction",
      "incorporation_year",
      "industry_code",
      "size_band",
      "contact_person",
    ],
    profile: {
      legalName: "Example Logistics LLC",
      tradeLicenseNo: "CN-1234567",
      jurisdiction: "AE-DU",
      incorporationYear: 2015,
      industryCode: "H.52",
      sizeBand: "51-200",
      contactPerson: {
        name: "Omar A.",
        title: "Managing Director",
        email: "omar@example.com",
        phone: "+971500000000",
        consentRecordedAt: "2026-07-01T08:00:00Z",
      },
    },
  },
  "org-demo-2": {
    grantId: "grt_demo_2",
    orgId: "org-demo-2",
    status: "active",
    grantedAt: "2026-06-15T08:00:00Z",
    authorizedFields: ["legal_name", "jurisdiction"],
    profile: { legalName: "Flagged Trading FZE", jurisdiction: "AE-AZ" },
  },
};

const standings: Record<string, Omit<StandingResponse, "orgId">> = {
  "org-demo-1": {
    state: "compliant",
    riskLevel: "low",
    score: 82,
    renewalExpiry: "2027-03-31",
    checkedAt: "2026-07-19T06:00:00Z",
  },
  // High risk — must be hidden by the visibility engine.
  "org-demo-2": {
    state: "compliant",
    riskLevel: "high",
    score: 55,
    renewalExpiry: "2027-01-31",
    checkedAt: "2026-07-19T06:00:00Z",
  },
};

export const mockComplianceClient: ComplianceApiClient = {
  async getPublicationGrant(complianceOrgId) {
    return grants[complianceOrgId] ?? null;
  },
  async getStanding(complianceOrgId) {
    const standing = standings[complianceOrgId];
    return standing ? { orgId: complianceOrgId, ...standing } : null;
  },
  async listUpdatedOrgs() {
    return Object.keys(grants);
  },
};
