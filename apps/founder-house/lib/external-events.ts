import type { PublicEvent } from "./events";

const EXTERNAL_EVENTS: PublicEvent[] = [
  {
    id: "luma-pk2m8tdp",
    title: "Founder House Breakfast",
    format: "Founder breakfast",
    description:
      "A small Founder House breakfast for founders, startup teams and investors to meet over coffee, exchange ideas and build meaningful connections in Abu Dhabi.",
    starts_at: "2026-11-02T09:00:00.000Z",
    ends_at: "2026-11-02T10:00:00.000Z",
    capacity: 20,
    area: "Le Noir Café & Kitchen · Saadiyat Island",
    status: "published",
    external_url: "https://luma.com/pk2m8tdp",
  },
];

export function upcomingExternalEvents(at = Date.now()): PublicEvent[] {
  return EXTERNAL_EVENTS.filter(
    (event) =>
      event.status === "published" && new Date(event.ends_at).getTime() > at,
  );
}

export function mergeExternalEvents(events: PublicEvent[]): PublicEvent[] {
  const combined = [...events];
  for (const external of upcomingExternalEvents()) {
    const duplicate = combined.some(
      (event) =>
        event.id === external.id ||
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
