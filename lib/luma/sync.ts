import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getLumaClient } from "./client";
import type { LumaEventInput } from "./types";
import { makeLumaSlug } from "./identity";
import { SITE_URL } from "@/lib/config";

type SyncableEvent = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  venue_address: string | null;
  starts_at: string;
  ends_at: string;
  timezone: string | null;
  status: string;
  external_source: string | null;
  luma_publish: boolean;
  luma_event_id: string | null;
  luma_slug: string | null;
};

function toLumaInput(row: SyncableEvent, lumaSlug: string): LumaEventInput {
  const registerUrl = `${SITE_URL}/events/${row.slug}`;
  const description = [
    row.description,
    `View details and register on Truvis: ${registerUrl}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  return {
    name: row.title,
    description,
    startAt: row.starts_at,
    endAt: row.ends_at,
    timezone: row.timezone ?? "Asia/Dubai",
    address: row.venue_address,
    // Registration and any protected online link stay on Truvis. Luma is the
    // distribution listing, not a second attendee database.
    slug: lumaSlug,
    visibility: "public",
    registrationOpen: false,
    suppressNotifications: true,
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
      "id, slug, title, description, venue_address, starts_at, ends_at, timezone, status, external_source, luma_publish, luma_event_id, luma_slug",
    )
    .eq("id", eventId)
    .maybeSingle();
  const row = data as SyncableEvent | null;
  if (!row || row.external_source !== null) return;

  const wantsLive = row.status === "published" && row.luma_publish;
  if (!wantsLive && !row.luma_event_id) return;

  try {
    const client = getLumaClient();
    if (!wantsLive && row.luma_event_id) {
      // Full Luma cancellation is irreversible and may refund/notify guests,
      // so a local status change safely closes and labels the distribution
      // listing without invoking that destructive endpoint.
      await client.updateEvent(row.luma_event_id, {
        name: row.title.startsWith("[Cancelled]") ? row.title : `[Cancelled] ${row.title}`,
        description: `This event has been cancelled.\n\n${row.description ?? ""}`.trim(),
        registrationOpen: false,
        suppressNotifications: true,
      });
      const { error } = await supabase
        .from("events")
        .update({
          luma_synced_at: new Date().toISOString(),
          luma_sync_status: "synced",
          luma_sync_error: null,
        })
        .eq("id", row.id);
      if (error) throw error;
      return;
    }

    const lumaSlug = row.luma_slug ?? makeLumaSlug(row.slug, row.id);
    if (!row.luma_slug) {
      const { error } = await supabase
        .from("events")
        .update({ luma_slug: lumaSlug, luma_sync_status: "pending" })
        .eq("id", row.id);
      if (error) throw error;
    }

    const result = row.luma_event_id
      ? await client.updateEvent(row.luma_event_id, toLumaInput(row, lumaSlug))
      : await client.createEvent(toLumaInput(row, lumaSlug));

    const { error } = await supabase
      .from("events")
      .update({
        luma_event_id: result.apiId,
        luma_event_url: result.url,
        luma_synced_at: new Date().toISOString(),
        luma_sync_status: "synced",
        luma_sync_error: null,
      })
      .eq("id", row.id);
    if (error) throw error;
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
