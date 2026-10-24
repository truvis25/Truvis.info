import type { SupabaseClient } from "npm:@supabase/supabase-js@2.110.7";
import {
  CHANNELS,
  channelConfig,
  publishChannel,
  PublishError,
  validExternalUrl,
  type PublishConfig,
  type EventRow,
  type Channel,
} from "./publishing.ts";
import { publicEvent } from "./validation.ts";
const now = () => new Date().toISOString();
function data<T>(r: { data: T; error: any }): T {
  if (r.error) throw Error(r.error.code ?? "database_error");
  return r.data;
}
export async function publicationHash(e: EventRow) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(publicEvent(e))),
  );
  return Array.from(new Uint8Array(bytes), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
}
export async function distributeEvent(
  db: SupabaseClient,
  c: PublishConfig,
  id: string,
) {
  const event = data(
    await db.from("fh_events").select("*").eq("id", id).maybeSingle(),
  );
  if (!event) throw Error("event_not_found");
  const hash = await publicationHash(event),
    configuration = channelConfig(c);
  // All channels start together; failure on one never prevents the other attempts.
  const results = await Promise.all(
    CHANNELS.map(async (channel) => {
      try {
        return await send(channel);
      } catch {
        return {
          channel,
          status: "failed",
          message:
            "Event saved. Distribution could not be completed; retry from the organiser desk.",
        };
      }
    }),
  );
  return {
    results,
    message:
      "Event saved. Check each channel status; only a confirmed receipt is marked published.",
  };
  async function send(channel: Channel): Promise<Record<string, unknown>> {
    const existing = data(
      await db
        .from("fh_distribution_jobs")
        .select("*")
        .eq("event_id", id)
        .eq("channel", channel)
        .maybeSingle(),
    );
    if (event.status !== "published" && !existing?.external_id)
      return { channel, status: "not_required" };
    if (
      existing?.payload_hash === hash &&
      ["published", "synced"].includes(existing.status)
    )
      return { channel, status: existing.status, url: existing.external_url };
    if (
      existing &&
      ["publishing", "needs_review", "accepted"].includes(existing.status)
    )
      return {
        channel,
        status: existing.status,
        message:
          existing.message ??
          "Check the external account before retrying. A request may already have been received.",
      };
    if (!configuration.find((x) => x.name === channel)?.connected) {
      data(
        await db
          .from("fh_distribution_jobs")
          .upsert(
            {
              ...(existing
                ? {
                    id: existing.id,
                    external_id: existing.external_id,
                    external_url: existing.external_url,
                  }
                : {}),
              event_id: id,
              channel,
              status: "not_connected",
              payload_hash: hash,
              message: configuration.find((x) => x.name === channel)
                ?.requirement,
              updated_at: now(),
            },
            { onConflict: "event_id,channel" },
          ),
      );
      return { channel, status: "not_connected" };
    }
    const lock = crypto.randomUUID(),
      row = {
        event_id: id,
        channel,
        status: "publishing",
        payload_hash: hash,
        lock_id: lock,
        message: null,
        updated_at: now(),
        attempts: (existing?.attempts ?? 0) + 1,
      };
    if (existing) {
      const claimed = data(
        await db
          .from("fh_distribution_jobs")
          .update(row)
          .eq("id", existing.id)
          .eq("updated_at", existing.updated_at)
          .select("id")
          .maybeSingle(),
      );
      if (!claimed) return { channel, status: "in_progress" };
    } else {
      const inserted = await db.from("fh_distribution_jobs").insert(row);
      if (inserted.error?.code === "23505")
        return { channel, status: "in_progress" };
      if (inserted.error) throw Error(inserted.error.code);
    }
    try {
      const receipt = await publishChannel(
        channel,
        { ...event, publication_key: id + ":" + hash },
        c,
        existing?.external_id ?? undefined,
        async (external_id, external_url) => {
          data(
            await db
              .from("fh_distribution_jobs")
              .update({
                external_id,
                ...(external_url ? { external_url } : {}),
                updated_at: now(),
              })
              .eq("event_id", id)
              .eq("channel", channel)
              .eq("lock_id", lock),
          );
        },
      );
      const latest = data(
        await db.from("fh_events").select("*").eq("id", id).single(),
      );
      const status =
        (await publicationHash(latest)) === hash
          ? receipt.status
          : "needs_update";
      data(
        await db
          .from("fh_distribution_jobs")
          .update({ ...receipt, status, lock_id: null, updated_at: now() })
          .eq("event_id", id)
          .eq("channel", channel)
          .eq("lock_id", lock),
      );
      return { channel, status, url: receipt.external_url };
    } catch (error) {
      const status =
        error instanceof PublishError && !error.uncertain
          ? "failed"
          : "needs_review";
      const message =
        error instanceof PublishError
          ? error.message
          : "The response could not be saved. Check the channel before retrying.";
      data(
        await db
          .from("fh_distribution_jobs")
          .update({ status, message, lock_id: null, updated_at: now() })
          .eq("event_id", id)
          .eq("channel", channel)
          .eq("lock_id", lock),
      );
      return { channel, status, message };
    }
  }
}
export async function reconcilePublication(
  db: SupabaseClient,
  id: string,
  b: Record<string, unknown>,
) {
  if (!CHANNELS.includes(b.channel as Channel))
    throw Error("Choose a supported channel.");
  const channel = b.channel as Channel;
  const row = data(
    await db
      .from("fh_distribution_jobs")
      .select("*")
      .eq("event_id", id)
      .eq("channel", channel)
      .maybeSingle(),
  );
  if (!row) throw Error("No publication attempt exists for this channel.");
  if (
    row.status === "publishing" &&
    Date.now() - new Date(row.updated_at).getTime() < 60000
  )
    throw Error(
      "A publication attempt is still running. Check again in a minute.",
    );
  if (b.notCreated === true) {
    // Organiser confirms the channel dashboard was checked. Existing IDs are retained for updates.
    data(
      await db
        .from("fh_distribution_jobs")
        .update({
          status: "failed",
          lock_id: null,
          message:
            "Organiser checked the channel; safe to retry using the saved external ID if present.",
          updated_at: now(),
        })
        .eq("id", row.id),
    );
    return;
  }
  const external_url = validExternalUrl(channel, b.externalUrl),
    external_id = String(b.externalId ?? "").trim();
  if (!external_url || !external_id || external_id.length > 200)
    throw Error("Provide the channel’s HTTPS listing URL and event/post ID.");
  const event = data(
    await db.from("fh_events").select("*").eq("id", id).single(),
  );
  data(
    await db
      .from("fh_distribution_jobs")
      .update({
        status: event.status === "published" ? "published" : "synced",
        external_url,
        external_id,
        lock_id: null,
        payload_hash: await publicationHash(event),
        message:
          "Listing receipt verified manually by an authorised organiser.",
        updated_at: now(),
      })
      .eq("id", row.id),
  );
}
