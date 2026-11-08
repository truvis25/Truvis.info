export type EventPlatform = "Luma" | "Meetup";
export type EventLink = { platform: EventPlatform; url: string };
export type PublicEvent = {
  id: string;
  title: string;
  format: string;
  description: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  area: string;
  status: string;
  // Primary external registration page (Luma or Meetup), when the event is
  // run there rather than through member RSVP.
  external_url?: string | null;
  // Every external listing we know for this event, primary first.
  links?: EventLink[];
  // Luma's event id (evt-…), used for its embedded registration form.
  luma_api_id?: string | null;
  places_left?: number | null;
  price?: string | null;
  approval?: boolean;
  availability?: "open" | "waitlist" | "sold-out" | "closed" | null;
};
export type EventChannels = { luma: string; meetup: string | null };
export const HOUSE_ORIGIN = "https://house.truvis.info";
export const LUMA_CALENDAR_URL = "https://luma.com/Founderhouse";
export function eventDate(value: string) {
  return (
    new Intl.DateTimeFormat("en-GB", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Asia/Dubai",
    }).format(new Date(value)) + " GST"
  );
}
export type EventKind = "breakfast" | "conversation" | "sport" | "gathering";
export function eventKind(format: string): EventKind {
  if (/breakfast|coffee|brunch/i.test(format)) return "breakfast";
  if (/padel|football|volleyball|sport/i.test(format)) return "sport";
  if (/conversation|investor|circle|talk/i.test(format)) return "conversation";
  return "gathering";
}
// The title decides first; descriptions only count for unambiguous words, so
// "run an experiment" or "coffee afterwards" don't change the format.
function classify(text: string, title: boolean) {
  if (/breakfast|brunch/i.test(text) || (title && /coffee/i.test(text)))
    return "Founder breakfast";
  if (
    /padel|football|volleyball|pickleball/i.test(text) ||
    (title && /sport|run club|\brun\b|game/i.test(text))
  )
    return "Sport & social";
  if (
    /investor|roundtable|fireside/i.test(text) ||
    (title && /conversation|circle|talk|panel/i.test(text))
  )
    return "Conversation";
  return null;
}
export function eventFormat(title: string, description = "") {
  return (
    classify(title, true) ?? classify(description, false) ?? "Founder gathering"
  );
}
const part = (value: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai",
    ...options,
  }).format(new Date(value));
export function eventParts(starts: string, ends: string) {
  return {
    day: part(starts, { day: "2-digit" }),
    month: part(starts, { month: "short" }),
    monthLong: part(starts, { month: "long", year: "numeric" }),
    weekday: part(starts, { weekday: "long" }),
    weekdayShort: part(starts, { weekday: "short" }),
    time:
      part(starts, { hour: "2-digit", minute: "2-digit", hour12: false }) +
      "–" +
      part(ends, { hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}
export function daysAway(starts: string, at = Date.now()) {
  const day = (value: number) => Math.floor((value + 4 * 3600000) / 86400000);
  const diff = day(new Date(starts).getTime()) - day(at);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return "In " + diff + " days";
}
// How to get in, in the words a guest needs: places, waitlist or members.
export function placesLabel(e: PublicEvent) {
  if (e.availability === "sold-out") return "Fully booked";
  if (e.availability === "waitlist") return "Waitlist open";
  if (e.availability === "closed") return "Registration closed";
  if (typeof e.places_left === "number")
    return e.places_left === 1
      ? "1 place left"
      : e.places_left + " places left";
  if (e.external_url) return "Registration open";
  return e.capacity === 1 ? "1 place" : e.capacity + " places";
}
// The registration platform guests will land on, if not member RSVP.
export function registrationPlatform(e: PublicEvent) {
  if (!e.external_url) return null;
  return (
    e.links?.find((link) => link.url === e.external_url)?.platform ??
    (/meetup\.com/i.test(e.external_url) ? "Meetup" : "Luma")
  );
}
export function googleCalendarUrl(e: PublicEvent) {
  const stamp = (value: string) =>
    new Date(value)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const query = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: stamp(e.starts_at) + "/" + stamp(e.ends_at),
    details: e.description + "\n\n" + HOUSE_ORIGIN + "/events/" + e.id,
    location: /abu dhabi/i.test(e.area) ? e.area : e.area + ", Abu Dhabi",
  });
  return "https://calendar.google.com/calendar/render?" + query;
}
