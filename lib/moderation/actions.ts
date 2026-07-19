"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Report a post for moderation (PRD POST-3).
export async function reportPost(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/feed");

  const { error } = await supabase.from("content_reports").insert({
    post_id: postId,
    reporter_id: user.id,
    reason: String(formData.get("reason") ?? "").trim() || "Not specified",
  });

  if (error) redirect(`/feed?error=${encodeURIComponent(error.message)}`);
  redirect("/feed?reported=1");
}
