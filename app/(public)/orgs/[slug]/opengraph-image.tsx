import { ImageResponse } from "next/og";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config";
import { ogBase, ogLattice, ogSeal, ogRule } from "@/lib/og-art";

export const runtime = "edge";
export const alt = "Verified organization on Truvis.info";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Per-org social card: engraved seal seeded from the org slug, matching the
// on-site guilloche fingerprint. Public data only (RLS-scoped anon REST).
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let legalName = "Verified organization";
  let tagline: string | null = null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/organizations?slug=eq.${encodeURIComponent(slug)}&select=legal_name,tagline`,
      { headers: { apikey: SUPABASE_ANON_KEY } },
    );
    const rows = (await res.json()) as Array<{
      legal_name: string;
      tagline: string | null;
    }>;
    if (rows[0]) {
      legalName = rows[0].legal_name;
      tagline = rows[0].tagline;
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
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 40, background: "#10b981", borderRadius: 3 }} />
            <div style={{ display: "flex", fontSize: 30, fontWeight: 800, letterSpacing: 3 }}>
              TRUVIS<span style={{ color: "#10b981" }}>.info</span>
            </div>
          </div>
          <div
            style={{
              marginTop: 36,
              fontSize: 56,
              fontWeight: 800,
              maxWidth: 760,
              lineHeight: 1.15,
            }}
          >
            {legalName}
          </div>
          {tagline ? (
            <div
              style={{
                marginTop: 18,
                fontSize: 26,
                color: "rgba(255,255,255,0.72)",
                maxWidth: 720,
              }}
            >
              {tagline.slice(0, 120)}
            </div>
          ) : null}
          <div
            style={{
              marginTop: 32,
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              border: "1px solid #10b981",
              borderRadius: 9999,
              padding: "10px 24px",
              fontSize: 22,
              color: "#10b981",
              letterSpacing: 3,
            }}
          >
            ✓ VERIFIED ORGANIZATION
          </div>
          <div style={{ marginTop: 48, display: "flex", flexDirection: "column", maxWidth: 720 }}>
            <div style={ogRule()} />
            <div style={{ marginTop: 16, fontSize: 20, color: "rgba(255,255,255,0.6)" }}>
              {`truvis.info/orgs/${slug}`}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
