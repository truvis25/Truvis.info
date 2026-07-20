// TRUVIS "Engraved Trust" generative art — pure math, zero deps, edge-safe.
//
// Every organization/event gets a deterministic guilloche "engraving plate"
// seeded from its slug. The seed contract below is FROZEN: same seed must
// produce byte-identical SVG forever (enforced by lib/brand-art.test.ts).
// Bump BRAND_ART_VERSION only as a deliberate, release-noted visual migration.

export const BRAND_ART_VERSION = 1;

export function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type ArtParams = {
  strands: number; // 5–7
  f1: number; // int 2–4
  f2: number; // int 5–8
  phase: number; // 0–2π (primary fingerprint)
  amp: number; // 0.28–0.42 of band height
  skewDeg: number; // −6…+6
  rosetteK: 8 | 10 | 12 | 14; // even petal counts only
  rosetteRings: number; // 3–5
  emeraldIdx: number; // which lattice strand is emerald
  cyanIdx: number; // which lattice strand is cyan (≠ emeraldIdx)
};

// Draw order below is part of the frozen contract — do not reorder.
export function deriveParams(seed: string): ArtParams {
  const rand = mulberry32(fnv1a(seed));
  const strands = 5 + Math.floor(rand() * 3);
  const f1 = 2 + Math.floor(rand() * 3);
  const f2 = 5 + Math.floor(rand() * 4);
  const phase = rand() * Math.PI * 2;
  const amp = 0.28 + rand() * 0.14;
  const skewDeg = rand() * 12 - 6;
  const rosetteK = ([8, 10, 12, 14] as const)[Math.floor(rand() * 4)];
  const rosetteRings = 3 + Math.floor(rand() * 3);
  const emeraldIdx = Math.floor(rand() * strands);
  let cyanIdx = Math.floor(rand() * strands);
  if (cyanIdx === emeraldIdx) cyanIdx = (cyanIdx + 1) % strands;
  return {
    strands,
    f1,
    f2,
    phase,
    amp,
    skewDeg,
    rosetteK,
    rosetteRings,
    emeraldIdx,
    cyanIdx,
  };
}

function r1(v: number): number {
  return Math.round(v * 10) / 10;
}

// One "M…L…" polyline per strand:
// y(x) = h/2 + amp·h·sin(f1·t + phase + i·π/strands) · cos(f2·t + phase/2)
export function latticePaths(
  p: ArtParams,
  w: number,
  h: number,
  samples: number,
): string[] {
  const paths: string[] = [];
  for (let i = 0; i < p.strands; i++) {
    const pts: string[] = [];
    for (let s = 0; s <= samples; s++) {
      const t = (s / samples) * Math.PI * 2;
      const x = (s / samples) * w;
      const y =
        h / 2 +
        p.amp *
          h *
          Math.sin(p.f1 * t + p.phase + (i * Math.PI) / p.strands) *
          Math.cos(p.f2 * t + p.phase / 2);
      pts.push(`${r1(x)},${r1(y)}`);
    }
    paths.push(`M${pts[0]}L${pts.slice(1).join(" ")}`);
  }
  return paths;
}

// Closed rosette rings: r(θ) = R·mult·(0.72 + 0.28·sin(rosetteK·θ ± phase)),
// ring radii R × [1, 0.82, 0.66, 0.52, 0.4], alternating phase sign per ring.
const RING_MULTIPLIERS = [1, 0.82, 0.66, 0.52, 0.4];

export function rosettePaths(
  p: ArtParams,
  cx: number,
  cy: number,
  R: number,
  rings: number,
  samples = 144,
): string[] {
  const paths: string[] = [];
  for (let j = 0; j < Math.min(rings, RING_MULTIPLIERS.length); j++) {
    const sign = j % 2 === 0 ? 1 : -1;
    const mult = RING_MULTIPLIERS[j];
    const pts: string[] = [];
    for (let s = 0; s < samples; s++) {
      const theta = (s / samples) * Math.PI * 2;
      const r =
        R * mult * (0.72 + 0.28 * Math.sin(p.rosetteK * theta + sign * p.phase));
      pts.push(`${r1(cx + r * Math.cos(theta))},${r1(cy + r * Math.sin(theta))}`);
    }
    paths.push(`M${pts[0]}L${pts.slice(1).join(" ")}Z`);
  }
  return paths;
}

// 24 rays every 15°, start angle rotated by phase.
export function sunburstLines(
  p: ArtParams,
  cx: number,
  cy: number,
  r0: number,
  r1v: number,
): Array<[number, number, number, number]> {
  const lines: Array<[number, number, number, number]> = [];
  for (let k = 0; k < 24; k++) {
    const angle = p.phase + (k * Math.PI) / 12;
    lines.push([
      r1(cx + r0 * Math.cos(angle)),
      r1(cy + r0 * Math.sin(angle)),
      r1(cx + r1v * Math.cos(angle)),
      r1(cy + r1v * Math.sin(angle)),
    ]);
  }
  return lines;
}
