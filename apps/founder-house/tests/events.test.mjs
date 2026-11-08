import assert from "node:assert/strict";
import {
  lumaEventsFromCalendarHtml,
  lumaDescriptionFromEventHtml,
  lumaPrice,
  meetupEventsFromIcs,
  meetupGroup,
  icsInstant,
  combineEvents,
} from "../lib/external-events.ts";
import {
  placesLabel,
  registrationPlatform,
  eventParts,
  eventFormat,
} from "../lib/events.ts";

const nextData = (data) =>
  `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
    props: { pageProps: { initialData: { data } } },
  })}</script>`;
const ld = (value) =>
  `<script type="application/ld+json">${JSON.stringify(value)}</script>`;

// Luma calendar page: embedded entries plus the schema.org list.
const calendarHtml =
  "<html><head>" +
  ld({
    "@type": "ItemList",
    itemListElement: [
      {
        item: {
          "@type": "Event",
          url: "https://luma.com/fh-breakfast",
          name: "Founder House Breakfast",
          description: "Coffee with founders.",
          startDate: "2026-12-05T08:00:00.000+04:00",
          endDate: "2026-12-05T10:00:00.000+04:00",
        },
      },
    ],
  }) +
  "</head><body>" +
  nextData({
    calendar: { api_id: "cal-1" },
    upcoming: {
      entries: [
        {
          api_id: "calev-2",
          event: {
            api_id: "evt-PADEL",
            name: "Founder Padel Night",
            url: "fh-padel",
            start_at: "2026-12-12T15:00:00.000Z",
            end_at: "2026-12-12T17:00:00.000Z",
            visibility: "public",
            geo_address_visibility: "guests-only",
            geo_address_info: {
              mode: "obfuscated",
              city: "أبو ظبي",
              sublocality: "Al Reem Island",
            },
          },
          registration_availability: "waitlist",
          ticket_info: {
            is_free: false,
            price: { cents: 4000, currency: "aed" },
            max_price: { cents: 8000, currency: "aed" },
            spots_remaining: 0,
            is_sold_out: false,
            require_approval: true,
          },
        },
        {
          api_id: "calev-1",
          event: {
            api_id: "evt-BREAKFAST",
            name: "Founder House Breakfast",
            url: "fh-breakfast",
            start_at: "2026-12-05T04:00:00.000Z",
            end_at: "2026-12-05T06:00:00.000Z",
            visibility: "public",
            geo_address_info: {
              mode: "shown",
              address: "Louvre Café",
              city: "Abu Dhabi",
            },
          },
          registration_availability: "open",
          ticket_info: {
            is_free: true,
            spots_remaining: 7,
            require_approval: true,
          },
        },
        {
          api_id: "calev-3",
          event: {
            api_id: "evt-PRIVATE",
            name: "Private",
            url: "private-one",
            start_at: "2026-12-20T15:00:00.000Z",
            visibility: "private",
          },
        },
      ],
    },
  }) +
  "</body></html>";

const luma = lumaEventsFromCalendarHtml(calendarHtml);
assert.equal(luma.length, 2, "private Luma events are skipped");
assert.equal(luma[0].id, "luma-fh-breakfast", "sorted by start time");
assert.equal(luma[0].luma_api_id, "evt-BREAKFAST");
assert.equal(luma[0].description, "Coffee with founders.");
assert.equal(luma[0].format, "Founder breakfast");
assert.equal(luma[0].area, "Louvre Café", "public venue is shown");
assert.equal(luma[0].price, "Free");
assert.equal(luma[0].places_left, 7);
assert.equal(placesLabel(luma[0]), "7 places left");
assert.equal(registrationPlatform(luma[0]), "Luma");
assert.equal(
  luma[1].area,
  "Al Reem Island",
  "obfuscated venue shows only the area",
);
assert.equal(luma[1].price, "AED 40–80");
assert.equal(luma[1].format, "Sport & social");
assert.equal(luma[1].ends_at, "2026-12-12T17:00:00.000Z");
assert.equal(placesLabel(luma[1]), "Waitlist open");
assert.equal(luma[1].approval, true);
console.log("PASS Luma calendar entries");

// Fallback: no embedded data, schema.org only.
const fallback = lumaEventsFromCalendarHtml(
  calendarHtml.replace(/<body>.*<\/body>/s, ""),
);
assert.equal(fallback.length, 1);
assert.equal(fallback[0].starts_at, "2026-12-05T04:00:00.000Z");
assert.equal(fallback[0].external_url, "https://luma.com/fh-breakfast");
assert.equal(placesLabel(fallback[0]), "Registration open");
assert.deepEqual(lumaEventsFromCalendarHtml("<html>nothing</html>"), []);
console.log("PASS Luma schema.org fallback");

assert.equal(
  lumaDescriptionFromEventHtml(
    ld({ "@type": "Event", description: "Full text" }),
  ),
  "Full text",
);
assert.equal(
  lumaPrice({ is_free: false, price: { cents: 2550, currency: "usd" } }),
  "USD 25.50",
);
assert.equal(lumaPrice(null), null);
console.log("PASS Luma descriptions and prices");

// Meetup iCal: folded lines, TZID times, escaped text and Markdown.
const ics = [
  "BEGIN:VCALENDAR",
  "X-WR-CALNAME:Founder House Abu Dhabi",
  "BEGIN:VEVENT",
  "UID:event_312345678@meetup.com",
  "DTSTART;TZID=Asia/Dubai:20261205T080000",
  "DTEND;TZID=Asia/Dubai:20261205T100000",
  "SUMMARY:Founder House Breakfast",
  "DESCRIPTION:Founder House Abu Dhabi\\n**Coffee** with founders\\, investor",
  " s and operators.",
  "LOCATION:Saadiyat Island\\, Abu Dhabi",
  "URL;VALUE=URI:https://www.meetup.com/founder-house/events/312345678/",
  "STATUS:CONFIRMED",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:event_399999999@meetup.com",
  "DTSTART:20261220T110000Z",
  "SUMMARY:Investor Circle",
  "URL;VALUE=URI:https://www.meetup.com/founder-house/events/399999999/",
  "STATUS:CANCELLED",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:event_1@meetup.com",
  "DTSTART:20261220T110000Z",
  "SUMMARY:Bad link",
  "URL:https://evil.example/1",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");
const meetup = meetupEventsFromIcs(ics);
assert.equal(meetup.length, 2, "events without a meetup.com link are skipped");
assert.equal(meetup[0].id, "meetup-312345678");
assert.equal(meetup[0].starts_at, "2026-12-05T04:00:00.000Z");
assert.equal(meetup[0].ends_at, "2026-12-05T06:00:00.000Z");
assert.equal(
  meetup[0].description,
  "Coffee with founders, investors and operators.",
);
assert.equal(meetup[0].area, "Saadiyat Island");
assert.equal(registrationPlatform(meetup[0]), "Meetup");
assert.equal(meetup[1].status, "cancelled");
assert.equal(meetup[1].ends_at, "2026-12-20T13:00:00.000Z");
assert.equal(
  icsInstant("20260329T013000", "Europe/London"),
  "2026-03-29T01:30:00.000Z",
);
assert.equal(
  icsInstant("20260701T090000", "Europe/London"),
  "2026-07-01T08:00:00.000Z",
);
assert.equal(
  icsInstant("20261205T080000", "Not/AZone"),
  "2026-12-05T04:00:00.000Z",
);
assert.equal(icsInstant("nonsense"), null);
console.log("PASS Meetup iCal feed");

assert.equal(meetupGroup("founder-house"), "founder-house");
assert.equal(
  meetupGroup("https://www.meetup.com/founder-house/events/"),
  "founder-house",
);
assert.equal(meetupGroup("https://evil.example/founder-house"), null);
assert.equal(meetupGroup("bad name!"), null);
assert.equal(meetupGroup(""), null);
console.log("PASS Meetup group setting");

// One event listed on Luma and Meetup appears once, with both links.
const both = combineEvents(luma, meetup);
const breakfast = both.filter((e) => /breakfast/i.test(e.title));
assert.equal(breakfast.length, 1);
assert.deepEqual(
  breakfast[0].links.map((l) => l.platform),
  ["Luma", "Meetup"],
);
assert.equal(breakfast[0].external_url, "https://luma.com/fh-breakfast");
assert.equal(both.length, 3);

// Organiser events keep member RSVP and their own capacity.
const native = {
  id: "12345678-1234-1234-1234-123456789012",
  title: "Founder House Breakfast",
  format: "Founder breakfast",
  description: "From the desk.",
  starts_at: "2026-12-05T04:05:00.000Z",
  ends_at: "2026-12-05T06:00:00.000Z",
  capacity: 12,
  area: "Saadiyat Island",
  status: "published",
};
const merged = combineEvents([native], luma, meetup);
const desk = merged.find((e) => e.id === native.id);
assert.equal(merged.filter((e) => /breakfast/i.test(e.title)).length, 1);
assert.equal(desk.external_url, undefined);
assert.equal(desk.places_left, null);
assert.equal(placesLabel(desk), "12 places");
assert.equal(desk.links.length, 2);
console.log("PASS combining organiser, Luma and Meetup listings");

const parts = eventParts(
  "2026-12-05T04:00:00.000Z",
  "2026-12-05T06:00:00.000Z",
);
assert.equal(parts.time, "08:00–10:00");
assert.equal(parts.weekdayShort, "Sat");
assert.equal(parts.monthLong, "December 2026");
console.log("PASS Abu Dhabi date parts");

assert.equal(
  eventFormat("Shipping fast", "Teams run dozens of experiments."),
  "Founder gathering",
);
assert.equal(
  eventFormat("Founder Padel Night", "Coffee afterwards."),
  "Sport & social",
);
assert.equal(
  eventFormat("Morning meetup", "Breakfast is served."),
  "Founder breakfast",
);
assert.equal(eventFormat("Investor Circle"), "Conversation");
console.log("PASS event formats");
