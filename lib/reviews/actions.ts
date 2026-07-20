"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Community reviews on organization profiles: one review (1–5 stars +
// comment) per user per org. RLS enforces visibility, self-authorship, and
// the members-cannot-review-their-own-org rule; the unique(org_id,
// reviewer_id) constraint makes create-and-edit a single upsert.
export async function submitReview(formData: FormData) {
  const orgId = String(formData.get("org_id") ?? "");
  const orgSlug = String(formData.get("org_slug") ?? "");
  const back = `/orgs/${orgSlug}`;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(back)}`);

  const rating = Number(formData.get("rating"));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    redirect(`${back}?error=${encodeURIComponent("Pick a rating from 1 to 5 stars.")}`);
  }
  const comment = String(formData.get("comment") ?? "").trim();
  if (comment.length > 2000) {
    redirect(`${back}?error=${encodeURIComponent("Comments are limited to 2000 characters.")}`);
  }

  const { error } = await supabase.from("org_reviews").upsert(
    {
      org_id: orgId,
      reviewer_id: user.id,
      rating,
      comment: comment || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id,reviewer_id" },
  );

  if (error) {
    const message =
      error.code === "42501"
        ? "Members cannot review their own organization."
        : error.message;
    redirect(`${back}?error=${encodeURIComponent(message)}`);
  }
  revalidatePath(back);
  revalidatePath("/directory");
  revalidatePath("/");
  redirect(`${back}?reviewed=1#reviews`);
}

export async function deleteMyReview(formData: FormData) {
  const reviewId = String(formData.get("review_id") ?? "");
  const orgSlug = String(formData.get("org_slug") ?? "");
  const back = `/orgs/${orgSlug}`;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(back)}`);

  // RLS "author deletes own review" scopes the delete to the caller's row.
  const { error } = await supabase.from("org_reviews").delete().eq("id", reviewId);

  if (error) redirect(`${back}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(back);
  revalidatePath("/directory");
  revalidatePath("/");
  redirect(`${back}#reviews`);
}

// Report a review for moderation — same queue as post reports.
export async function reportReview(formData: FormData) {
  const reviewId = String(formData.get("review_id") ?? "");
  const orgSlug = String(formData.get("org_slug") ?? "");
  const back = `/orgs/${orgSlug}`;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(back)}`);

  const { error } = await supabase.from("content_reports").insert({
    review_id: reviewId,
    reporter_id: user.id,
    reason: String(formData.get("reason") ?? "").trim() || "Not specified",
  });

  if (error) redirect(`${back}?error=${encodeURIComponent(error.message)}`);
  redirect(`${back}?reported=1#reviews`);
}
