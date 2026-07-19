import type { SupabaseClient } from "@supabase/supabase-js";

// Returns the org the signed-in user manages (owner/admin/member), or null.
// Single-org assumption for now — the UI takes the first membership.
export async function getManagedOrg(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("org_members")
    .select("role, can_manage_content, organizations(id, slug, legal_name, tagline, description, website, is_visible)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!data?.organizations) return null;
  const org = data.organizations as unknown as {
    id: string;
    slug: string;
    legal_name: string;
    tagline: string | null;
    description: string | null;
    website: string | null;
    is_visible: boolean;
  };
  return {
    ...org,
    role: data.role as string,
    canManageContent: Boolean(data.can_manage_content),
  };
}

// Compliance-sync staleness check (admin dashboard warning band).
export function isSyncStale(
  syncedAt: string | null | undefined,
  hours: number,
): boolean {
  if (!syncedAt) return true;
  return Date.parse(syncedAt) < Date.now() - hours * 60 * 60 * 1000;
}

export function slugifyText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
