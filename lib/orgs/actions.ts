"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getManagedOrg } from "./queries";

// Marketing fields only — verified fields stay read-only (PRD DIR-2/DIR-3).
export async function updateOrgProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/profile");

  const org = await getManagedOrg(supabase, user.id);
  if (!org) redirect("/dashboard");

  const website = String(formData.get("website") ?? "").trim();
  if (website && !/^https?:\/\//i.test(website)) {
    redirect(`/dashboard/profile?error=${encodeURIComponent("Website must start with http:// or https://")}`);
  }

  const socials = {
    linkedin: String(formData.get("linkedin") ?? "").trim() || undefined,
    x: String(formData.get("x") ?? "").trim() || undefined,
    instagram: String(formData.get("instagram") ?? "").trim() || undefined,
  };

  const { error } = await supabase
    .from("organizations")
    .update({
      tagline: String(formData.get("tagline") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      website: website || null,
      social_links: JSON.parse(JSON.stringify(socials)),
      updated_at: new Date().toISOString(),
    })
    .eq("id", org.id);

  if (error) {
    redirect(`/dashboard/profile?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath(`/orgs/${org.slug}`);
  revalidatePath("/directory");
  redirect("/dashboard/profile?saved=1");
}

// Org branding upload (DIR-3): logo/cover into the public-media bucket under
// org/<org_id>/… — the storage RLS policy (migration 0008) enforces membership.
export async function uploadOrgImage(formData: FormData) {
  const kind = formData.get("kind") === "cover" ? "cover" : "logo";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/profile");
  const org = await getManagedOrg(supabase, user.id);
  if (!org) redirect("/dashboard");

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    redirect("/dashboard/profile?error=Choose%20an%20image%20file");
  }
  if (file.size > 5 * 1024 * 1024) {
    redirect("/dashboard/profile?error=Image%20must%20be%20under%205MB");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `org/${org.id}/${kind}-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("public-media")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) {
    redirect(`/dashboard/profile?error=${encodeURIComponent(uploadError.message)}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("public-media").getPublicUrl(path);

  const { error } = await supabase
    .from("organizations")
    .update({
      [kind === "cover" ? "cover_url" : "logo_url"]: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", org.id);
  if (error) {
    redirect(`/dashboard/profile?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath(`/orgs/${org.slug}`);
  revalidatePath("/directory");
  redirect("/dashboard/profile?saved=1");
}

// Follow / unfollow (DIR-8) — RLS "user manages own follows".
export async function toggleFollow(formData: FormData) {
  const orgId = String(formData.get("org_id") ?? "");
  const orgSlug = String(formData.get("org_slug") ?? "");
  const following = formData.get("following") === "1";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/orgs/${orgSlug}`);

  if (following) {
    await supabase
      .from("org_follows")
      .delete()
      .eq("org_id", orgId)
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("org_follows")
      .insert({ org_id: orgId, user_id: user.id })
      .select()
      .maybeSingle();
  }
  revalidatePath(`/orgs/${orgSlug}`);
  redirect(`/orgs/${orgSlug}`);
}
