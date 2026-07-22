"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getManagedOrg, slugifyText } from "@/lib/orgs/queries";

async function requireContentManager(nextPath: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  const org = await getManagedOrg(supabase, user.id);
  if (!org || !org.canManageContent) redirect("/dashboard");
  return { supabase, org };
}

export async function createCatalogItem(formData: FormData) {
  const { supabase, org } = await requireContentManager("/dashboard/catalog");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/dashboard/catalog?error=Name%20is%20required");

  const baseSlug = slugifyText(name) || "item";
  // Suffix on collision within the org.
  let slug = baseSlug;
  for (let n = 2; n < 50; n++) {
    const { data: existing } = await supabase
      .from("catalog_items")
      .select("id")
      .eq("org_id", org.id)
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${n}`;
  }

  const { error } = await supabase.from("catalog_items").insert({
    org_id: org.id,
    slug,
    name,
    item_type: formData.get("item_type") === "product" ? "product" : "service",
    category: String(formData.get("category") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    price_indication: String(formData.get("price_indication") ?? "").trim() || null,
  });

  if (error) redirect(`/dashboard/catalog?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/orgs/${org.slug}`);
  redirect("/dashboard/catalog?saved=1");
}

export async function updateCatalogItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { supabase, org } = await requireContentManager(`/dashboard/catalog/${id}`);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect(`/dashboard/catalog/${id}?error=Name%20is%20required`);

  const { error } = await supabase
    .from("catalog_items")
    .update({
      name,
      item_type: formData.get("item_type") === "product" ? "product" : "service",
      category: String(formData.get("category") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      price_indication: String(formData.get("price_indication") ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("org_id", org.id);

  if (error) redirect(`/dashboard/catalog/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/orgs/${org.slug}`);
  redirect(`/dashboard/catalog/${id}?saved=1`);
}

export async function setCatalogItemStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = formData.get("status") === "published" ? "published" : "draft";
  const { supabase, org } = await requireContentManager("/dashboard/catalog");

  const { error } = await supabase
    .from("catalog_items")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", org.id);

  if (error) redirect(`/dashboard/catalog?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/orgs/${org.slug}`);
  redirect("/dashboard/catalog?saved=1");
}

// Catalog item image upload (CAT-2) into public-media/org/<org_id>/…;
// the storage RLS policy from migration 0008 enforces membership.
export async function uploadCatalogImage(formData: FormData) {
  const itemId = String(formData.get("item_id") ?? "");
  const { supabase, org } = await requireContentManager("/dashboard/catalog");

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    redirect("/dashboard/catalog?error=Choose%20an%20image%20file");
  }
  if (file.size > 5 * 1024 * 1024) {
    redirect("/dashboard/catalog?error=Image%20must%20be%20under%205MB");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `org/${org.id}/catalog/${itemId}-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("public-media")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) {
    redirect(`/dashboard/catalog?error=${encodeURIComponent(uploadError.message)}`);
  }

  const { error } = await supabase.from("catalog_media").insert({
    item_id: itemId,
    media_type: "image",
    storage_path: path,
  });
  if (error) redirect(`/dashboard/catalog?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/orgs/${org.slug}`);
  redirect("/dashboard/catalog?saved=1");
}

export async function deleteCatalogItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { supabase, org } = await requireContentManager("/dashboard/catalog");

  const { error } = await supabase
    .from("catalog_items")
    .delete()
    .eq("id", id)
    .eq("org_id", org.id);

  if (error) redirect(`/dashboard/catalog?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/orgs/${org.slug}`);
  redirect("/dashboard/catalog?saved=1");
}
