import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getComplianceClient } from "@/lib/compliance/client";

// Polling fallback + staleness sweep (docs/ARCHITECTURE.md §5.4, BR-5).
// Scheduled via vercel.json crons — daily on the Hobby plan (its cron limit);
// tighten to */30 with a 1h window on Pro. Webhooks remain the primary path.
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "cron not configured" }, { status: 503 });
  }

  const supabase = createAdminClient();
  const compliance = getComplianceClient();

  const since = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
  const orgIds = await compliance.listUpdatedOrgs(since);

  let refreshed = 0;
  for (const complianceOrgId of orgIds) {
    const standing = await compliance.getStanding(complianceOrgId);
    if (!standing) continue;
    const { error } = await supabase.rpc("ingest_standing", {
      p_compliance_org_id: complianceOrgId,
      p_standing: standing,
    });
    if (!error) refreshed += 1;
  }

  // Staleness fail-safe: hide orgs whose sync went quiet (BR-5).
  const { error: sweepError } = await supabase.rpc("recompute_all_visibility");

  return NextResponse.json({
    ok: !sweepError,
    polled: orgIds.length,
    refreshed,
    sweep: sweepError?.message ?? "done",
  });
}
