"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getManagedOrg, slugifyText } from "@/lib/orgs/queries";

async function requireEventManager(nextPath: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  const org = await getManagedOrg(supabase, user.id);
  if (!org) redirect("/dashboard");
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
    starts_at: startsAt ? new Date(startsAt).toISOString() : null,
    ends_at: endsAt ? new Date(endsAt).toISOString() : null,
    capacity: capacityRaw ? Number(capacityRaw) : null,
    registration_deadline: deadline ? new Date(deadline).toISOString() : null,
    approval_mode: formData.get("approval_mode") === "auto" ? "auto" : "manual",
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

  const { error } = await supabase.from("events").insert({
    org_id: org.id,
    slug,
    ...fields,
  });

  if (error) redirect(`/dashboard/events?error=${encodeURIComponent(error.message)}`);
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
  revalidatePath("/events");
  redirect("/dashboard/events");
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
  const { supabase } = await requireEventManager(`/dashboard/events/${eventId}`);

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
      .eq("id", registrationId);
    if (error) {
      redirect(`/dashboard/events/${eventId}?error=${encodeURIComponent(error.message)}`);
    }
  }
  redirect(`/dashboard/events/${eventId}`);
}
