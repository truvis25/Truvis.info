import {
  LUMA_CALENDAR_URL,
  eventFormat,
  type EventChannels,
  type EventLink,
  type PublicEvent,
} from "./events.ts";

// Public Founder House listings on Luma and Meetup. Both are read from their
// public pages, so no account credentials are needed here: Luma's calendar
// page (embedded page data, with its schema.org list as a fallback) and the
// Meetup group's iCal feed. Organiser-created events still come from the
// membership desk; matching external listings are merged into them.

const HOUR = 3600000;
const LUMA_HOST = /(^|\.)(luma\.com|lu\.ma)$/i;
const MEETUP_HOST = /(^|\.)meetup\.com$/i;

type Json = Record<string, unknown>;
const obj = (v: unknown): Json | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null;
const str = (v: unknown) =>
  typeof v === "string" && v.trim() ? v.trim() : null;
const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const iso = (v: unknown) => {
  const t = Date.parse(String(v ?? ""));
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
};

// Meetup group: FOUNDER_HOUSE_MEETUP_GROUP accepts the group's URL name or
// its full meetup.com address. The membership desk uses the same name.
export function meetupGroup(value = process.env.FOUNDER_HOUSE_MEETUP_GROUP) {
  const raw = value?.trim();
  if (!raw) return null;
  let name = raw;
  try {
    const url = new URL(raw);
    if (!MEETUP_HOST.test(url.hostname)) return null;
    name = url.pathname.split("/").filter(Boolean)[0] ?? "";
  } catch {}
  return /^[A-Za-z0-9_-]{2,80}$/.test(name) ? name : null;
}
export function eventChannels(): EventChannels {
  const group = meetupGroup();
  return {
    luma: LUMA_CALENDAR_URL,
    meetup: group ? `https://www.meetup.com/${group}/` : null,
  };
}

function lumaSlug(url: string) {
  try {
    const parsed = new URL(url, "https://luma.com");
    if (!LUMA_HOST.test(parsed.hostname)) return null;
    const slug = parsed.pathname.split("/").filter(Boolean)[0];
    return slug && /^[A-Za-z0-9_-]+$/.test(slug) ? slug : null;
  } catch {
    return null;
  }
}

// Luma reports some cities in Arabic or as the whole country until the venue
// is public. The site always names the area, so fall back to Abu Dhabi.
function readableArea(...candidates: Array<string | null | undefined>) {
  for (const value of candidates) {
    const area = value?.trim();
    if (area && !/united arab emirates|[؀-ۿ]/i.test(area)) return area;
  }
  return "Abu Dhabi";
}

function money(cents: number) {
  const value = cents / 100;
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
export function lumaPrice(ticket: Json | null) {
  if (!ticket) return null;
  if (ticket.is_free === true) return "Free";
  const price = obj(ticket.price),
    max = obj(ticket.max_price);
  const low = num(price?.cents),
    high = num(max?.cents),
    currency = str(price?.currency)?.toUpperCase();
  if (low === null || !currency) return null;
  return (
    currency +
    " " +
    money(low) +
    (high !== null && high > low ? "–" + money(high) : "")
  );
}

function jsonLdScripts(html: string) {
  const values: unknown[] = [];
  const pattern =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    try {
      const value = JSON.parse(match[1]);
      values.push(...(Array.isArray(value) ? value : [value]));
    } catch {}
  }
  return values;
}

type LdEvent = {
  url?: string;
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: {
    name?: string;
    address?: { streetAddress?: string; addressLocality?: string };
  };
};
function jsonLdEvents(html: string): LdEvent[] {
  const list = jsonLdScripts(html)
    .map(obj)
    .find(
      (v) => v?.["@type"] === "ItemList" && Array.isArray(v.itemListElement),
    );
  return ((list?.itemListElement as unknown[]) ?? [])
    .map((entry) => obj(obj(entry)?.item) as LdEvent | null)
    .filter((item): item is LdEvent => !!item);
}

// Collect Luma calendar entries ({ event: { api_id, start_at, url } }) from
// the page's embedded data without depending on its exact nesting.
function lumaEntries(html: string) {
  const match = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
  );
  if (!match) return [];
  let root: unknown;
  try {
    root = JSON.parse(match[1]);
  } catch {
    return [];
  }
  const found = new Map<string, Json>();
  const visit = (value: unknown, depth: number) => {
    if (depth > 9 || found.size > 200) return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item, depth + 1);
      return;
    }
    const o = obj(value);
    if (!o) return;
    const event = obj(o.event);
    const id = str(event?.api_id);
    if (
      event &&
      id?.startsWith("evt-") &&
      str(event.start_at) &&
      str(event.url)
    ) {
      if (!found.has(id)) found.set(id, o);
      return;
    }
    for (const child of Object.values(o)) visit(child, depth + 1);
  };
  visit(root, 0);
  return [...found.values()];
}

const AVAILABILITY = ["open", "waitlist", "sold-out", "closed"] as const;

export function lumaEventsFromCalendarHtml(html: string): PublicEvent[] {
  const ld = new Map<string, LdEvent>();
  for (const item of jsonLdEvents(html)) {
    const slug = item.url ? lumaSlug(item.url) : null;
    if (slug) ld.set(slug, item);
  }

  const rich = lumaEntries(html)
    .map((entry): PublicEvent | null => {
      const event = obj(entry.event)!;
      const slug = lumaSlug(String(event.url));
      const title = str(event.name);
      const starts = iso(event.start_at);
      if (!slug || !title || !starts) return null;
      if (str(event.visibility) && event.visibility !== "public") return null;
      const ends =
        iso(event.end_at) ??
        new Date(Date.parse(starts) + 2 * HOUR).toISOString();
      const geo = obj(event.geo_address_info);
      const shown =
        geo?.mode === "shown" || event.geo_address_visibility === "public";
      const ticket = obj(entry.ticket_info);
      const availability = AVAILABILITY.find(
        (a) => a === entry.registration_availability,
      );
      const places = num(ticket?.spots_remaining);
      const description = str(ld.get(slug)?.description) ?? "";
      return {
        id: "luma-" + slug,
        title,
        format: eventFormat(title, description),
        description,
        starts_at: starts,
        ends_at: ends,
        capacity: places ?? 0,
        area: readableArea(
          str(geo?.sublocality),
          shown ? str(geo?.address) : null,
          str(geo?.city),
        ),
        status: "published",
        external_url: "https://luma.com/" + slug,
        links: [{ platform: "Luma", url: "https://luma.com/" + slug }],
        luma_api_id: str(event.api_id),
        places_left: places,
        price: lumaPrice(ticket),
        approval: ticket?.require_approval === true,
        availability:
          ticket?.is_sold_out === true ? "sold-out" : (availability ?? null),
      };
    })
    .filter((e): e is PublicEvent => !!e);
  if (rich.length) return byStart(rich);

  // Fallback: the calendar's schema.org event list.
  return byStart(
    [...ld.entries()]
      .map(([slug, item]): PublicEvent | null => {
        const starts = iso(item.startDate),
          ends = iso(item.endDate);
        if (!item.name || !starts || !ends) return null;
        const description = item.description?.trim() ?? "";
        return {
          id: "luma-" + slug,
          title: item.name,
          format: eventFormat(item.name, description),
          description,
          starts_at: starts,
          ends_at: ends,
          capacity: 0,
          area: readableArea(
            item.location?.name,
            item.location?.address?.streetAddress,
            item.location?.address?.addressLocality,
          ),
          status: "published",
          external_url: "https://luma.com/" + slug,
          links: [{ platform: "Luma", url: "https://luma.com/" + slug }],
          places_left: null,
        };
      })
      .filter((e): e is PublicEvent => !!e),
  );
}

export function lumaDescriptionFromEventHtml(html: string) {
  for (const value of jsonLdScripts(html).map(obj)) {
    if (value?.["@type"] === "Event") {
      const text = str(value.description);
      if (text) return text;
    }
  }
  return null;
}

// --- Meetup iCal ---------------------------------------------------------

function tzOffset(at: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(at));
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return (
    Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second"),
    ) - at
  );
}
// Parse an iCal DATE-TIME (UTC, floating or TZID-qualified) to ISO.
export function icsInstant(value: string, timeZone?: string | null) {
  const m = value.match(
    /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/,
  );
  if (!m) return null;
  const [, y, mo, d, h = "0", mi = "0", s = "0", z] = m;
  const local = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);
  if (z) return new Date(local).toISOString();
  let zone = timeZone || "Asia/Dubai";
  try {
    tzOffset(local, zone);
  } catch {
    zone = "Asia/Dubai";
  }
  let utc = local - tzOffset(local, zone);
  const corrected = local - tzOffset(utc, zone);
  if (corrected !== utc) utc = corrected;
  return new Date(utc).toISOString();
}
const icsText = (value: string) =>
  value
    .replace(/\\n/gi, "\n")
    .replace(/\\([,;\\])/g, "$1")
    .trim();
// Meetup descriptions are Markdown; keep the words, drop the markup.
const plainText = (value: string) =>
  value
    .replace(/\\-/g, "-")
    .replace(/^-{3,}$/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, "$1 ($2)")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export function meetupEventsFromIcs(ics: string): PublicEvent[] {
  const lines = ics.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  const calendarName =
    lines
      .find((l) => l.startsWith("X-WR-CALNAME:"))
      ?.slice(13)
      .trim() ?? "";
  const events: PublicEvent[] = [];
  let current: Map<string, { value: string; params: string }> | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") current = new Map();
    else if (line === "END:VEVENT" && current) {
      const get = (k: string) => current!.get(k);
      const uid = get("UID")?.value ?? "";
      const id = uid.match(/event_([A-Za-z0-9]+)@meetup\.com/)?.[1];
      const zone = (p?: string) => p?.match(/TZID=([^;:]+)/)?.[1] ?? null;
      const starts = get("DTSTART")
        ? icsInstant(get("DTSTART")!.value, zone(get("DTSTART")!.params))
        : null;
      const ends = get("DTEND")
        ? icsInstant(get("DTEND")!.value, zone(get("DTEND")!.params))
        : null;
      const title = get("SUMMARY") ? icsText(get("SUMMARY")!.value) : "";
      let url = get("URL")?.value ?? "";
      try {
        if (!MEETUP_HOST.test(new URL(url).hostname)) url = "";
      } catch {
        url = "";
      }
      if (id && starts && title && url) {
        let description = plainText(icsText(get("DESCRIPTION")?.value ?? ""));
        if (calendarName && description.startsWith(calendarName + "\n"))
          description = description.slice(calendarName.length + 1).trim();
        const location = icsText(get("LOCATION")?.value ?? "");
        events.push({
          id: "meetup-" + id,
          title,
          format: eventFormat(title, description),
          description,
          starts_at: starts,
          ends_at:
            ends ?? new Date(Date.parse(starts) + 2 * HOUR).toISOString(),
          capacity: 0,
          area: readableArea(location.split(/\s*[,(]\s*/)[0]),
          status: /CANCELLED/i.test(get("STATUS")?.value ?? "")
            ? "cancelled"
            : "published",
          external_url: url,
          links: [{ platform: "Meetup", url }],
          places_left: null,
        });
      }
      current = null;
    } else if (current) {
      const colon = line.indexOf(":");
      if (colon > 0) {
        const head = line.slice(0, colon),
          [name, ...params] = head.split(";");
        if (!current.has(name))
          current.set(name, {
            value: line.slice(colon + 1),
            params: params.join(";"),
          });
      }
    }
  }
  return byStart(events);
}

// --- Combining sources ---------------------------------------------------

const byStart = (events: PublicEvent[]) =>
  events.sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );
const titleKey = (t: string) =>
  t
    .toLowerCase()
    .replace(/^cancelled:\s*/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
export function sameEvent(a: PublicEvent, b: PublicEvent) {
  if (a.id === b.id) return true;
  const urls = new Set([a.external_url, ...(a.links ?? []).map((l) => l.url)]);
  if (
    [b.external_url, ...(b.links ?? []).map((l) => l.url)].some(
      (u) => u && urls.has(u),
    )
  )
    return true;
  const close =
    Math.abs(Date.parse(a.starts_at) - Date.parse(b.starts_at)) <= 15 * 60000;
  const x = titleKey(a.title),
    y = titleKey(b.title);
  return close && !!x && !!y && (x === y || x.includes(y) || y.includes(x));
}

// The first listing of an event wins (organiser events, then Luma, then
// Meetup); later listings add their links and any details it lacks.
export function combineEvents(...sources: PublicEvent[][]): PublicEvent[] {
  const combined: PublicEvent[] = [];
  for (const event of sources.flat()) {
    const index = combined.findIndex((existing) => sameEvent(existing, event));
    if (index < 0) {
      combined.push({ ...event, links: [...(event.links ?? [])] });
      continue;
    }
    const base = combined[index];
    const links: EventLink[] = [...(base.links ?? [])];
    for (const link of event.links ?? [])
      if (!links.some((l) => l.platform === link.platform)) links.push(link);
    // Member RSVP owns capacity for organiser events; an external count
    // would contradict it.
    const native = !base.external_url;
    combined[index] = {
      ...base,
      description: base.description || event.description,
      links,
      luma_api_id: base.luma_api_id ?? event.luma_api_id ?? null,
      places_left: native
        ? (base.places_left ?? null)
        : (base.places_left ?? event.places_left ?? null),
      price: base.price ?? event.price ?? null,
      approval: base.approval ?? event.approval,
      availability: native
        ? (base.availability ?? null)
        : (base.availability ?? event.availability ?? null),
    };
  }
  return byStart(combined);
}

async function fetchText(url: string, revalidate: number) {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; FounderHouse/1.0; +https://house.truvis.info)",
    },
    next: { revalidate },
    signal: AbortSignal.timeout(8000),
  } as RequestInit);
  if (!response.ok) throw Error(url + " returned " + response.status);
  return response.text();
}

async function lumaEvents(): Promise<PublicEvent[]> {
  const events = lumaEventsFromCalendarHtml(
    await fetchText(LUMA_CALENDAR_URL, 120),
  );
  // The calendar list carries no descriptions; read them from the event
  // pages (cached for longer, since they change rarely).
  await Promise.all(
    events
      .filter((e) => !e.description)
      .slice(0, 8)
      .map(async (e) => {
        try {
          const text = lumaDescriptionFromEventHtml(
            await fetchText(e.external_url!, 1800),
          );
          if (text) {
            e.description = text;
            e.format = eventFormat(e.title, text);
          }
        } catch {}
      }),
  );
  return events;
}

async function meetupEvents(): Promise<PublicEvent[]> {
  const group = meetupGroup();
  if (!group) return [];
  return meetupEventsFromIcs(
    await fetchText(`https://www.meetup.com/${group}/events/ical/`, 120),
  );
}

export async function upcomingExternalEvents(
  at = Date.now(),
): Promise<PublicEvent[]> {
  const [luma, meetup] = await Promise.allSettled([
    lumaEvents(),
    meetupEvents(),
  ]);
  return combineEvents(
    luma.status === "fulfilled" ? luma.value : [],
    meetup.status === "fulfilled" ? meetup.value : [],
  ).filter(
    (e) => e.status === "published" && new Date(e.ends_at).getTime() > at,
  );
}

export async function mergeExternalEvents(
  events: PublicEvent[],
): Promise<PublicEvent[]> {
  return combineEvents(events, await upcomingExternalEvents());
}
