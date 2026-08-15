import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLumaLiveConfigured } from "@/lib/luma/client";
import { pullLumaCalendar } from "@/lib/luma/incoming";

// Webhooks provide near-real-time updates. This daily authenticated sweep is
// the repair path for missed deliveries and calendar-side deletions.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "cron authentication is not configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase service role is not configured" }, { status: 503 });
  }
  if (!isLumaLiveConfigured()) {
    return NextResponse.json({ error: "Luma integration is not configured" }, { status: 503 });
  }

  const result = await pullLumaCalendar(createAdminClient());
  revalidatePath("/events");
  revalidatePath("/");

  return NextResponse.json({
    ok: result.errors.length === 0 && result.completedPagination,
    ...result,
  });
}
