import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config";

// Uptime-monitor endpoint: checks the app AND database reachability.
export async function GET() {
  const startedAt = Date.now();
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { error } = await supabase
    .from("subscription_plans")
    .select("id", { head: true, count: "exact" });

  const dbOk = !error;
  return NextResponse.json(
    {
      status: dbOk ? "ok" : "degraded",
      db: dbOk ? "ok" : error?.message,
      latency_ms: Date.now() - startedAt,
    },
    { status: dbOk ? 200 : 503 },
  );
}
