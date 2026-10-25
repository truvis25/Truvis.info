// The ONE correction point for Luma wire shapes. These paths and fields match
// Luma's public OpenAPI contract; the defensive mapper still tolerates older
// response aliases so one malformed entry cannot stop a calendar sweep.
import type { LumaEvent, LumaEventInput, LumaEventPage } from "./types";

export const DEFAULT_BASE_URL = "https://public-api.luma.com";

export const LUMA_ENDPOINTS = {
  listEvents: "/v1/calendars/events/list",
  getEvent: "/v1/events/get",
  createEvent: "/v1/events/create",
  updateEvent: "/v1/events/update",
} as const;

type Wire = Record<string, unknown>;

function str(v: unknown): string | null {
  return typeof v === "string" && v.length ? v : null;
}

function visibility(v: unknown): LumaEvent["visibility"] {
  return v === "public" || v === "members-only" || v === "private" ? v : null;
}

// Defensive single-event mapper: unwraps {event: {...}} entries, tolerates
// field-name variants, and returns null (instead of throwing) for entries
// missing the essentials — one malformed entry must not kill a sync run.
export function fromWire(raw: unknown): LumaEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const outer = raw as Wire;
  const e = (outer.event && typeof outer.event === "object" ? outer.event : outer) as Wire;

  const apiId = str(e.api_id) ?? str(e.id) ?? str(outer.api_id) ?? str(outer.id);
  const startAt =
    str(e.start_at) ??
    str(e.starts_at) ??
    str(outer.start_at) ??
    str(outer.starts_at);
  const name = str(e.name) ?? str(e.title) ?? str(outer.name) ?? str(outer.title);
  if (!apiId || !startAt || !name) return null;

  const geo = (e.geo_address_json ?? {}) as Wire;
  const location = (e.location ?? {}) as Wire;

  return {
    apiId,
    name,
    description:
      str(e.description_md) ??
      str(e.description) ??
      str(outer.description_md) ??
      str(outer.description),
    coverUrl: str(e.cover_url) ?? str(outer.cover_url),
    startAt,
    endAt:
      str(e.end_at) ??
      str(e.ends_at) ??
      str(outer.end_at) ??
      str(outer.ends_at),
    timezone: str(e.timezone) ?? str(outer.timezone),
    url: str(e.url) ?? str(outer.url) ?? `https://luma.com/${apiId}`,
    meetingUrl:
      str(e.meeting_url) ??
      str(e.zoom_meeting_url) ??
      str(outer.meeting_url) ??
      str(outer.zoom_meeting_url),
    address:
      str(geo.full_address) ?? str(geo.address) ?? str(location.address) ?? null,
    visibility: visibility(e.visibility) ?? visibility(outer.visibility),
    registrationOpen:
      typeof e.registration_open === "boolean"
        ? e.registration_open
        : typeof outer.registration_open === "boolean"
          ? outer.registration_open
          : null,
  };
}

export function fromWirePage(raw: unknown): LumaEventPage {
  const page = (raw ?? {}) as Wire;
  const pagination =
    page.pagination && typeof page.pagination === "object"
      ? (page.pagination as Wire)
      : {};
  const rawEntries = page.entries ?? page.events ?? page.data ?? [];
  const entries = Array.isArray(rawEntries) ? rawEntries : [];
  const mapped = entries.map(fromWire);
  const events = mapped.filter((event): event is LumaEvent => event !== null);
  const nextCursor =
    str(page.next_cursor) ??
    str(pagination.next_cursor) ??
    (page.has_more && typeof page.cursor === "string" ? page.cursor : null);
  return {
    events,
    nextCursor,
    invalidEntries: mapped.length - events.length,
  };
}

export function toWire(input: Partial<LumaEventInput>): Wire {
  const body: Wire = {};
  if (input.name !== undefined) body.name = input.name;
  if (input.description !== undefined) body.description_md = input.description;
  if (input.startAt !== undefined) body.start_at = input.startAt;
  if (input.endAt !== undefined) body.end_at = input.endAt;
  if (input.timezone !== undefined) body.timezone = input.timezone;
  if (input.address != null) {
    body.geo_address_json = { type: "manual", address: input.address };
  }
  if (input.meetingUrl != null) body.meeting_url = input.meetingUrl;
  if (input.slug !== undefined) body.slug = input.slug;
  if (input.visibility !== undefined) body.visibility = input.visibility;
  if (input.registrationOpen !== undefined) {
    body.registration_open = input.registrationOpen;
  }
  if (input.suppressNotifications !== undefined) {
    body.suppress_notifications = input.suppressNotifications;
  }
  return body;
}
