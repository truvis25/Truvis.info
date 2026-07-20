import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getLumaClient } from "./client";
import type { LumaEventInput } from "./types";

type SyncableEvent = {
  id: string;
  title: string;
  description: string | null;
  venue_address: string | null;
  online_url: string | null;
  starts_at: string;
  ends_at: string;
  timezone: string | null;
  status: string;
  external_source: string | null;
  luma_publish: boolean;
  luma_event_id: string | null;
};

function toLumaInput(row: SyncableEvent): LumaEventInput {
  return {
    name: row.title,
    description: row.description,
    startAt: row.starts_at,
    endAt: row.ends_at,
    timezone: row.timezone ?? "Asia/Dubai",
    address: row.venue_address,
    meetingUrl: row.online_url,
  };
}

// Push an org event to the central Truvis Luma calendar. Non-blocking by
// construction: callers invoke this AFTER their own DB write succeeds, and
// any Luma failure only marks luma_sync_status='failed' on the row — the
// event is always published locally regardless. RLS: the caller's own
// client updates the luma_* columns via the "org manages events" policy.
export async function syncEventToLuma(
  supabase: SupabaseClient,
  eventId: string,
): Promise<void> {
  const { data } = await supabase
    .from("events")
    .select(
      "id, title, description, venue_address, online_url, starts_at, ends_at, timezone, status, external_source, luma_publish, luma_event_id",
    )
    .eq("id", eventId)
    .maybeSingle();
  const row = data as SyncableEvent | null;
  if (!row || row.external_source !== null) return;

  const wantsLive = row.status === "published" && row.luma_publish;
  if (!wantsLive && !row.luma_event_id) return;

  const client = getLumaClient();
  try {
    if (!wantsLive && row.luma_event_id) {
      // Unpublished/cancelled locally (or opt-out): Luma's public API has no
      // confirmed delete — best-effort rename so the Luma listing is clearly
      // dead. luma_event_id is kept for audit and loop-guarding.
      await client.updateEvent(row.luma_event_id, {
        name: `[Cancelled] ${row.title}`,
        description: `This event has been cancelled.\n\n${row.description ?? ""}`.trim(),
      });
      await supabase
        .from("events")
        .update({
          luma_synced_at: new Date().toISOString(),
          luma_sync_status: "synced",
          luma_sync_error: null,
        })
        .eq("id", row.id);
      return;
    }

    const result = row.luma_event_id
      ? await client.updateEvent(row.luma_event_id, toLumaInput(row))
      : await client.createEvent(toLumaInput(row));

    await supabase
      .from("events")
      .update({
        luma_event_id: result.apiId,
        luma_event_url: result.url,
        luma_synced_at: new Date().toISOString(),
        luma_sync_status: "synced",
        luma_sync_error: null,
      })
      .eq("id", row.id);
  } catch (err) {
    await supabase
      .from("events")
      .update({
        luma_sync_status: "failed",
        luma_sync_error: err instanceof Error ? err.message.slice(0, 500) : "Unknown error",
      })
      .eq("id", row.id);
  }
}
