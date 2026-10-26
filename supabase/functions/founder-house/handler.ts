import type { SupabaseClient } from "npm:@supabase/supabase-js@2.110.7";
import {
  applicationData,
  eventData,
  publicEvent,
  MAX_CV_BYTES,
} from "./validation.ts";
type Row = Record<string, any>;
import { channelConfig, type PublishConfig } from "./publishing.ts";
import { distributeEvent, reconcilePublication } from "./distribution.ts";
import {
  deliverEmail,
  HOUSE_EMAIL,
  HOUSE_URL,
  EMAIL_FROM,
  type Mailer,
} from "./email.ts";
type Config = PublishConfig & { mailer?: Mailer };
const now = () => new Date().toISOString();
const hash = async (s: string) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)),
    ),
    (x) => x.toString(16).padStart(2, "0"),
  ).join("");
const token = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
const fail = (error: string, status = 400) => json({ error }, status);
function result<T>(r: { data: T; error: any }): T {
  if (r.error) throw Error(r.error.code ?? "database_error");
  return r.data;
}
async function member(r: Request, db: SupabaseClient) {
  const raw = r.headers.get("x-fh-member-token");
  if (!raw || !/^[a-f0-9]{64}$/.test(raw)) return null;
  return result(
    await db
      .from("fh_applications")
      .select("*")
      .eq("member_token_hash", await hash(raw))
      .eq("status", "approved")
      .gt("member_expires_at", now())
      .maybeSingle(),
  );
}
async function admin(r: Request, db: SupabaseClient) {
  const access = r.headers.get("authorization")?.replace(/^Bearer /i, "");
  if (!access) return null;
  const {
    data: { user },
    error,
  } = await db.auth.getUser(access);
  if (error || !user) return null;
  const { data: profile } = await db
    .from("user_profiles")
    .select("platform_admin")
    .eq("id", user.id)
    .maybeSingle();
  return profile?.platform_admin ? user : null;
}
export function createHandler(db: SupabaseClient, config: Config = {}) {
  async function savedDistribution(id: string) {
    try {
      return await distributeEvent(db, config, id);
    } catch {
      return {
        results: [],
        message:
          "Event saved. Distribution is temporarily unavailable; retry from the organiser desk.",
      };
    }
  }
  return async (r: Request): Promise<Response> => {
    try {
      const path = r.headers.get("x-fh-path") ?? "",
        method = r.method;
      if (Number(r.headers.get("content-length") ?? 0) > 3500000)
        return fail("Your CV must be a PDF under 3 MB.", 413);
      if (["/api/events", "/api/calendar"].includes(path) && method === "GET") {
        const rows = result(
          await db
            .from("fh_events")
            .select("*")
            .in(
              "status",
              path === "/api/calendar"
                ? ["published", "cancelled"]
                : ["published"],
            )
            .gt("ends_at", now())
            .order("starts_at"),
        );
        return json({ events: (rows ?? []).map(publicEvent) });
      }
      if (path === "/api/apply" && method === "POST") {
        const hour = new Date().toISOString().slice(0, 13),
          ip =
            r.headers.get("x-fh-client-ip") ??
            r.headers.get("x-forwarded-for") ??
            "unknown";
        const allowed = result(
          await db.rpc("fh_take_rate_slot", {
            p_key: await hash(ip + ":" + hour),
            p_limit: 8,
          }),
        );
        if (!allowed)
          return fail("Too many requests. Please try again in an hour.", 429);
        const global = result(
          await db.rpc("fh_take_rate_slot", {
            p_key: "global:" + hour,
            p_limit: 300,
          }),
        );
        if (!global)
          return fail(
            "The membership desk is receiving many applications. Please try again later.",
            429,
          );
        const f = await r.formData();
        if (f.get("website")) return json({ received: true }, 202);
        let data;
        try {
          data = applicationData(f);
        } catch (e) {
          return fail((e as Error).message);
        }
        const cv = f.get("cv"),
          file = cv instanceof File && cv.size ? cv : null;
        if (!data.linkedin && !file)
          return fail("Add your LinkedIn profile or a PDF CV.");
        if (
          file &&
          (file.size > MAX_CV_BYTES ||
            new TextDecoder().decode(await file.slice(0, 5).arrayBuffer()) !==
              "%PDF-")
        )
          return fail("Your CV must be a PDF under 3 MB.");
        const existing = result(
          await db
            .from("fh_applications")
            .select("id")
            .eq("email", data.email)
            .maybeSingle(),
        );
        if (existing) return json({ received: true }, 202);
        const id = "FH-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
          cv_key = file ? "applications/" + crypto.randomUUID() + ".pdf" : null;
        if (file && cv_key) {
          const { error } = await db.storage
            .from("founder-house-cvs")
            .upload(cv_key, await file.arrayBuffer(), {
              contentType: "application/pdf",
              upsert: false,
            });
          if (error)
            return fail(
              "CV upload could not be completed. Please retry or use LinkedIn.",
              503,
            );
        }
        const { error } = await db
          .from("fh_applications")
          .insert({ id, ...data, cv_key });
        if (error) {
          if (cv_key)
            await db.storage.from("founder-house-cvs").remove([cv_key]);
          if (error.code === "23505") return json({ received: true }, 202);
          throw Error(error.code);
        }
        await Promise.all([
          deliverEmail(db, config.mailer, "application_received", {
            id,
            name: data.name,
            email: data.email,
          }),
          deliverEmail(db, config.mailer, "application_notification", {
            id,
            name: "Founder House team",
            email: HOUSE_EMAIL,
            application: {
              id,
              name: data.name,
              email: data.email,
              phone: data.phone,
              role: data.role,
              organisation: data.organisation,
              title: data.title,
              city: data.city,
              linkedin: data.linkedin,
              about: data.about,
              offer: data.offer,
              ask: data.ask,
              interests: data.interests,
              referral: data.referral,
              source: data.source,
              hasCv: Boolean(file),
            },
          }),
        ]);
        return json({ received: true }, 202);
      }
      if (path === "/api/member/login" && method === "POST") {
        const b = await r.json();
        if (typeof b.access !== "string" || !/^[a-f0-9]{64}$/.test(b.access))
          return fail("This invitation is invalid.", 401);
        const m = result(
          await db
            .from("fh_applications")
            .select("id")
            .eq("member_token_hash", await hash(b.access))
            .eq("status", "approved")
            .gt("member_expires_at", now())
            .maybeSingle(),
        );
        return m
          ? json({ ok: true })
          : fail(
              "This invitation has expired or access has changed. Contact info@truvis.info.",
              401,
            );
      }
      if (path === "/api/member/logout" && method === "POST")
        return json({ ok: true });
      if (path === "/api/member" && method === "GET") {
        const m = await member(r, db);
        if (!m)
          return fail(
            "Open the private invitation sent by the Founder House team.",
            401,
          );
        const [events, rsvps] = await Promise.all([
          db
            .from("fh_events")
            .select("*")
            .eq("status", "published")
            .gt("ends_at", now())
            .order("starts_at"),
          db.from("fh_rsvps").select("event_id,status").eq("member_id", m.id),
        ]);
        const statuses = new Map(
          (result(rsvps) ?? []).map((x) => [x.event_id, x.status]),
        );
        return json({
          member: {
            id: m.id,
            name: m.name,
            role: m.role,
            organisation: m.organisation,
          },
          events: (result(events) ?? []).map((e) => ({
            ...e,
            rsvp_status: statuses.get(e.id) ?? null,
          })),
        });
      }
      if (/^\/api\/events\/[^/]+\/rsvp$/.test(path) && method === "POST") {
        const raw = r.headers.get("x-fh-member-token");
        if (!raw || !/^[a-f0-9]{64}$/.test(raw))
          return fail("Approved membership is required.", 403);
        const b = await r.json(),
          { data, error } = await db.rpc("fh_reserve_event", {
            p_event_id: path.split("/")[3],
            p_member_hash: await hash(raw),
            p_cancel: b.cancel === true,
          });
        if (error)
          return fail(
            "Your membership or this gathering is unavailable. Refresh your member room.",
            403,
          );
        return json({ status: data });
      }
      if (path.startsWith("/api/admin")) {
        const user = await admin(r, db);
        if (!user)
          return fail(
            "Sign in with an authorised TRUVIS organiser account.",
            403,
          );
        if (path === "/api/admin/email" && method === "GET") {
          const deliveries = result(
            await db
              .from("fh_email_deliveries")
              .select(
                "id,application_id,kind,recipient,status,created_at,updated_at",
              )
              .order("created_at", { ascending: false })
              .limit(50),
          );
          return json({
            email: {
              configured: config.mailer?.configured ?? false,
              missing: config.mailer?.missing ?? ["SMTP connection"],
              from: EMAIL_FROM,
              replyTo: HOUSE_EMAIL,
              testRecipient: HOUSE_EMAIL,
              deliveries: deliveries ?? [],
            },
          });
        }
        if (path === "/api/admin/email/test" && method === "POST") {
          const allowed = result(
            await db.rpc("fh_take_rate_slot", {
              p_key: "email-test:" + new Date().toISOString().slice(0, 13),
              p_limit: 6,
            }),
          );
          if (!allowed)
            return fail(
              "Please wait before sending another test. Six tests are allowed per hour.",
              429,
            );
          const email = await deliverEmail(db, config.mailer, "test", {
            name: "TRUVIS team",
            email: HOUSE_EMAIL,
          });
          return json({ emailResult: email });
        }
        if (path === "/api/admin/applications" && method === "GET") {
          const rows = result(
            await db
              .from("fh_applications")
              .select(
                "id,name,email,phone,role,organisation,title,city,linkedin,cv_key,about,offer,ask,interests,referral,source,updates_consent,status,created_at,reviewed_at",
              )
              .order("created_at", { ascending: false })
              .limit(1000),
          );
          return json({ applications: rows ?? [] });
        }
        if (
          /^\/api\/admin\/applications\/[^/]+\/cv$/.test(path) &&
          method === "GET"
        ) {
          const row = result(
            await db
              .from("fh_applications")
              .select("cv_key")
              .eq("id", path.split("/")[4])
              .maybeSingle(),
          );
          if (!row?.cv_key) return fail("CV not found.", 404);
          const { data, error } = await db.storage
            .from("founder-house-cvs")
            .download(row.cv_key);
          if (error || !data) return fail("CV not found.", 404);
          return new Response(data, {
            headers: {
              "content-type": "application/pdf",
              "content-disposition": "attachment; filename=member-cv.pdf",
              "cache-control": "no-store",
              "x-content-type-options": "nosniff",
            },
          });
        }
        if (
          /^\/api\/admin\/applications\/[^/]+$/.test(path) &&
          method === "PATCH"
        ) {
          const b = await r.json();
          if (
            !["approved", "pending", "waitlisted", "declined"].includes(
              b.status,
            )
          )
            return fail("Invalid status.");
          const recipient =
            b.status === "approved"
              ? result(
                  await db
                    .from("fh_applications")
                    .select("id,name,email")
                    .eq("id", path.split("/")[4])
                    .maybeSingle(),
                )
              : null;
          if (b.status === "approved" && !recipient)
            return fail("Application not found.", 404);
          const access = b.status === "approved" ? token() : null,
            expires = access
              ? new Date(Date.now() + 30 * 86400000).toISOString()
              : null;
          const { error } = await db.rpc("fh_review_application", {
            p_id: path.split("/")[4],
            p_status: b.status,
            p_hash: access ? await hash(access) : null,
            p_expires: expires,
            p_reviewer: user.id,
          });
          if (error) return fail("The application could not be updated.", 400);
          const inviteUrl = access
            ? HOUSE_URL + "/members#access=" + access
            : null;
          let emailResult;
          if (inviteUrl && recipient) {
            emailResult = await deliverEmail(
              db,
              config.mailer,
              "member_invitation",
              recipient,
              inviteUrl,
            );
          }
          return json({
            ok: true,
            inviteUrl,
            expiresAt: expires,
            emailResult,
          });
        }
        if (path === "/api/admin/events" && method === "GET") {
          const [events, rsvps] = await Promise.all([
            db
              .from("fh_events")
              .select("*")
              .order("starts_at", { ascending: false }),
            db
              .from("fh_rsvps")
              .select("event_id,status")
              .neq("status", "cancelled"),
          ]);
          const rows = result(rsvps) ?? [];
          return json({
            events: (result(events) ?? []).map((e) => ({
              ...e,
              confirmed: rows.filter(
                (x) => x.event_id === e.id && x.status === "confirmed",
              ).length,
              waitlisted: rows.filter(
                (x) => x.event_id === e.id && x.status === "waitlisted",
              ).length,
            })),
          });
        }
        if (path === "/api/admin/events" && method === "POST") {
          let event;
          try {
            event = eventData(await r.json());
          } catch (e) {
            return fail((e as Error).message);
          }
          const row = result(
            await db
              .from("fh_events")
              .insert({ ...event, created_by: user.id })
              .select("id")
              .single(),
          );
          if (!row) throw Error("event_not_created");
          const distribution =
            event.status === "published"
              ? await savedDistribution(row.id)
              : null;
          return json({ ...row, distribution }, 201);
        }
        if (
          /^\/api\/admin\/events\/[^/]+\/attendees$/.test(path) &&
          method === "GET"
        ) {
          const rows = result(
            await db
              .from("fh_rsvps")
              .select(
                "status,member:fh_applications(id,name,email,role,organisation)",
              )
              .eq("event_id", path.split("/")[4])
              .order("created_at"),
          );
          return json({
            attendees: (rows ?? []).map((r: Row) => ({
              ...r.member,
              status: r.status,
            })),
          });
        }
        if (/^\/api\/admin\/events\/[^/]+$/.test(path) && method === "PATCH") {
          const b = await r.json();
          if (!["draft", "published", "cancelled"].includes(b.status))
            return fail("Invalid status.");
          const id = path.split("/")[4];
          const existing = result(
            await db.from("fh_events").select("*").eq("id", id).maybeSingle(),
          );
          if (!existing) return fail("Event not found.", 404);
          if (
            b.status === "published" &&
            new Date(existing.starts_at).getTime() <= Date.now()
          )
            return fail("Only future events can be published.");
          let changes: Record<string, unknown> = { status: b.status };
          if ("title" in b) {
            try {
              changes = eventData(b);
            } catch (error) {
              return fail((error as Error).message);
            }
            if (existing.status === "cancelled")
              return fail(
                "Cancelled events cannot be edited. Create a new event instead.",
              );
            if (Number(changes.capacity) < existing.capacity)
              return fail(
                "Capacity can only be increased after an event is created. Contact the team to move confirmed bookings first.",
              );
          }
          result(await db.from("fh_events").update(changes).eq("id", id));
          return json({ ok: true, distribution: await savedDistribution(id) });
        }
        if (path === "/api/admin/distribution" && method === "GET") {
          const jobs = result(
            await db
              .from("fh_distribution_jobs")
              .select("*")
              .order("updated_at", { ascending: false })
              .limit(100),
          );
          return json({
            channels: channelConfig(config),
            jobs,
          });
        }
        if (
          /^\/api\/admin\/events\/[^/]+\/distribute$/.test(path) &&
          method === "POST"
        )
          return json(await distributeEvent(db, config, path.split("/")[4]));
        if (
          /^\/api\/admin\/events\/[^/]+\/distribution-receipt$/.test(path) &&
          method === "POST"
        ) {
          try {
            await reconcilePublication(db, path.split("/")[4], await r.json());
          } catch (error) {
            return fail((error as Error).message);
          }
          return json({ ok: true });
        }
      }
      return fail("Not found.", 404);
    } catch {
      console.error("Founder House request failed", {
        path: r.headers.get("x-fh-path"),
        method: r.method,
      });
      return fail(
        "We could not complete that request. Please try again or contact info@truvis.info.",
        503,
      );
    }
  };
}
