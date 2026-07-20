import { describe, expect, it } from "vitest";
import {
  BRAND_ART_VERSION,
  deriveParams,
  fnv1a,
  latticePaths,
  rosettePaths,
  sunburstLines,
} from "./brand-art";

// The seed contract is FROZEN: a failing snapshot here means every org's
// visual identity silently changed. Bump BRAND_ART_VERSION and refresh the
// snapshots only as a deliberate, release-noted decision.
describe(`brand-art seed contract v${BRAND_ART_VERSION}`, () => {
  const SEEDS = ["truvis-hero", "demo-org", "empty-events"];

  it("fnv1a is stable", () => {
    expect(SEEDS.map(fnv1a)).toMatchSnapshot();
  });

  it("deriveParams is frozen per seed", () => {
    for (const seed of SEEDS) {
      expect(deriveParams(seed)).toMatchSnapshot(seed);
    }
  });

  it("lattice + rosette + sunburst geometry is byte-identical", () => {
    const p = deriveParams("demo-org");
    expect(latticePaths(p, 360, 80, 48)).toMatchSnapshot("lattice-card");
    expect(rosettePaths(p, 32, 32, 26, 3, 96)).toMatchSnapshot("rosette-medallion");
    expect(sunburstLines(p, 560, 144, 140, 260)).toMatchSnapshot("sunburst");
  });

  it("element budgets hold", () => {
    for (const seed of SEEDS) {
      const p = deriveParams(seed);
      // card lattice: strands 5–7 → ≤ 8 paths
      expect(latticePaths(p, 360, 80, 48).length).toBeLessThanOrEqual(8);
      // horizon: ≤ 9 strands
      expect(latticePaths(p, 1440, 220, 120).length).toBeLessThanOrEqual(9);
      // hero rosette: 5 rings max
      expect(rosettePaths(p, 360, 360, 300, 5).length).toBeLessThanOrEqual(5);
      // event: 4 rosette rings + 24 rays = 28
      expect(
        rosettePaths(p, 560, 144, 120, 4).length +
          sunburstLines(p, 560, 144, 140, 260).length,
      ).toBeLessThanOrEqual(28);
      // params stay in contract ranges
      expect(p.strands).toBeGreaterThanOrEqual(5);
      expect(p.strands).toBeLessThanOrEqual(7);
      expect([8, 10, 12, 14]).toContain(p.rosetteK);
      expect(p.emeraldIdx).not.toBe(p.cyanIdx);
    }
  });
});
