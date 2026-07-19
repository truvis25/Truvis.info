import type { ComplianceStanding } from "@/types/domain";

// Single source of truth for the visibility rule (PRD CMP-3, BRD BR-3/BR-5).
// Mirrors compute_org_visibility() in supabase/migrations/0001_initial_schema.sql —
// keep the two in sync when tuning thresholds.

const SCORE_THRESHOLD = Number(process.env.COMPLIANCE_SCORE_THRESHOLD ?? 40);
const STALE_HOURS = Number(process.env.COMPLIANCE_STALE_HOURS ?? 72);

export interface VisibilityInputs {
  grantActive: boolean;
  adminSuspended: boolean;
  standing: ComplianceStanding | null;
}

export function computeVisibility(
  { grantActive, adminSuspended, standing }: VisibilityInputs,
  now: Date = new Date(),
): boolean {
  if (!grantActive || adminSuspended || !standing) return false;
  if (standing.state !== "compliant") return false;
  if (standing.riskLevel === "high") return false;
  if (standing.score < SCORE_THRESHOLD) return false;
  if (standing.renewalExpiry && new Date(standing.renewalExpiry) <= now) {
    return false;
  }
  const staleBefore = now.getTime() - STALE_HOURS * 60 * 60 * 1000;
  if (new Date(standing.syncedAt).getTime() <= staleBefore) return false;
  return true;
}
