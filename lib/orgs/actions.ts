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

  const { error } = await supabase
    .from("organizations")
    .update({
      tagline: String(formData.get("tagline") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      website: website || null,
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
