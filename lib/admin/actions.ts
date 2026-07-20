"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("platform_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.platform_admin) redirect("/dashboard");
  return { supabase, userId: user.id };
}

export async function setOrgSuspension(formData: FormData) {
  const { supabase } = await requireAdmin();
  const orgId = String(formData.get("org_id") ?? "");
  const suspend = formData.get("suspend") === "1";
  const reason = String(formData.get("reason") ?? "").trim();
  if (suspend && !reason) {
    redirect("/admin?error=A%20reason%20is%20required%20to%20suspend");
  }

  const { error } = await supabase.rpc("admin_set_org_suspension", {
    p_org_id: orgId,
    p_suspend: suspend,
    p_reason: reason || null,
  });
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/directory");
  redirect("/admin?saved=1");
}

export async function resolveReport(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const reportId = String(formData.get("report_id") ?? "");
  const postId = String(formData.get("post_id") ?? "");
  const reviewId = String(formData.get("review_id") ?? "");
  const action = String(formData.get("action") ?? "");
  const target = String(formData.get("target") ?? "post");

  if (action === "remove") {
    if (target === "review") {
      // Archive the review through the audit-logged RPC.
      const { error: reviewError } = await supabase.rpc("admin_remove_review", {
        p_review_id: reviewId,
        p_reason: "Removed via moderation queue",
      });
      if (reviewError) redirect(`/admin?error=${encodeURIComponent(reviewError.message)}`);
    } else {
      // Archive the offending post, then mark the report resolved.
      const { error: postError } = await supabase
        .from("posts")
        .update({ status: "archived", updated_at: new Date().toISOString() })
        .eq("id", postId);
      if (postError) redirect(`/admin?error=${encodeURIComponent(postError.message)}`);
    }
  }

  const { error } = await supabase
    .from("content_reports")
    .update({
      status: action === "remove" ? "resolved" : "dismissed",
      resolved_by: userId,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId);
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/feed");
  revalidatePath("/directory");
  redirect("/admin?saved=1");
}

export async function grantCompSubscription(formData: FormData) {
  const { supabase } = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim();
  const { error } = await supabase.rpc("admin_grant_subscription", {
    p_email: email,
  });
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  redirect("/admin?saved=1");
}

export async function revokeSubscription(formData: FormData) {
  const { supabase } = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim();
  const { error } = await supabase.rpc("admin_revoke_subscription", {
    p_email: email,
  });
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  redirect("/admin?saved=1");
}
