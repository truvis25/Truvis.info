import type { PublicEvent } from "./events";

const LUMA_CALENDAR_URL = "https://luma.com/Founderhouse";

const FALLBACK_EVENTS: PublicEvent[] = [
  {
    id: "luma-pk2m8tdp",
    title: "Founder House Breakfast",
    format: "Founder breakfast",
    description:
      "Start the morning with good coffee and a small table of people building, backing and helping businesses grow.",
    starts_at: "2026-11-07T07:00:00.000Z",
    ends_at: "2026-11-07T10:00:00.000Z",
    capacity: 12,
    area: "Le Noir Café & Kitchen · Saadiyat Island",
    status: "published",
    external_url: "https://luma.com/pk2m8tdp",
  },
];

type JsonLdEvent = {
  "@type"?: string;
  url?: string;
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: {
    name?: string;
    address?: {
      streetAddress?: string;
      addressLocality?: string;
    };
  };
};

type JsonLdList = {
  "@type"?: string;
  name?: string;
  itemListElement?: Array<{
    item?: JsonLdEvent;
  }>;
};

function eventFormat(title: string, description: string) {
  const text = `${title} ${description}`;
  if (/breakfast|coffee|brunch/i.test(text)) return "Founder breakfast";
  if (/padel|football|volleyball|sport|run|game/i.test(text))
    return "Sport & social";
  if (/investor|conversation|circle|roundtable|talk/i.test(text))
    return "Conversation";
  return "Founder gathering";
}

function lumaSlug(url: string) {
  try {
    const parsed = new URL(url);
    if (!/(^|\.)luma\.com$/i.test(parsed.hostname)) return null;
    const slug = parsed.pathname.split("/").filter(Boolean)[0];
    return slug && /^[A-Za-z0-9_-]+$/.test(slug) ? slug : null;
  } catch {
    return null;
  }
}

function spotsRemaining(html: string, slug: string) {
  const marker = `\"url\":\"${slug}\"`;
  const start = html.indexOf(marker);
  if (start < 0) return null;
  const nearby = html.slice(start, start + 18000);
  const match = nearby.match(/\"spots_remaining\":(\d+)/);
  return match ? Number(match[1]) : null;
}

function jsonLdScripts(html: string) {
  const values: unknown[] = [];
  const pattern =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    try {
      values.push(JSON.parse(match[1]));
    } catch {}
  }
  return values;
}

function eventsFromCalendarHtml(html: string): PublicEvent[] {
  const now = Date.now();
  const lists = jsonLdScripts(html).flatMap((value) =>
    Array.isArray(value) ? value : [value],
  );
  const itemList = lists.find(
    (value): value is JsonLdList =>
      !!value &&
      typeof value === "object" &&
      (value as JsonLdList)["@type"] === "ItemList" &&
      Array.isArray((value as JsonLdList).itemListElement),
  );

  if (!itemList?.itemListElement) return [];

  return itemList.itemListElement
    .map((entry): PublicEvent | null => {
      const item = entry.item;
      if (!item?.name || !item.url || !item.startDate || !item.endDate)
        return null;
      const slug = lumaSlug(item.url);
      if (!slug) return null;
      const endsAt = new Date(item.endDate).getTime();
      if (!Number.isFinite(endsAt) || endsAt <= now) return null;
      const known = FALLBACK_EVENTS.find((event) => event.id === `luma-${slug}`);
      const description = item.description?.trim() || known?.description || item.name;
      const lumaVenue =
        item.location?.name || item.location?.address?.streetAddress;
      // Luma reports only the city (sometimes in Arabic) until the venue is
      // public, so prefer the venue we already know for that event.
      const venue =
        known?.area ||
        (lumaVenue && !/united arab emirates|أبو ظبي/i.test(lumaVenue)
          ? lumaVenue
          : "Abu Dhabi");
      const remaining = spotsRemaining(html, slug);
      return {
        id: `luma-${slug}`,
        title: item.name,
        format: eventFormat(item.name, description),
        description,
        starts_at: new Date(item.startDate).toISOString(),
        ends_at: new Date(item.endDate).toISOString(),
        capacity:
          typeof remaining === "number" && Number.isFinite(remaining)
            ? remaining
            : known?.capacity ?? 20,
        area: venue,
        status: "published",
        external_url: item.url,
      };
    })
    .filter((event): event is PublicEvent => !!event)
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
}

function fallbackUpcoming(at = Date.now()) {
  return FALLBACK_EVENTS.filter(
    (event) =>
      event.status === "published" && new Date(event.ends_at).getTime() > at,
  );
}

export async function upcomingExternalEvents(
  at = Date.now(),
): Promise<PublicEvent[]> {
  try {
    const response = await fetch(LUMA_CALENDAR_URL, {
      headers: { "user-agent": "Mozilla/5.0 FounderHouse/1.0" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return fallbackUpcoming(at);
    const events = eventsFromCalendarHtml(await response.text()).filter(
      (event) => new Date(event.ends_at).getTime() > at,
    );
    return events.length ? events : fallbackUpcoming(at);
  } catch {
    return fallbackUpcoming(at);
  }
}

export async function mergeExternalEvents(
  events: PublicEvent[],
): Promise<PublicEvent[]> {
  const combined = [...events];
  for (const external of await upcomingExternalEvents()) {
    const duplicate = combined.some(
      (event) =>
        event.id === external.id ||
        event.external_url === external.external_url ||
        (event.title.toLowerCase() === external.title.toLowerCase() &&
          event.starts_at === external.starts_at),
    );
    if (!duplicate) combined.push(external);
  }
  return combined.sort(
    (a, b) =>
      new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );
}
