// Types for the compliance.truvis.tech partner API contract.
// Contract spec: docs/ARCHITECTURE.md §5 — keep this file in lockstep with it.

export interface PublicationGrant {
  grantId: string;
  orgId: string; // compliance org id
  status: "active" | "revoked";
  grantedAt: string;
  authorizedFields: string[];
  profile: {
    legalName?: string;
    tradeLicenseNo?: string;
    jurisdiction?: string;
    incorporationYear?: number;
    industryCode?: string;
    sizeBand?: string;
    contactPerson?: {
      name: string;
      title: string;
      email: string;
      phone: string;
      consentRecordedAt: string;
    };
  };
}

export interface StandingResponse {
  orgId: string;
  state: "compliant" | "non_compliant" | "under_review" | "lapsed";
  riskLevel: "low" | "medium" | "high";
  score: number;
  renewalExpiry: string | null;
  checkedAt: string;
}

export interface ComplianceApiClient {
  getPublicationGrant(complianceOrgId: string): Promise<PublicationGrant | null>;
  getStanding(complianceOrgId: string): Promise<StandingResponse | null>;
  listUpdatedOrgs(updatedSince: string): Promise<string[]>;
}
