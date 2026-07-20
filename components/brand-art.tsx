import { cache } from "react";
import { cn } from "@/lib/utils";
import {
  deriveParams,
  fnv1a,
  latticePaths,
  rosettePaths,
  sunburstLines,
  type ArtParams,
} from "@/lib/brand-art";

// Server-rendered guilloche art. Decorative only: always aria-hidden, never
// interactive, colors come exclusively from the --art-* CSS variables (scoped
// by .art-on-petroleum on brand surfaces, themed via :root/.dark elsewhere).
// Text legibility is guaranteed structurally by the built-in luminance masks.

type Variant = "card" | "hero" | "horizon" | "event" | "medallion" | "empty";

const VIEWBOX: Record<Variant, string> = {
  card: "0 0 360 80",
  hero: "0 0 720 720",
  horizon: "0 0 1440 220",
  event: "0 0 768 288",
  medallion: "0 0 64 64",
  empty: "0 0 480 320",
};

const params = cache((seed: string): ArtParams => deriveParams(seed));

const ACCENT_VAR = {
  emerald: "var(--art-emerald)",
  cyan: "var(--art-cyan)",
  line: "var(--art-line)",
} as const;

export function BrandArt({
  seed,
  variant,
  rings = 3,
  accent = "line",
  className,
}: {
  seed: string;
  variant: Variant;
  rings?: 1 | 2 | 3;
  accent?: keyof typeof ACCENT_VAR;
  className?: string;
}) {
  const p = params(seed);
  const uid = fnv1a(seed + variant).toString(36);
  const maskId = `m-${uid}`;
  const gradId = `g-${uid}`;

  let defs: React.ReactNode = null;
  let body: React.ReactNode = null;

  if (variant === "card" || variant === "horizon") {
    const w = variant === "card" ? 360 : 1440;
    const h = variant === "card" ? 80 : 220;
    const samples = variant === "card" ? 48 : 120;
    const paths = latticePaths(p, w, h, samples);
    defs = (
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#404040" />
          <stop offset="0.33" stopColor="#404040" />
          <stop offset="0.66" stopColor="#ffffff" />
        </linearGradient>
        <mask id={maskId}>
          <rect width="100%" height="100%" fill={`url(#${gradId})`} />
        </mask>
      </defs>
    );
    body = (
      <g
        mask={`url(#${maskId})`}
        transform={
          variant === "card"
            ? `rotate(${Math.round(p.skewDeg * 10) / 10} 180 40)`
            : undefined
        }
      >
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            stroke={
              i === p.emeraldIdx
                ? "var(--art-emerald)"
                : i === p.cyanIdx
                  ? "var(--art-cyan)"
                  : "var(--art-line)"
            }
            strokeWidth={i === p.emeraldIdx || i === p.cyanIdx ? 0.9 : 0.6}
          />
        ))}
      </g>
    );
  } else if (variant === "hero") {
    const heroParams: ArtParams = { ...p, rosetteK: 12 };
    const paths = rosettePaths(heroParams, 360, 360, 300, 5);
    defs = (
      <defs>
        <radialGradient id={gradId}>
          <stop offset="0.55" stopColor="#ffffff" />
          <stop offset="1" stopColor="#000000" />
        </radialGradient>
        <mask id={maskId}>
          <rect width="100%" height="100%" fill={`url(#${gradId})`} />
        </mask>
      </defs>
    );
    body = (
      <g mask={`url(#${maskId})`}>
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            stroke={i === 0 ? "var(--art-line-strong)" : "var(--art-line)"}
            strokeWidth={i === 0 ? 1.1 : 0.6}
          />
        ))}
      </g>
    );
  } else if (variant === "event") {
    const cx = 560;
    const cy = 144;
    const paths = rosettePaths(p, cx, cy, 120, 4);
    const rays = sunburstLines(p, cx, cy, 140, 260);
    defs = (
      <defs>
        <radialGradient id={gradId} cx="0.73" cy="0.5" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#ffffff" />
          <stop offset="1" stopColor="#202020" />
        </radialGradient>
        <mask id={maskId}>
          <rect width="100%" height="100%" fill={`url(#${gradId})`} />
        </mask>
      </defs>
    );
    body = (
      <g mask={`url(#${maskId})`}>
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            stroke={
              i === 0
                ? "var(--art-line-strong)"
                : i === 1
                  ? "var(--art-emerald)"
                  : "var(--art-line)"
            }
            strokeWidth={i === 0 ? 1.1 : 0.6}
          />
        ))}
        {rays.map(([x1, y1, x2, y2], i) => (
          <line
            key={`r${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--art-line)"
            strokeWidth={0.6}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
    );
  } else if (variant === "medallion") {
    const paths = rosettePaths(p, 32, 32, 26, rings, 96);
    body = (
      <g>
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            stroke={i === 1 ? ACCENT_VAR[accent] : "var(--art-line-strong)"}
            strokeWidth={0.8}
          />
        ))}
      </g>
    );
  } else {
    // empty
    const paths = rosettePaths(p, 240, 160, 130, 2);
    defs = (
      <defs>
        <radialGradient id={gradId}>
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#000000" />
        </radialGradient>
        <mask id={maskId}>
          <rect width="100%" height="100%" fill={`url(#${gradId})`} />
        </mask>
      </defs>
    );
    body = (
      <g mask={`url(#${maskId})`}>
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            stroke={i === 0 ? "var(--art-line-strong)" : "var(--art-line)"}
            strokeWidth={i === 0 ? 1.1 : 0.8}
          />
        ))}
      </g>
    );
  }

  return (
    <svg
      viewBox={VIEWBOX[variant]}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        className,
      )}
    >
      {defs}
      {body}
    </svg>
  );
}
