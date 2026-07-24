import { describe, expect, it } from "vitest";
import { pilotOrgs } from "./pilot-data";

// This suite is the guard that keeps the mock catalog and the seed script from
// drifting, and that the visibility engine stays exercised end to end.
describe("pilot-data", () => {
  it("has ~12 orgs, all with pilot- ids", () => {
    expect(pilotOrgs.length).toBeGreaterThanOrEqual(12);
    for (const org of pilotOrgs) {
      expect(org.complianceOrgId).toMatch(/^pilot-/);
      expect(org.grant.orgId).toBe(org.complianceOrgId);
    }
  });

  it("has unique compliance ids and slugs", () => {
    const ids = pilotOrgs.map((o) => o.complianceOrgId);
    const slugs = pilotOrgs.map((o) => o.seed.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  // Visibility (compute_org_visibility): grant_active AND state='compliant'
  // AND risk<>'high' AND score>=40 AND future/absent renewal.
  const isVisible = (o: (typeof pilotOrgs)[number]) =>
    o.grant.status === "active" &&
    o.standing.state === "compliant" &&
    o.standing.riskLevel !== "high" &&
    o.standing.score >= 40;

  it("covers all three hidden branches: state, risk, and score", () => {
    expect(pilotOrgs.some((o) => o.standing.state === "non_compliant")).toBe(true);
    expect(pilotOrgs.some((o) => o.standing.state === "compliant" && o.standing.riskLevel === "high")).toBe(true);
    expect(
      pilotOrgs.some((o) => o.standing.state === "compliant" && o.standing.riskLevel !== "high" && o.standing.score < 40),
    ).toBe(true);
  });

  it("has a healthy majority of visible orgs", () => {
    const visible = pilotOrgs.filter(isVisible);
    expect(visible.length).toBeGreaterThanOrEqual(8);
  });

  it("gives every visible org a future or absent renewal expiry", () => {
    const today = new Date().toISOString().slice(0, 10);
    for (const org of pilotOrgs.filter(isVisible)) {
      if (org.standing.renewalExpiry) {
        expect(org.standing.renewalExpiry > today).toBe(true);
      }
    }
  });

  it("schedules all seeded events in the future", () => {
    for (const org of pilotOrgs) {
      for (const event of org.seed.events) {
        expect(event.daysFromNow).toBeGreaterThan(0);
        expect(event.durationHours).toBeGreaterThan(0);
      }
    }
  });
});
