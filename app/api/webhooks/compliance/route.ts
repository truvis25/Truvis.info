import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/compliance/hmac";

// Inbound webhooks from compliance.truvis.tech (docs/ARCHITECTURE.md §5.3).
// Events: grant.activated | grant.updated | grant.revoked | standing.changed
export async function POST(request: NextRequest) {
  const secret = process.env.COMPLIANCE_WEBHOOK_SECRET;
  if (!secret || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "webhook not configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("x-truvis-signature");
  if (!verifyWebhookSignature(signature, body, secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const eventId = request.headers.get("x-truvis-event-id");
  if (!eventId) {
    return NextResponse.json({ error: "missing event id" }, { status: 400 });
  }

  const event = JSON.parse(body) as { type: string; data: Record<string, unknown> };
  const supabase = createAdminClient();

  // Idempotency: first insert wins; replays are acknowledged without effect.
  const { error: dupe } = await supabase
    .from("webhook_events")
    .insert({ event_id: eventId, event_type: event.type, payload: event });
  if (dupe?.code === "23505") {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  if (dupe) {
    return NextResponse.json({ error: dupe.message }, { status: 500 });
  }

  switch (event.type) {
    case "standing.changed": {
      const standing = event.data;
      const { error } = await supabase.rpc("ingest_standing", {
        p_compliance_org_id: String(standing.orgId ?? standing.org_id ?? ""),
        p_standing: standing,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      break;
    }
    case "grant.updated":
    case "grant.activated": {
      const grant = event.data as {
        orgId?: string;
        org_id?: string;
        profile?: Record<string, unknown>;
      };
      const complianceOrgId = String(grant.orgId ?? grant.org_id ?? "");
      const profile = grant.profile ?? {};
      const { error } = await supabase
        .from("organizations")
        .update({
          grant_active: true,
          legal_name: profile.legalName ?? undefined,
          trade_license_no: profile.tradeLicenseNo ?? null,
          jurisdiction: profile.jurisdiction ?? null,
          incorporation_year: profile.incorporationYear ?? null,
          industry_code: profile.industryCode ?? null,
          size_band: profile.sizeBand ?? null,
          contact_person: profile.contactPerson ?? null,
        })
        .eq("compliance_org_id", complianceOrgId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      break;
    }
    case "grant.revoked": {
      const complianceOrgId = String(event.data.orgId ?? event.data.org_id ?? "");
      const { error } = await supabase
        .from("organizations")
        .update({ grant_active: false })
        .eq("compliance_org_id", complianceOrgId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      break;
    }
    default:
      // Unknown event types are acknowledged so the sender does not retry forever.
      break;
  }

  return NextResponse.json({ ok: true });
}
