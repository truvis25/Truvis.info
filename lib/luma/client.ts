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
    init: {
      method: "GET" | "POST";
      query?: Record<string, string | string[]>;
      body?: unknown;
    },
    retried = false,
  ): Promise<{ status: number; json: T | null }> {
    const url = new URL(this.baseUrl.replace(/\/$/, "") + path);
    for (const [key, value] of Object.entries(init.query ?? {})) {
      for (const item of Array.isArray(value) ? value : [value]) {
        url.searchParams.append(key, item);
      }
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
    const bodyText = await res.text();
    return {
      status: res.status,
      json: bodyText ? (JSON.parse(bodyText) as T) : null,
    };
  }

  async listCalendarEvents(opts?: { after?: string; cursor?: string }) {
    const query: Record<string, string | string[]> = {
      pagination_limit: "100",
      sort_column: "start_at",
      sort_direction: "asc",
      access: ["manage", "view"],
    };
    if (opts?.after) query.after = opts.after;
    if (opts?.cursor) query.pagination_cursor = opts.cursor;
    const { json } = await this.request(LUMA_ENDPOINTS.listEvents, {
      method: "GET",
      query,
    });
    return fromWirePage(json);
  }

  async getEvent(apiId: string) {
    const { status, json } = await this.request(LUMA_ENDPOINTS.getEvent, {
      method: "GET",
      query: { event_id: apiId },
    });
    if (status === 404) return null;
    return fromWire(json);
  }

  async createEvent(input: LumaEventInput) {
    const body = toWire(input);
    // Luma accepts suppress_notifications on updates only.
    delete body.suppress_notifications;
    const { json } = await this.request<{ id?: unknown }>(LUMA_ENDPOINTS.createEvent, {
      method: "POST",
      body: {
        ...body,
        timezone: input.timezone ?? "Asia/Dubai",
      },
    });
    const apiId = typeof json?.id === "string" ? json.id : null;
    if (!apiId) throw new Error("Luma API create returned no event id");
    const event = await this.getEvent(apiId);
    if (!event) throw new Error("Luma API created the event but it could not be read back");
    return event;
  }

  async updateEvent(apiId: string, input: Partial<LumaEventInput>) {
    await this.request(LUMA_ENDPOINTS.updateEvent, {
      method: "POST",
      body: { event_id: apiId, ...toWire(input) },
    });
    const event = await this.getEvent(apiId);
    if (!event) throw new Error("Luma API updated the event but it could not be read back");
    return event;
  }
}

export type LumaIntegrationMode = "live" | "mock" | "unconfigured";

export function getLumaIntegrationMode(): LumaIntegrationMode {
  if (process.env.NODE_ENV !== "production" && process.env.LUMA_API_MODE === "mock") {
    return "mock";
  }
  return process.env.LUMA_API_KEY?.trim() ? "live" : "unconfigured";
}

export function isLumaLiveConfigured(): boolean {
  return getLumaIntegrationMode() === "live";
}

export function getLumaClient(): LumaClient {
  const mode = getLumaIntegrationMode();
  if (mode === "mock") return mockLumaClient;
  if (mode === "unconfigured") {
    throw new Error("Luma integration is not configured");
  }
  const configuredBase = process.env.LUMA_API_BASE_URL?.replace(/\/v1\/?$/, "");
  return new HttpLumaClient(
    configuredBase || DEFAULT_BASE_URL,
    process.env.LUMA_API_KEY as string,
  );
}
