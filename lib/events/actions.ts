"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getManagedOrg, slugifyText } from "@/lib/orgs/queries";
import { parseGstLocalInput } from "@/lib/format";
import { syncEventToLuma } from "@/lib/luma/sync";

async function requireEventManager(nextPath: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  const org = await getManagedOrg(supabase, user.id);
  if (!org) redirect("/dashboard");
  if (!org.canManageEvents) redirect("/dashboard?error=You%20do%20not%20have%20permission%20to%20manage%20events");
  return { supabase, org, userId: user.id };
}

function parseEventFields(formData: FormData) {
  const startsAt = String(formData.get("starts_at") ?? "");
  const endsAt = String(formData.get("ends_at") ?? "");
  const capacityRaw = String(formData.get("capacity") ?? "").trim();
  const deadline = String(formData.get("registration_deadline") ?? "").trim();
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    venue_address: String(formData.get("venue_address") ?? "").trim() || null,
    online_url: String(formData.get("online_url") ?? "").trim() || null,
    // datetime-local values are entered as GST wall-clock (fixed UTC+4) —
    // never parse them in the server's timezone.
    starts_at: parseGstLocalInput(startsAt),
    ends_at: parseGstLocalInput(endsAt),
    capacity: capacityRaw ? Number(capacityRaw) : null,
    registration_deadline: parseGstLocalInput(deadline),
    approval_mode: formData.get("approval_mode") === "auto" ? "auto" : "manual",
    luma_publish: formData.get("luma_publish") === "on",
  };
}

export async function createEvent(formData: FormData) {
  const { supabase, org } = await requireEventManager("/dashboard/events");
  const fields = parseEventFields(formData);
  if (!fields.title || !fields.starts_at || !fields.ends_at) {
    redirect("/dashboard/events?error=Title%2C%20start%20and%20end%20are%20required");
  }
  if (fields.ends_at <= fields.starts_at) {
    redirect("/dashboard/events?error=End%20must%20be%20after%20start");
  }

  const baseSlug = slugifyText(fields.title) || "event";
  let slug = baseSlug;
  for (let n = 2; n < 50; n++) {
    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${n}`;
  }

  const { data: inserted, error } = await supabase
    .from("events")
    .insert({
      org_id: org.id,
      slug,
      ...fields,
    })
    .select("id")
    .single();

  if (error) redirect(`/dashboard/events?error=${encodeURIComponent(error.message)}`);
  if (inserted?.id) await syncEventToLuma(supabase, inserted.id);
  revalidatePath("/events");
  redirect("/dashboard/events?saved=1");
}

export async function updateEvent(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { supabase, org } = await requireEventManager(`/dashboard/events/${id}`);
  const fields = parseEventFields(formData);
  if (!fields.title || !fields.starts_at || !fields.ends_at) {
    redirect(`/dashboard/events/${id}?error=Title%2C%20start%20and%20end%20are%20required`);
  }

  const { error } = await supabase
    .from("events")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", org.id);

  if (error) redirect(`/dashboard/events/${id}?error=${encodeURIComponent(error.message)}`);
  await syncEventToLuma(supabase, id);
  revalidatePath("/events");
  redirect(`/dashboard/events/${id}?saved=1`);
}

export async function setEventStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["draft", "published", "cancelled", "completed"].includes(status)) {
    redirect("/dashboard/events");
  }
  const { supabase, org } = await requireEventManager("/dashboard/events");

  const { error } = await supabase
    .from("events")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", org.id);

  if (error) redirect(`/dashboard/events?error=${encodeURIComponent(error.message)}`);
  await syncEventToLuma(supabase, id);
  revalidatePath("/events");
  redirect("/dashboard/events?saved=1");
}

// Re-run a failed Luma push from the dashboard.
export async function retryLumaSync(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { supabase } = await requireEventManager("/dashboard/events");
  await syncEventToLuma(supabase, id);
  revalidatePath("/events");
  redirect("/dashboard/events?saved=1");
}

// --- Attendee side -----------------------------------------------------------

export async function registerForEvent(formData: FormData) {
  const eventSlug = String(formData.get("event_slug") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/events/${eventSlug}`)}`);

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("slug", eventSlug)
    .maybeSingle();
  if (!event) redirect("/events");

  // Status is decided by the guard trigger (auto -> approved, manual -> pending).
  const { error } = await supabase.from("event_registrations").insert({
    event_id: event.id,
    user_id: user.id,
    answers: {},
  });

  if (error) {
    const message = error.code === "23505" ? "You are already registered." : error.message;
    redirect(`/events/${eventSlug}?error=${encodeURIComponent(message)}`);
  }
  redirect(`/events/${eventSlug}?registered=1`);
}

export async function cancelRegistration(formData: FormData) {
  const eventSlug = String(formData.get("event_slug") ?? "");
  const registrationId = String(formData.get("registration_id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("event_registrations")
    .update({ status: "cancelled" })
    .eq("id", registrationId)
    .eq("user_id", user.id);

  redirect(eventSlug ? `/events/${eventSlug}` : "/dashboard");
}

// --- Organizer decisions -----------------------------------------------------

export async function decideRegistration(formData: FormData) {
  const registrationId = String(formData.get("registration_id") ?? "");
  const eventId = String(formData.get("event_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const { supabase, org } = await requireEventManager(`/dashboard/events/${eventId}`);

  // Explicit ownership check on top of RLS: the registration must belong to
  // an event of the caller's org.
  const { data: ownedEvent } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("org_id", org.id)
    .maybeSingle();
  if (!ownedEvent) redirect("/dashboard/events");

  if (decision === "approve") {
    // Capacity-safe approval via SECURITY DEFINER RPC (migration 0005).
    const { error } = await supabase.rpc("approve_registration", {
      p_registration_id: registrationId,
    });
    if (error) {
      redirect(`/dashboard/events/${eventId}?error=${encodeURIComponent(error.message)}`);
    }
  } else {
    const { error } = await supabase
      .from("event_registrations")
      .update({
        status: "rejected",
        decided_at: new Date().toISOString(),
      })
      .eq("id", registrationId)
      .eq("event_id", eventId);
    if (error) {
      redirect(`/dashboard/events/${eventId}?error=${encodeURIComponent(error.message)}`);
    }
  }
  redirect(`/dashboard/events/${eventId}`);
}
