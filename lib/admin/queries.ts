import type { SupabaseClient } from "@supabase/supabase-js";

export async function isPlatformAdmin(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("user_profiles")
    .select("platform_admin")
    .eq("id", userId)
    .maybeSingle();
  return Boolean(data?.platform_admin);
}
