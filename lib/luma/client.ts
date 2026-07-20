import "server-only";
import type { LumaClient, LumaEventInput } from "./types";
import {
  DEFAULT_BASE_URL,
  LUMA_ENDPOINTS,
  fromWire,
  fromWirePage,
  toWire,
} from "./map";
import { mockLumaClient } from "./mock";

// HTTP client for the Luma public API (central Truvis calendar). All wire
// shapes route through lib/luma/map.ts. One retry with backoff on 429/5xx —
// Luma's rate limits are modest and the callers are non-interactive.
class HttpLumaClient implements LumaClient {
  constructor(
    private baseUrl: string,
    private apiKey: string,
  ) {}

  private async request<T>(
    path: string,
    init: { method: "GET" | "POST"; query?: Record<string, string>; body?: unknown },
    retried = false,
  ): Promise<{ status: number; json: T | null }> {
    const url = new URL(this.baseUrl.replace(/\/$/, "") + path);
    for (const [key, value] of Object.entries(init.query ?? {})) {
      url.searchParams.set(key, value);
    }
    const res = await fetch(url, {
      method: init.method,
      headers: {
        "x-luma-api-key": this.apiKey,
        "content-type": "application/json",
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
    if ((res.status === 429 || res.status >= 500) && !retried) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return this.request(path, init, true);
    }
    if (res.status === 404) return { status: 404, json: null };
    if (!res.ok) {
      throw new Error(`Luma API ${path} failed: ${res.status}`);
    }
    return { status: res.status, json: (await res.json()) as T };
  }

  async listCalendarEvents(opts?: { after?: string; cursor?: string }) {
    const query: Record<string, string> = {};
    if (opts?.after) query.after = opts.after;
    if (opts?.cursor) query.cursor = opts.cursor;
    const { json } = await this.request(LUMA_ENDPOINTS.listEvents, {
      method: "GET",
      query,
    });
    return fromWirePage(json);
  }

  async getEvent(apiId: string) {
    const { status, json } = await this.request(LUMA_ENDPOINTS.getEvent, {
      method: "GET",
      query: { api_id: apiId },
    });
    if (status === 404) return null;
    return fromWire(json);
  }

  async createEvent(input: LumaEventInput) {
    const { json } = await this.request(LUMA_ENDPOINTS.createEvent, {
      method: "POST",
      body: toWire(input),
    });
    const event = fromWire(json);
    if (!event) throw new Error("Luma API create returned an unrecognized shape");
    return event;
  }

  async updateEvent(apiId: string, input: Partial<LumaEventInput>) {
    const { json } = await this.request(LUMA_ENDPOINTS.updateEvent, {
      method: "POST",
      body: { api_id: apiId, ...toWire(input) },
    });
    const event = fromWire(json);
    if (!event) throw new Error("Luma API update returned an unrecognized shape");
    return event;
  }
}

export function getLumaClient(): LumaClient {
  if (process.env.LUMA_API_MODE === "mock") return mockLumaClient;
  return new HttpLumaClient(
    process.env.LUMA_API_BASE_URL ?? DEFAULT_BASE_URL,
    process.env.LUMA_API_KEY!,
  );
}
