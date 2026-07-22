"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getManagedOrg } from "@/lib/orgs/queries";

async function requireContentManager(nextPath: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  const org = await getManagedOrg(supabase, user.id);
  if (!org || !org.canManageContent) redirect("/dashboard");
  return { supabase, org, userId: user.id };
}

export async function createPost(formData: FormData) {
  const { supabase, org, userId } = await requireContentManager("/dashboard/posts");
  const title = String(formData.get("title") ?? "").trim();
  const text = String(formData.get("body") ?? "").trim();
  if (!title || !text) redirect("/dashboard/posts?error=Title%20and%20body%20are%20required");

  const publish = formData.get("publish") === "1";
  const { error } = await supabase.from("posts").insert({
    org_id: org.id,
    title,
    body: { text },
    status: publish ? "published" : "draft",
    published_at: publish ? new Date().toISOString() : null,
    created_by: userId,
  });

  if (error) redirect(`/dashboard/posts?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/orgs/${org.slug}`);
  revalidatePath("/feed");
  redirect("/dashboard/posts?saved=1");
}

export async function setPostStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const publish = formData.get("status") === "published";
  const { supabase, org } = await requireContentManager("/dashboard/posts");

  const { error } = await supabase
    .from("posts")
    .update({
      status: publish ? "published" : "draft",
      published_at: publish ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("org_id", org.id);

  if (error) redirect(`/dashboard/posts?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/orgs/${org.slug}`);
  revalidatePath("/feed");
  redirect("/dashboard/posts?saved=1");
}

export async function deletePost(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { supabase, org } = await requireContentManager("/dashboard/posts");

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id)
    .eq("org_id", org.id);

  if (error) redirect(`/dashboard/posts?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/orgs/${org.slug}`);
  revalidatePath("/feed");
  redirect("/dashboard/posts?saved=1");
}
