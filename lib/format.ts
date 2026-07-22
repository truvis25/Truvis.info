// Shared date/time/number formatting.
//
// The platform is UAE-centric: public datetimes always render in Gulf
// Standard Time (Asia/Dubai) so the page shows the same wall-clock time
// regardless of the server or visitor timezone. Server components on
// Vercel run in UTC — never call toLocaleString without a timeZone.

export const PLATFORM_TZ = "Asia/Dubai";
export const LOCALE = "en-GB";

type DateInput = string | number | Date;

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

// "18 Sep 2026"
export function formatDate(value: DateInput): string {
  return toDate(value).toLocaleDateString(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: PLATFORM_TZ,
  });
}

// "Thu 18 Sep 2026, 18:00 GST"
export function formatDateTime(value: DateInput): string {
  return `${toDate(value).toLocaleString(LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PLATFORM_TZ,
  })} GST`;
}

// "18:00"
export function formatTime(value: DateInput): string {
  return toDate(value).toLocaleTimeString(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PLATFORM_TZ,
  });
}

// Calendar-tile pieces in platform time: { day: "18", month: "Sep", weekday: "Thursday" }
export function dateTileParts(value: DateInput): {
  day: string;
  month: string;
  weekday: string;
} {
  const d = toDate(value);
  return {
    day: d.toLocaleDateString(LOCALE, { day: "numeric", timeZone: PLATFORM_TZ }),
    month: d.toLocaleDateString(LOCALE, { month: "short", timeZone: PLATFORM_TZ }),
    weekday: d.toLocaleDateString(LOCALE, { weekday: "long", timeZone: PLATFORM_TZ }),
  };
}

// Gulf Standard Time is fixed UTC+4 (no DST), so datetime-local form values
// labeled GST can be converted to/from UTC instants with a constant offset.

// "2026-09-18T18:00" (GST wall clock, from <input type="datetime-local">) → UTC ISO string.
export function parseGstLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(`${value}+04:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// UTC ISO string → "2026-09-18T18:00" GST wall clock for datetime-local prefill.
export function toGstLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

// "AED 1,500,000" — grouping fixed to the platform locale.
export function formatAed(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "AED —";
  return `AED ${n.toLocaleString(LOCALE)}`;
}
