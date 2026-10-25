import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLumaClient } from "@/lib/luma/client";
import { fromWire } from "@/lib/luma/map";
import {
  cancelIncomingLumaEvent,
  syncIncomingLumaEvent,
} from "@/lib/luma/incoming";
import { verifyLumaWebhookSignature } from "@/lib/luma/webhook";
import { notifyEventCancelled } from "@/lib/email/notifications";

export const runtime = "nodejs";
export const maxDuration = 15;

type LumaWebhookPayload = {
  type?: unknown;
  data?: unknown;
};

function eventIdFromPayload(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const event =
    row.event && typeof row.event === "object"
      ? (row.event as Record<string, unknown>)
      : row;
  if (typeof event.id === "string") return event.id;
  return typeof event.api_id === "string" ? event.api_id : null;
}

export async function POST(request: NextRequest) {
  const secret = process.env.LUMA_WEBHOOK_SECRET?.trim();
  if (!secret || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "webhook not configured" }, { status: 503 });
  }

  const signature = request.headers.get("webhook-signature");
  const webhookId = request.headers.get("webhook-id");
  if (!signature || !webhookId || webhookId.length > 200) {
    return NextResponse.json({ error: "invalid signature headers" }, { status: 400 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 1_000_000) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }
  const rawBody = await request.text();
  if (rawBody.length > 1_000_000) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }
  if (!verifyLumaWebhookSignature({ secret, signatureHeader: signature, rawBody })) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: LumaWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LumaWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const eventType = typeof payload.type === "string" ? payload.type : "unknown";
  const supabase = createAdminClient();
  const eventKey = `luma:${webhookId}`;
  const { error: claimError } = await supabase.from("webhook_events").insert({
    event_id: eventKey,
    event_type: eventType,
    payload,
  });
  if (claimError?.code === "23505") {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  if (claimError) {
    return NextResponse.json({ error: "webhook claim failed" }, { status: 500 });
  }

  try {
    if (["event.created", "event.updated", "calendar.event.added"].includes(eventType)) {
      const data = payload.data as Record<string, unknown> | undefined;
      // Luma can also place non-Luma external entries on a calendar. This
      // integration intentionally mirrors native Luma events only.
      if (data?.platform !== "external") {
        const apiId = eventIdFromPayload(payload.data);
        let event = fromWire(payload.data);
        if (apiId) {
          try {
            event = (await getLumaClient().getEvent(apiId)) ?? event;
          } catch (error) {
            // A signed webhook can still carry a complete event during a
            // transient API failure. Only fail delivery when neither source
            // produced a usable event.
            if (!event) throw error;
          }
        }
        if (!event) throw new Error("unrecognized Luma event payload");
        await syncIncomingLumaEvent(supabase, event);
      }
    } else if (eventType === "event.canceled") {
      const apiId = eventIdFromPayload(payload.data);
      if (!apiId) throw new Error("cancellation payload has no event id");
      const cancelled = await cancelIncomingLumaEvent(supabase, apiId);
      if (cancelled?.external_source === null) {
        await notifyEventCancelled({
          eventId: cancelled.id,
          eventTitle: cancelled.title,
        });
      }
    }

    revalidatePath("/events");
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (error) {
    // A failed delivery must remain retryable. The insert above is the
    // idempotency claim; release it before returning a non-2xx response.
    await supabase.from("webhook_events").delete().eq("event_id", eventKey);
    console.error("[luma webhook] processing failed", error);
    return NextResponse.json({ error: "webhook processing failed" }, { status: 500 });
  }
}
