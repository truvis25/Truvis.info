// App-facing, wire-agnostic Luma types. Wire-shape mapping (endpoint paths,
// snake_case fields) lives exclusively in lib/luma/map.ts — the single
// correction point once the real API is reachable in production.

export interface LumaEvent {
  apiId: string;
  name: string;
  description: string | null;
  coverUrl: string | null; // Luma CDN URL — informational only, never rendered directly (CSP)
  startAt: string; // ISO
  endAt: string | null;
  timezone: string | null;
  url: string; // public lu.ma page
  meetingUrl: string | null;
  address: string | null;
}

export interface LumaEventInput {
  name: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  timezone?: string;
  address?: string | null;
  meetingUrl?: string | null;
}

export interface LumaClient {
  listCalendarEvents(opts?: {
    after?: string;
    cursor?: string;
  }): Promise<{ events: LumaEvent[]; nextCursor: string | null }>;
  getEvent(apiId: string): Promise<LumaEvent | null>;
  createEvent(input: LumaEventInput): Promise<LumaEvent>;
  updateEvent(apiId: string, input: Partial<LumaEventInput>): Promise<LumaEvent>;
}
