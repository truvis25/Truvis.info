// Satori-safe Engraved Trust art for OG cards. ImageResponse cannot render
// SVG path guilloche, so these approximate the same visual language with
// gradients and bordered circles — parameterized by the SAME hash as the
// on-site art (lib/brand-art.ts) so an entity's card "rhymes" with its page.
import type { CSSProperties } from "react";
import { fnv1a } from "@/lib/brand-art";

export function ogBase(): CSSProperties {
  return {
    width: "100%",
    height: "100%",
    display: "flex",
    background: "linear-gradient(135deg, #01203f 0%, #023059 55%, #03427a 100%)",
    color: "white",
    fontFamily: "sans-serif",
    position: "relative",
    overflow: "hidden",
  };
}

// Two crossed engraved-line rasters, angle + spacing seeded.
export function ogLattice(seed: string): CSSProperties[] {
  const h = fnv1a(seed);
  const angle = 72 + (h % 16);
  const gap = 14 + (h % 10);
  const line = "rgba(255,255,255,0.05)";
  const base: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  };
  return [
    {
      ...base,
      backgroundImage: `repeating-linear-gradient(${angle}deg, ${line} 0 1px, transparent 1px ${gap}px)`,
    },
    {
      ...base,
      backgroundImage: `repeating-linear-gradient(-${angle}deg, ${line} 0 1px, transparent 1px ${gap + 4}px)`,
    },
  ];
}

// Concentric seal rings anchored right-of-center; outermost ring dashed in
// the entity's accent (emerald or cyan by hash parity).
export function ogSeal(seed: string): CSSProperties[] {
  const h = fnv1a(seed);
  const accent = (h & 1) === 0 ? "rgba(16,185,129,0.5)" : "rgba(6,182,212,0.5)";
  const diameters = [420, 340, 260, 190];
  return diameters.map((d, i) => ({
    position: "absolute",
    right: 40 - d / 3,
    top: 315 - d / 2,
    width: d,
    height: d,
    borderRadius: 9999,
    border: i === 0 ? `2px dashed ${accent}` : "1px solid rgba(255,255,255,0.14)",
  }));
}

export function ogRule(): CSSProperties {
  return {
    height: 1,
    width: "100%",
    backgroundImage:
      "repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0 6px, transparent 6px 10px)",
  };
}
