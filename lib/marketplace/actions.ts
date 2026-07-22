"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getManagedOrg } from "@/lib/orgs/queries";

async function requireOwner(nextPath: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  const org = await getManagedOrg(supabase, user.id);
  if (!org || org.role !== "owner") redirect("/dashboard");
  return { supabase, org, userId: user.id };
}

function parseListingFields(formData: FormData) {
  const type = String(formData.get("listing_type") ?? "");
  const amount = String(formData.get("amount_sought") ?? "").trim();
  const equity = String(formData.get("equity_percent") ?? "").trim();
  return {
    listing_type: ["fundraise", "equity_sale", "business_sale"].includes(type)
      ? type
      : "fundraise",
    teaser_headline: String(formData.get("teaser_headline") ?? "").trim(),
    sector: String(formData.get("sector") ?? "").trim() || null,
    region: String(formData.get("region") ?? "").trim() || null,
    size_band: String(formData.get("size_band") ?? "").trim() || null,
    teaser_summary: String(formData.get("teaser_summary") ?? "").trim() || null,
    reveal_identity: formData.get("reveal_identity") === "on",
    detail_memorandum: {
      text: String(formData.get("detail_memorandum") ?? "").trim(),
    },
    amount_sought: amount ? Number(amount) : null,
    equity_percent: equity ? Number(equity) : null,
    financial_snapshot: {
      revenue_band: String(formData.get("revenue_band") ?? "").trim() || null,
      employees: String(formData.get("employees") ?? "").trim() || null,
      profitable: formData.get("profitable") === "on",
      year: new Date().getFullYear(),
    },
  };
}

export async function createListing(formData: FormData) {
  const { supabase, org, userId } = await requireOwner("/dashboard/listings");
  const fields = parseListingFields(formData);
  if (!fields.teaser_headline) {
    redirect("/dashboard/listings?error=Headline%20is%20required");
  }
  if (formData.get("attestation") !== "on") {
    redirect(
      "/dashboard/listings?error=You%20must%20attest%20that%20the%20information%20is%20accurate",
    );
  }

  const { error } = await supabase.from("marketplace_listings").insert({
    org_id: org.id,
    ...fields,
    attestation_accepted_at: new Date().toISOString(),
    created_by: userId,
  });

  if (error) redirect(`/dashboard/listings?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/marketplace");
  redirect("/dashboard/listings?saved=1");
}

// Edit an existing listing (MKT-1 completeness). Row scoping via the
// "owner manages listings" RLS policy.
export async function updateListing(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { supabase } = await requireOwner(`/dashboard/listings/${id}`);
  const fields = parseListingFields(formData);
  if (!fields.teaser_headline) {
    redirect(`/dashboard/listings/${id}?error=Headline%20is%20required`);
  }

  const { error } = await supabase
    .from("marketplace_listings")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) redirect(`/dashboard/listings/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/marketplace");
  redirect(`/dashboard/listings/${id}?saved=1`);
}

export async function setListingStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["draft", "active", "paused", "closed"].includes(status)) {
    redirect("/dashboard/listings");
  }
  const { supabase } = await requireOwner("/dashboard/listings");

  // Row scoping comes from the "owner manages listings" RLS policy; org_id is
  // no longer API-referenceable after the 0007 anonymity hardening.
  const { error } = await supabase
    .from("marketplace_listings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) redirect(`/dashboard/listings?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/marketplace");
  redirect("/dashboard/listings?saved=1");
}

// --- Subscriber side ---------------------------------------------------------

export async function applyToReview(formData: FormData) {
  const listingId = String(formData.get("listing_id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/marketplace/${listingId}`);

  if (formData.get("confidentiality") !== "on") {
    redirect(
      `/marketplace/${listingId}?error=${encodeURIComponent("You must accept the confidentiality terms.")}`,
    );
  }

  // RLS "subscriber applies" enforces the active subscription server-side.
  const { error } = await supabase.from("listing_applications").insert({
    listing_id: listingId,
    applicant_id: user.id,
    intro_message: String(formData.get("intro_message") ?? "").trim() || null,
    confidentiality_accepted_at: new Date().toISOString(),
  });

  if (error) {
    const message =
      error.code === "23505"
        ? "You already applied to review this listing."
        : error.code === "42501"
          ? "An active subscription is required to apply — see /pricing."
          : error.message;
    redirect(`/marketplace/${listingId}?error=${encodeURIComponent(message)}`);
  }
  redirect(`/marketplace/${listingId}?applied=1`);
}

// --- Owner decisions ---------------------------------------------------------

export async function decideApplication(formData: FormData) {
  const applicationId = String(formData.get("application_id") ?? "");
  const decision = formData.get("decision") === "approve" ? "approved" : "rejected";
  const { supabase, userId } = await requireOwner("/dashboard/listings");

  const { error } = await supabase
    .from("listing_applications")
    .update({
      status: decision,
      decided_by: userId,
      decided_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (error) redirect(`/dashboard/listings?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard/listings?saved=1");
}

// --- Messaging (approved applications only; RLS-enforced) --------------------

export async function sendListingMessage(formData: FormData) {
  const applicationId = String(formData.get("application_id") ?? "");
  // Allow-listed same as toggleFollow's return_to — never redirect to an
  // arbitrary form-supplied target.
  const backRaw = String(formData.get("back") ?? "");
  const back =
    backRaw.startsWith("/dashboard/applications") ||
    backRaw.startsWith("/dashboard/listings")
      ? backRaw
      : "/dashboard/applications";
  const body = String(formData.get("body") ?? "").trim();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!body) redirect(back);

  const { error } = await supabase.from("listing_messages").insert({
    application_id: applicationId,
    sender_id: user.id,
    body,
  });

  if (error) redirect(`${back}?error=${encodeURIComponent(error.message)}`);
  redirect(back);
}
