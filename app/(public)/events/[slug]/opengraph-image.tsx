import { ImageResponse } from "next/og";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config";
import { ogBase, ogLattice, ogSeal, ogRule } from "@/lib/og-art";

export const runtime = "edge";
export const alt = "Event on Truvis.info";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

// Per-event social card: date medallion + engraved seal seeded from the
// event slug. Always generative (remote banners are fragile in satori and
// blocked by CSP for Luma-hosted covers).
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let title = "Business event";
  let hostLine = "Truvis community calendar";
  let day = "";
  let month = "";
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/events?slug=eq.${encodeURIComponent(slug)}&select=title,starts_at,organizations(legal_name)`,
      { headers: { apikey: SUPABASE_ANON_KEY } },
    );
    const rows = (await res.json()) as Array<{
      title: string;
      starts_at: string;
      organizations: { legal_name: string } | null;
    }>;
    if (rows[0]) {
      title = rows[0].title;
      if (rows[0].organizations?.legal_name) {
        hostLine = `by ${rows[0].organizations.legal_name} · VERIFIED`;
      }
      const starts = new Date(rows[0].starts_at);
      day = String(starts.getUTCDate());
      month = MONTHS[starts.getUTCMonth()] ?? "";
    }
  } catch {
    // fall through to the generic card
  }

  return new ImageResponse(
    (
      <div style={ogBase()}>
        {ogLattice(slug).map((style, i) => (
          <div key={`l${i}`} style={style} />
        ))}
        {ogSeal(slug).map((style, i) => (
          <div key={`s${i}`} style={style} />
        ))}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "80px",
            width: "100%",
            height: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div
              style={{
                width: 160,
                height: 160,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(160deg, #023059, #01203f)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 24,
              }}
            >
              <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1 }}>{day}</div>
              <div style={{ marginTop: 6, fontSize: 24, fontWeight: 600, color: "#10b981", letterSpacing: 4 }}>
                {month}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 26, fontWeight: 800, letterSpacing: 3 }}>
                TRUVIS<span style={{ color: "#10b981" }}>.info</span>&nbsp;EVENTS
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: 40,
              fontSize: 48,
              fontWeight: 800,
              maxWidth: 780,
              lineHeight: 1.15,
            }}
          >
            {title.slice(0, 90)}
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: 24,
              color: "#10b981",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {hostLine}
          </div>
          <div style={{ marginTop: 44, display: "flex", flexDirection: "column", maxWidth: 720 }}>
            <div style={ogRule()} />
            <div style={{ marginTop: 16, fontSize: 20, color: "rgba(255,255,255,0.6)" }}>
              {`truvis.info/events/${slug}`}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
