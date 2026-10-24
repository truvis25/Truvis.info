import { HOUSE_ORIGIN, type PublicEvent } from "./events.ts";
const escapeText = (s: string) =>
  s
    .replaceAll("\\", "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
const instant = (s: string) =>
  new Date(s)
    .toISOString()
    .replaceAll(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
// RFC 5545 line folding counts UTF-8 octets and never splits a multi-byte character.
export function foldLine(line: string) {
  const lines: string[] = [];
  let current = "",
    bytes = 0;
  for (const c of line) {
    const size = new TextEncoder().encode(c).length;
    if (bytes + size > 75) {
      lines.push(current);
      current = " ";
      bytes = 1;
    }
    current += c;
    bytes += size;
  }
  lines.push(current);
  return lines.join("\r\n");
}
export function calendarFeed(
  events: PublicEvent[],
  stamp = new Date().toISOString(),
) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TRUVIS//Founder House//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Founder House Abu Dhabi",
    "X-WR-TIMEZONE:Asia/Dubai",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
  ];
  for (const e of events)
    lines.push(
      "BEGIN:VEVENT",
      "UID:" + e.id + "@house.truvis.info",
      "DTSTAMP:" + instant(stamp),
      "DTSTART:" + instant(e.starts_at),
      "DTEND:" + instant(e.ends_at),
      "SUMMARY:" + escapeText(e.title),
      "DESCRIPTION:" +
        escapeText(
          e.description +
            "\nApproved members only. Membership and RSVP: " +
            HOUSE_ORIGIN +
            "/events/" +
            e.id,
        ),
      "LOCATION:" +
        escapeText(e.area + ", Abu Dhabi. Exact venue shared with members."),
      "URL:" + HOUSE_ORIGIN + "/events/" + e.id,
      "STATUS:" + (e.status === "cancelled" ? "CANCELLED" : "CONFIRMED"),
      "END:VEVENT",
    );
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
