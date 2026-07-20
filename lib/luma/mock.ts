import type { LumaClient, LumaEvent, LumaEventInput } from "./types";

// Stateful in-memory mock so push → pull round-trips are demoable within one
// server process (mirrors the compliance mock's fixture style). Fixtures:
//  - evt-mock-1: in-person Dubai mixer (+7 days) with a fake Luma CDN cover
//    (proves we never render Luma CDN URLs).
//  - evt-mock-2: webinar (+14 days) with meetingUrl and NO endAt (proves the
//    ends_at fallback in the sync).
//  - evt-mock-3: past event (−3 days) (proves upcoming windowing).

function daysFromNow(days: number, hour = 9): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

function fixtures(): LumaEvent[] {
  return [
    {
      apiId: "evt-mock-1",
      name: "GCC Fintech Compliance Mixer",
      description:
        "An evening of networking for compliance officers, fintech founders, and regulators across the GCC. Hosted on the Truvis community calendar.",
      coverUrl: "https://images.lumacdn.com/mock/evt-mock-1.jpg",
      startAt: daysFromNow(7, 16),
      endAt: daysFromNow(7, 19),
      timezone: "Asia/Dubai",
      url: "https://lu.ma/truvis-fintech-mixer",
      meetingUrl: null,
      address: "DIFC Innovation Hub, Gate Avenue, Dubai",
    },
    {
      apiId: "evt-mock-2",
      name: "ESG Reporting for Free-Zone Entities (Webinar)",
      description:
        "A practical walkthrough of ESG disclosure expectations for UAE free-zone companies, with live Q&A.",
      coverUrl: null,
      startAt: daysFromNow(14, 11),
      endAt: null,
      timezone: "Asia/Dubai",
      url: "https://lu.ma/truvis-esg-webinar",
      meetingUrl: "https://meet.example.com/truvis-esg",
      address: null,
    },
    {
      apiId: "evt-mock-3",
      name: "Trade License Renewal Clinic",
      description: "Past community session — already concluded.",
      coverUrl: null,
      startAt: daysFromNow(-3, 10),
      endAt: daysFromNow(-3, 12),
      timezone: "Asia/Dubai",
      url: "https://lu.ma/truvis-renewal-clinic",
      meetingUrl: null,
      address: "Truvis HQ, Business Bay, Dubai",
    },
  ];
}

const store = new Map<string, LumaEvent>();
let pushCounter = 0;

function seeded(): Map<string, LumaEvent> {
  if (store.size === 0) {
    for (const event of fixtures()) store.set(event.apiId, event);
  }
  return store;
}

export const mockLumaClient: LumaClient = {
  async listCalendarEvents() {
    return { events: [...seeded().values()], nextCursor: null };
  },

  async getEvent(apiId: string) {
    return seeded().get(apiId) ?? null;
  },

  async createEvent(input: LumaEventInput) {
    pushCounter += 1;
    const apiId = `evt-push-${pushCounter}`;
    const slugish = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40);
    const event: LumaEvent = {
      apiId,
      name: input.name,
      description: input.description ?? null,
      coverUrl: null,
      startAt: input.startAt,
      endAt: input.endAt,
      timezone: input.timezone ?? "Asia/Dubai",
      url: `https://lu.ma/truvis-${slugish}`,
      meetingUrl: input.meetingUrl ?? null,
      address: input.address ?? null,
    };
    seeded().set(apiId, event);
    return event;
  },

  async updateEvent(apiId: string, input: Partial<LumaEventInput>) {
    const existing = seeded().get(apiId);
    if (!existing) throw new Error(`Luma mock: event ${apiId} not found`);
    const updated: LumaEvent = {
      ...existing,
      name: input.name ?? existing.name,
      description:
        input.description !== undefined ? (input.description ?? null) : existing.description,
      startAt: input.startAt ?? existing.startAt,
      endAt: input.endAt ?? existing.endAt,
      timezone: input.timezone ?? existing.timezone,
      meetingUrl:
        input.meetingUrl !== undefined ? (input.meetingUrl ?? null) : existing.meetingUrl,
      address: input.address !== undefined ? (input.address ?? null) : existing.address,
    };
    seeded().set(apiId, updated);
    return updated;
  },
};
