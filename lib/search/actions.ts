"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeParams,
  describeSearch,
  searchToHref,
  type SearchKind,
} from "./saved";

function readKind(formData: FormData): SearchKind {
  return formData.get("kind") === "marketplace" ? "marketplace" : "directory";
}

// Run the search once at save time to seed seen_keys — so the first digest only
// fires on results that appear AFTER the search was saved, never the existing set.
async function currentKeys(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kind: SearchKind,
  params: Record<string, string | undefined>,
): Promise<string[]> {
  if (kind === "directory") {
    const { data } = await supabase.rpc("search_orgs", {
      p_query: params.q ?? null,
      p_industry: params.industry ?? null,
      p_jurisdiction: params.jurisdiction ?? null,
    });
    return ((data ?? []) as { slug: string }[]).map((r) => r.slug);
  }
  const { data } = await supabase.rpc("get_public_listings", {
    p_query: params.q ?? null,
    p_type: params.type ?? null,
    p_sector: params.sector ?? null,
    p_region: params.region ?? null,
  });
  return ((data ?? []) as { id: string }[]).map((r) => r.id);
}

export async function saveSearch(formData: FormData) {
  const kind = readKind(formData);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const params = normalizeParams(kind, {
    q: formData.get("q") as string,
    industry: formData.get("industry") as string,
    jurisdiction: formData.get("jurisdiction") as string,
    type: formData.get("type") as string,
    sector: formData.get("sector") as string,
    region: formData.get("region") as string,
  });
  const backHref = searchToHref(kind, params);
  if (!user) redirect(`/login?next=${encodeURIComponent(backHref)}`);

  const seen = await currentKeys(supabase, kind, params);
  const { error } = await supabase.from("saved_searches").insert({
    user_id: user.id,
    kind,
    label: describeSearch(kind, params),
    params,
    seen_keys: seen,
  });
  if (error) redirect(`${backHref}${backHref.includes("?") ? "&" : "?"}saved_error=1`);
  revalidatePath("/dashboard/saved-searches");
  redirect(`${backHref}${backHref.includes("?") ? "&" : "?"}saved=1`);
}

export async function deleteSavedSearch(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/saved-searches");
  await supabase.from("saved_searches").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard/saved-searches");
  redirect("/dashboard/saved-searches");
}

export async function toggleSearchAlerts(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const enabled = formData.get("enabled") === "1";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/saved-searches");
  await supabase
    .from("saved_searches")
    .update({ alerts_enabled: enabled })
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/dashboard/saved-searches");
  redirect("/dashboard/saved-searches");
}
