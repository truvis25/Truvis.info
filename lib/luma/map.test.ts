import { describe, expect, it } from "vitest";
import { fromWire, fromWirePage, toWire } from "./map";

const officialEvent = {
  platform: "luma",
  id: "evt-live-1",
  name: "Abu Dhabi Founder Forum",
  description_md: "A focused founder session.",
  start_at: "2026-09-01T14:00:00.000Z",
  end_at: "2026-09-01T16:00:00.000Z",
  timezone: "Asia/Dubai",
  url: "https://luma.com/founder-forum",
  meeting_url: null,
  cover_url: "https://images.lumacdn.com/example.jpg",
  visibility: "public",
  registration_open: true,
  geo_address_json: {
    address: "Al Maryah Island",
    full_address: "Al Maryah Island, Abu Dhabi, UAE",
  },
};

describe("Luma wire mapping", () => {
  it("maps the current public API event shape", () => {
    expect(fromWire(officialEvent)).toEqual({
      apiId: "evt-live-1",
      name: "Abu Dhabi Founder Forum",
      description: "A focused founder session.",
      coverUrl: "https://images.lumacdn.com/example.jpg",
      startAt: "2026-09-01T14:00:00.000Z",
      endAt: "2026-09-01T16:00:00.000Z",
      timezone: "Asia/Dubai",
      url: "https://luma.com/founder-forum",
      meetingUrl: null,
      address: "Al Maryah Island, Abu Dhabi, UAE",
      visibility: "public",
      registrationOpen: true,
    });
  });

  it("maps a paginated calendar response", () => {
    expect(
      fromWirePage({ entries: [officialEvent], has_more: true, next_cursor: "next-1" }),
    ).toEqual({
      events: [fromWire(officialEvent)],
      nextCursor: "next-1",
      invalidEntries: 0,
    });
  });

  it("maps calendar entry wrappers without losing the outer event id", () => {
    expect(
      fromWire({
        api_id: "evt-wrapper-1",
        visibility: "public",
        event: {
          name: "Wrapped event",
          start_at: "2026-09-02T10:00:00.000Z",
          url: "https://luma.com/wrapped-event",
        },
      }),
    ).toMatchObject({
      apiId: "evt-wrapper-1",
      name: "Wrapped event",
      visibility: "public",
    });
  });

  it("reports malformed entries so reconciliation can fail closed", () => {
    expect(fromWirePage({ entries: [officialEvent, { id: "missing-fields" }] }))
      .toMatchObject({
        events: [fromWire(officialEvent)],
        invalidEntries: 1,
      });
  });

  it("writes current create/update field names", () => {
    expect(
      toWire({
        name: "Forum",
        description: "Details",
        address: "Abu Dhabi",
        registrationOpen: false,
        slug: "truvis-forum-12345678",
        visibility: "public",
      }),
    ).toEqual({
      name: "Forum",
      description_md: "Details",
      geo_address_json: { type: "manual", address: "Abu Dhabi" },
      registration_open: false,
      slug: "truvis-forum-12345678",
      visibility: "public",
    });
  });
});
