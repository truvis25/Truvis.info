import { eventKind, type EventKind } from "../lib/events";

// Original poster artwork for each event format, drawn from the same courtyard
// vocabulary as the hero: an arched doorway, eight-point rosettes and a
// turquoise water threshold. No photography, so nothing is implied about the
// venue or the people attending.
const star = (cx: number, cy: number, r: number) => {
  const points: string[] = [];
  for (let i = 0; i < 16; i++) {
    const radius = i % 2 ? r * 0.62 : r;
    const angle = (Math.PI / 8) * i - Math.PI / 2;
    points.push(
      (cx + radius * Math.cos(angle)).toFixed(1) +
        "," +
        (cy + radius * Math.sin(angle)).toFixed(1),
    );
  }
  return points.join(" ");
};

function Motif({ kind }: { kind: EventKind }) {
  if (kind === "breakfast")
    return (
      <g>
        <circle cx="200" cy="236" r="78" fill="#43c6c5" />
        <path
          d="M118 300h164v18c0 52-37 86-82 86s-82-34-82-86z"
          fill="#f5f7f2"
        />
        <path
          d="M282 322c34 0 40 46 0 50"
          fill="none"
          stroke="#f5f7f2"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <g
          fill="none"
          stroke="#c7d9cb"
          strokeWidth="7"
          strokeLinecap="round"
          className="art-steam"
        >
          <path d="M168 282c-14-18 14-30 0-50" />
          <path d="M200 282c-14-18 14-30 0-50" />
          <path d="M232 282c-14-18 14-30 0-50" />
        </g>
      </g>
    );
  if (kind === "conversation")
    return (
      <g fill="none" strokeWidth="14">
        <path
          d="M108 400V262a62 62 0 0 1 124 0v138"
          stroke="#f5f7f2"
        />
        <path
          d="M168 400V232a62 62 0 0 1 124 0v168"
          stroke="#43c6c5"
        />
        <circle cx="170" cy="184" r="9" fill="#c7d9cb" stroke="none" />
        <circle cx="200" cy="168" r="9" fill="#c7d9cb" stroke="none" />
        <circle cx="230" cy="184" r="9" fill="#c7d9cb" stroke="none" />
      </g>
    );
  if (kind === "sport")
    return (
      <g>
        <path
          d="M80 400l60-150h120l60 150"
          fill="none"
          stroke="#c7d9cb"
          strokeWidth="6"
        />
        <path d="M110 326h180" stroke="#f5f7f2" strokeWidth="10" />
        <path
          d="M200 250v150"
          stroke="#c7d9cb"
          strokeWidth="4"
          strokeDasharray="10 9"
        />
        <circle cx="262" cy="208" r="44" fill="#43c6c5" />
        <path
          d="M226 184c26 4 48 30 46 64M300 232c-26-4-48-30-46-64"
          fill="none"
          stroke="#07362d"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>
    );
  return (
    <g>
      <polygon points={star(200, 290, 108)} fill="#43c6c5" />
      <polygon points={star(200, 290, 62)} fill="#07362d" />
      <polygon points={star(200, 290, 30)} fill="#f5f7f2" />
    </g>
  );
}

export function EventArt({
  format,
  className = "",
}: {
  format: string;
  className?: string;
}) {
  const kind = eventKind(format);
  const id = "lattice-" + kind;
  return (
    <svg
      className={"event-art art-" + kind + (className ? " " + className : "")}
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id={id} width="56" height="56" patternUnits="userSpaceOnUse">
          <polygon points={star(28, 28, 9)} fill="#155344" />
        </pattern>
      </defs>
      <rect width="400" height="500" fill="#07362d" />
      <rect width="400" height="500" fill={`url(#${id})`} />
      <path
        d="M40 500V200a160 160 0 0 1 320 0v300z"
        fill="#0b4337"
        stroke="#1d5a4b"
        strokeWidth="4"
      />
      <Motif kind={kind} />
      <rect y="416" width="400" height="84" fill="#43c6c5" />
      <g fill="none" stroke="#07362d" strokeWidth="5" strokeLinecap="round" opacity="0.35">
        <path d="M30 448c30-12 60 12 90 0s60 12 90 0 60 12 90 0 60 12 90 0" />
        <path d="M0 474c30-12 60 12 90 0s60 12 90 0 60 12 90 0 60 12 90 0" />
      </g>
    </svg>
  );
}
