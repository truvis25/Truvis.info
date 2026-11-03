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
  external_url?: string | null;
};
export const HOUSE_ORIGIN = "https://house.truvis.info";
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
const part = (value: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", ...options }).format(
    new Date(value),
  );
export function eventParts(starts: string, ends: string) {
  return {
    day: part(starts, { day: "2-digit" }),
    month: part(starts, { month: "short" }),
    weekday: part(starts, { weekday: "long" }),
    time:
      part(starts, { hour: "2-digit", minute: "2-digit", hour12: false }) +
      "–" +
      part(ends, { hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}
export function daysAway(starts: string, at = Date.now()) {
  const day = (value: number) =>
    Math.floor((value + 4 * 3600000) / 86400000);
  const diff = day(new Date(starts).getTime()) - day(at);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return "In " + diff + " days";
}
export function googleCalendarUrl(e: PublicEvent) {
  const stamp = (value: string) =>
    new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const query = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: stamp(e.starts_at) + "/" + stamp(e.ends_at),
    details: e.description + "\n\n" + HOUSE_ORIGIN + "/events/" + e.id,
    location: e.area + ", Abu Dhabi",
  });
  return "https://calendar.google.com/calendar/render?" + query;
}
