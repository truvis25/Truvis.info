import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getLumaClient } from "./client";

const event = {
  id: "evt-live-1",
  name: "Founder Forum",
  start_at: "2026-09-01T14:00:00.000Z",
  end_at: "2026-09-01T16:00:00.000Z",
  timezone: "Asia/Dubai",
  url: "https://luma.com/founder-forum",
  cover_url: "",
  meeting_url: null,
  geo_address_json: null,
  visibility: "public",
  registration_open: false,
};

describe("HttpLumaClient", () => {
  beforeEach(() => {
    process.env.LUMA_API_MODE = "live";
    process.env.LUMA_API_KEY = "test-key";
    process.env.LUMA_API_BASE_URL = "https://api.example/v1";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.LUMA_API_MODE;
    delete process.env.LUMA_API_KEY;
    delete process.env.LUMA_API_BASE_URL;
  });

  it("uses current pagination parameters for calendar listings", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ entries: [event], has_more: false }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const page = await getLumaClient().listCalendarEvents({
      after: "2026-08-01T00:00:00.000Z",
      cursor: "cursor-1",
    });

    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.pathname).toBe("/v1/calendars/events/list");
    expect(url.searchParams.get("pagination_cursor")).toBe("cursor-1");
    expect(url.searchParams.get("pagination_limit")).toBe("100");
    expect(url.searchParams.getAll("access")).toEqual(["manage", "view"]);
    expect(page.events[0].apiId).toBe("evt-live-1");
    expect(page.invalidEntries).toBe(0);
  });

  it("reads an event back after create returns its id", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "evt-live-1" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(event), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const created = await getLumaClient().createEvent({
      name: "Founder Forum",
      startAt: event.start_at,
      endAt: event.end_at,
      registrationOpen: false,
    });

    const createUrl = new URL(String(fetchMock.mock.calls[0][0]));
    const getUrl = new URL(String(fetchMock.mock.calls[1][0]));
    expect(createUrl.pathname).toBe("/v1/events/create");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      name: "Founder Forum",
      timezone: "Asia/Dubai",
      registration_open: false,
    });
    expect(getUrl.pathname).toBe("/v1/events/get");
    expect(getUrl.searchParams.get("event_id")).toBe("evt-live-1");
    expect(created.url).toBe("https://luma.com/founder-forum");
  });

  it("reads an event back after the update endpoint returns an empty body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("{}", {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...event, name: "Updated Forum" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const updated = await getLumaClient().updateEvent("evt-live-1", {
      name: "Updated Forum",
    });

    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      event_id: "evt-live-1",
      name: "Updated Forum",
    });
    expect(updated.name).toBe("Updated Forum");
  });
});
