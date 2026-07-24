import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLumaClient } from "@/lib/luma/client";
import { notifyEventCancelled } from "@/lib/email/notifications";
import type { LumaEvent } from "@/lib/luma/types";

// Pull sweep: mirror events from the central Truvis Luma calendar into the
// events table as community events (org_id null, external_source='luma').
// Scheduled via vercel.json — this uses the SECOND (and last) Vercel Hobby
// cron slot; if a third cron is ever needed before a Pro upgrade, fold this
// into compliance-poll as a second step (tradeoff: shared failure domain).
export const maxDuration = 60;

const CHUNK = 100;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "cron not configured" }, { status: 503 });
  }

  const supabase = createAdminClient();
  const luma = getLumaClient();

  // Page through the calendar. A completed pass is required before the
  // cancellation reconciliation below may run.
  const listed: LumaEvent[] = [];
  let cursor: string | null = null;
  let completedPagination = true;
  try {
    do {
      const page = await luma.listCalendarEvents(cursor ? { cursor } : undefined);
      listed.push(...page.events);
      cursor = page.nextCursor;
    } while (cursor);
  } catch (err) {
    completedPagination = false;
    if (listed.length === 0) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : "Luma list failed" },
        { status: 502 },
      );
    }
  }

  // Which api_ids already exist locally (both pushed org events and
  // previously pulled community events)?
  const knownPushed = new Set<string>();
  const apiIds = listed.map((event) => event.apiId);
  for (let i = 0; i < apiIds.length; i += CHUNK) {
    const { data } = await supabase
      .from("events")
      .select("luma_event_id, external_source")
      .in("luma_event_id", apiIds.slice(i, i + CHUNK));
    for (const row of data ?? []) {
      // Rows WE pushed (external_source null) — Luma is not their source of
      // truth; skipping them is the duplicate/loop guard.
      if (row.external_source === null && row.luma_event_id) {
        knownPushed.add(row.luma_event_id);
      }
    }
  }

  const nowIso = new Date().toISOString();
  let upserted = 0;
  let skippedPushed = 0;
  const errors: string[] = [];

  for (const event of listed) {
    if (knownPushed.has(event.apiId)) {
      skippedPushed += 1;
      continue;
    }
    const startsAt = event.startAt;
    const endsAt =
      event.endAt ??
      new Date(new Date(event.startAt).getTime() + 2 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("events").upsert(
      {
        org_id: null,
        external_source: "luma",
        luma_event_id: event.apiId,
        luma_event_url: event.url,
        slug: `luma-${event.apiId.toLowerCase()}`,
        title: event.name,
        description: event.description,
        starts_at: startsAt,
        ends_at: endsAt,
        timezone: event.timezone ?? "Asia/Dubai",
        venue_address: event.address,
        online_url: event.meetingUrl,
        status: "published",
        approval_mode: "auto", // inert — the registration guard blocks Luma events
        luma_synced_at: nowIso,
        luma_sync_status: "synced",
        updated_at: nowIso,
      },
      { onConflict: "luma_event_id" },
    );
    if (error) errors.push(`${event.apiId}: ${error.message}`);
    else upserted += 1;
  }

  // Reconciliation: previously pulled upcoming events that vanished from the
  // calendar were deleted/unlisted on Luma → cancel locally. Only after a
  // clean, complete pagination pass.
  let cancelled = 0;
  if (completedPagination) {
    const { data: stale } = await supabase
      .from("events")
      .select("id, luma_event_id, title")
      .eq("external_source", "luma")
      .eq("status", "published")
      .gt("starts_at", nowIso);
    const listedIds = new Set(apiIds);
    for (const row of stale ?? []) {
      if (row.luma_event_id && !listedIds.has(row.luma_event_id)) {
        const { error } = await supabase
          .from("events")
          .update({ status: "cancelled", updated_at: nowIso })
          .eq("id", row.id);
        if (!error) {
          cancelled += 1;
          // Keep the "cancellation always notifies" invariant. Near-no-op for
          // Luma events (registrations are blocked on external events), but
          // correct if any local registrations ever exist.
          await notifyEventCancelled({ eventId: row.id, eventTitle: row.title });
        }
      }
    }
  }

  revalidatePath("/events");

  return NextResponse.json({
    ok: errors.length === 0,
    listed: listed.length,
    upserted,
    skippedPushed,
    cancelled,
    completedPagination,
    errors: errors.slice(0, 10),
  });
}
