import "server-only";

import { mockComplianceClient } from "./mock";
import type {
  ComplianceApiClient,
  PublicationGrant,
  StandingResponse,
} from "./types";

// Real partner-API client. Selected when COMPLIANCE_API_MODE != "mock".
// Contract: docs/ARCHITECTURE.md §5.2.
class HttpComplianceClient implements ComplianceApiClient {
  constructor(
    private baseUrl: string,
    private apiKey: string,
  ) {}

  private async get<T>(path: string): Promise<T | null> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Compliance API ${path} failed: ${res.status}`);
    }
    return (await res.json()) as T;
  }

  getPublicationGrant(complianceOrgId: string) {
    return this.get<PublicationGrant>(
      `/orgs/${complianceOrgId}/publication-grant`,
    );
  }

  getStanding(complianceOrgId: string) {
    return this.get<StandingResponse>(`/orgs/${complianceOrgId}/standing`);
  }

  async listUpdatedOrgs(updatedSince: string) {
    const page = await this.get<{ org_ids: string[] }>(
      `/orgs?updated_since=${encodeURIComponent(updatedSince)}`,
    );
    return page?.org_ids ?? [];
  }
}

export function getComplianceClient(): ComplianceApiClient {
  if (process.env.COMPLIANCE_API_MODE === "mock") {
    return mockComplianceClient;
  }
  return new HttpComplianceClient(
    process.env.COMPLIANCE_API_BASE_URL!,
    process.env.COMPLIANCE_API_KEY!,
  );
}
