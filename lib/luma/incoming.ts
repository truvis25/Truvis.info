import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getLumaClient } from "./client";
import { lumaSlugFromUrl } from "./identity";
import type { LumaClient, LumaEvent } from "./types";

type ExistingEvent = {
  id: string;
  title: string;
  status: string;
  external_source: string | null;
  description: string | null;
  venue_address: string | null;
};

export type IncomingSyncResult =
  | "upserted"
  | "matched-pushed"
  | "hidden";

function externalEventSlug(apiId: string): string {
  const safe = apiId
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `luma-${safe || "event"}`;
}

async function matchPushedEvent(
  supabase: SupabaseClient,
  event: LumaEvent,
): Promise<boolean> {
  const lumaSlug = lumaSlugFromUrl(event.url);
  if (!lumaSlug?.startsWith("truvis-")) return false;

  const { data: local, error } = await supabase
    .from("events")
    .select("id")
    .eq("luma_slug", lumaSlug)
    .is("external_source", null)
    .maybeSingle();
  if (error) throw error;
  if (!local) return false;

  // If an earlier webhook won the race and created a pulled duplicate, keep
  // the audit row but release its external id before attaching it to the
  // canonical org-owned event.
  const { error: duplicateError } = await supabase
    .from("events")
    .update({
      status: "cancelled",
      luma_event_id: null,
      luma_sync_status: "failed",
      luma_sync_error: "Reconciled with its Truvis-owned source event",
      updated_at: new Date().toISOString(),
    })
    .eq("luma_event_id", event.apiId)
    .eq("external_source", "luma");
  if (duplicateError) throw duplicateError;

  const nowIso = new Date().toISOString();
  const { error: attachError } = await supabase
    .from("events")
    .update({
      luma_event_id: event.apiId,
      luma_event_url: event.url,
      luma_synced_at: nowIso,
      luma_sync_status: "synced",
      luma_sync_error: null,
      updated_at: nowIso,
    })
    .eq("id", local.id);
  if (attachError) throw attachError;
  return true;
}

export async function syncIncomingLumaEvent(
  supabase: SupabaseClient,
  event: LumaEvent,
): Promise<IncomingSyncResult> {
  if (await matchPushedEvent(supabase, event)) return "matched-pushed";

  const { data: existing, error: existingError } = await supabase
    .from("events")
    .select(
      "id, title, status, external_source, description, venue_address",
    )
    .eq("luma_event_id", event.apiId)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing?.external_source === null) {
    const { error } = await supabase
      .from("events")
      .update({
        luma_event_url: event.url,
        luma_synced_at: new Date().toISOString(),
        luma_sync_status: "synced",
        luma_sync_error: null,
      })
      .eq("id", existing.id);
    if (error) throw error;
    return "matched-pushed";
  }

  // Never turn a private or members-only calendar entry into public content.
  if (event.visibility !== "public") {
    if (existing?.external_source === "luma") {
      const { error } = await supabase
        .from("events")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) throw error;
    }
    return "hidden";
  }

  const nowIso = new Date().toISOString();
  const endsAt =
    event.endAt ??
    new Date(new Date(event.startAt).getTime() + 2 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from("events").upsert(
    {
      org_id: null,
      external_source: "luma",
      luma_event_id: event.apiId,
      luma_event_url: event.url,
      slug: externalEventSlug(event.apiId),
      title: event.name,
      // Calendar list responses can omit rich optional fields. Preserve the
      // last detailed webhook/get response instead of blanking good content.
      description: event.description ?? existing?.description ?? null,
      starts_at: event.startAt,
      ends_at: endsAt,
      timezone: event.timezone ?? "Asia/Dubai",
      venue_address: event.address ?? existing?.venue_address ?? null,
      // Luma's manage-level API can include a host-only meeting URL. The
      // public mirror always sends visitors to the canonical Luma page, so
      // never persist that protected URL in this publicly-readable row.
      online_url: null,
      status: "published",
      approval_mode: "auto",
      luma_synced_at: nowIso,
      luma_sync_status: "synced",
      luma_sync_error: null,
      updated_at: nowIso,
    },
    { onConflict: "luma_event_id" },
  );
  if (error) throw error;
  return "upserted";
}

export async function cancelIncomingLumaEvent(
  supabase: SupabaseClient,
  apiId: string,
): Promise<ExistingEvent | null> {
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title, status, external_source, description, venue_address",
    )
    .eq("luma_event_id", apiId)
    .maybeSingle();
  if (error) throw error;
  const existing = data as ExistingEvent | null;
  if (!existing || existing.status === "cancelled") return null;

  const nowIso = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("events")
    .update({
      status: "cancelled",
      luma_synced_at: nowIso,
      luma_sync_status: "synced",
      luma_sync_error: null,
      updated_at: nowIso,
    })
    .eq("id", existing.id);
  if (updateError) throw updateError;
  return existing;
}

export type LumaPullResult = {
  listed: number;
  upserted: number;
  matchedPushed: number;
  hidden: number;
  cancelled: number;
  completedPagination: boolean;
  malformedEntries: number;
  reconciliationSkipped: boolean;
  errors: string[];
};

export async function pullLumaCalendar(
  supabase: SupabaseClient,
  options?: { client?: LumaClient; after?: string },
): Promise<LumaPullResult> {
  const client = options?.client ?? getLumaClient();
  const after =
    options?.after ?? new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const listed: LumaEvent[] = [];
  let cursor: string | null = null;
  let completedPagination = true;
  let malformedEntries = 0;
  let pageCount = 0;
  const seenCursors = new Set<string>();
  const errors: string[] = [];

  try {
    do {
      pageCount += 1;
      if (pageCount > 100) {
        throw new Error("Luma pagination exceeded the 100-page safety limit");
      }
      const page = await client.listCalendarEvents({
        after,
        ...(cursor ? { cursor } : {}),
      });
      listed.push(...page.events);
      malformedEntries += page.invalidEntries;
      const nextCursor = page.nextCursor;
      if (nextCursor && seenCursors.has(nextCursor)) {
        throw new Error("Luma pagination returned a repeated cursor");
      }
      if (nextCursor) seenCursors.add(nextCursor);
      cursor = nextCursor;
    } while (cursor);
  } catch (error) {
    completedPagination = false;
    errors.push(error instanceof Error ? error.message : "Luma list failed");
  }

  if (malformedEntries > 0) {
    errors.push(`${malformedEntries} malformed Luma entries were skipped`);
  }

  let upserted = 0;
  let matchedPushed = 0;
  let hidden = 0;
  for (const event of listed) {
    try {
      const result = await syncIncomingLumaEvent(supabase, event);
      if (result === "upserted") upserted += 1;
      if (result === "matched-pushed") matchedPushed += 1;
      if (result === "hidden") hidden += 1;
    } catch (error) {
      errors.push(
        `${event.apiId}: ${error instanceof Error ? error.message : "sync failed"}`,
      );
    }
  }

  // An empty response is not enough evidence to mass-cancel a previously
  // populated calendar. Event webhooks cover the normal all-events-removed
  // case; this guard protects against a wrong/re-scoped API key.
  const reconciliationSkipped =
    !completedPagination || malformedEntries > 0 || listed.length === 0;
  let cancelled = 0;
  if (!reconciliationSkipped) {
    const nowIso = new Date().toISOString();
    const { data: stale, error } = await supabase
      .from("events")
      .select("id, luma_event_id")
      .eq("external_source", "luma")
      .eq("status", "published")
      .gt("starts_at", nowIso);
    if (error) {
      errors.push(error.message);
    } else {
      const listedIds = new Set(listed.map((event) => event.apiId));
      for (const row of stale ?? []) {
        if (row.luma_event_id && !listedIds.has(row.luma_event_id)) {
          const { error: updateError } = await supabase
            .from("events")
            .update({ status: "cancelled", updated_at: nowIso })
            .eq("id", row.id);
          if (updateError) errors.push(`${row.luma_event_id}: ${updateError.message}`);
          else cancelled += 1;
        }
      }
    }
  }

  return {
    listed: listed.length,
    upserted,
    matchedPushed,
    hidden,
    cancelled,
    completedPagination,
    malformedEntries,
    reconciliationSkipped,
    errors: errors.slice(0, 10),
  };
}
