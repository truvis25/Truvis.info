// The ONE correction point for Luma wire shapes. The public API docs are not
// reachable from the build sandbox, so everything endpoint- and field-shaped
// is isolated here and written defensively; adjust against docs.luma.com
// during live activation without touching client/sync/UI code.
import type { LumaEvent, LumaEventInput } from "./types";

export const DEFAULT_BASE_URL = "https://public-api.luma.com/v1";

export const LUMA_ENDPOINTS = {
  listEvents: "/calendar/list-events",
  getEvent: "/event/get",
  createEvent: "/event/create",
  updateEvent: "/event/update",
} as const;

type Wire = Record<string, unknown>;

function str(v: unknown): string | null {
  return typeof v === "string" && v.length ? v : null;
}

// Defensive single-event mapper: unwraps {event: {...}} entries, tolerates
// field-name variants, and returns null (instead of throwing) for entries
// missing the essentials — one malformed entry must not kill a sync run.
export function fromWire(raw: unknown): LumaEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const outer = raw as Wire;
  const e = (outer.event && typeof outer.event === "object" ? outer.event : outer) as Wire;

  const apiId = str(e.api_id) ?? str(e.id);
  const startAt = str(e.start_at) ?? str(e.starts_at);
  const name = str(e.name) ?? str(e.title);
  if (!apiId || !startAt || !name) return null;

  const geo = (e.geo_address_json ?? {}) as Wire;
  const location = (e.location ?? {}) as Wire;

  return {
    apiId,
    name,
    description: str(e.description) ?? str(e.description_md),
    coverUrl: str(e.cover_url),
    startAt,
    endAt: str(e.end_at) ?? str(e.ends_at),
    timezone: str(e.timezone),
    url: str(e.url) ?? `https://lu.ma/${apiId}`,
    meetingUrl: str(e.meeting_url) ?? str(e.zoom_meeting_url),
    address:
      str(geo.full_address) ?? str(geo.address) ?? str(location.address) ?? null,
  };
}

export function fromWirePage(raw: unknown): {
  events: LumaEvent[];
  nextCursor: string | null;
} {
  const page = (raw ?? {}) as Wire;
  const entries = (page.entries ?? page.events ?? page.data ?? []) as unknown[];
  const events = entries
    .map(fromWire)
    .filter((event): event is LumaEvent => event !== null);
  const nextCursor =
    str(page.next_cursor) ??
    (page.has_more && typeof page.cursor === "string" ? page.cursor : null);
  return { events, nextCursor };
}

export function toWire(input: Partial<LumaEventInput>): Wire {
  const body: Wire = {};
  if (input.name !== undefined) body.name = input.name;
  if (input.description !== undefined) body.description = input.description;
  if (input.startAt !== undefined) body.start_at = input.startAt;
  if (input.endAt !== undefined) body.end_at = input.endAt;
  body.timezone = input.timezone ?? "Asia/Dubai";
  if (input.address != null) {
    body.geo_address_json = { address: input.address };
  }
  if (input.meetingUrl != null) body.meeting_url = input.meetingUrl;
  return body;
}
