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
  redirect("/dashboard/catalog");
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
  redirect("/dashboard/catalog");
}
