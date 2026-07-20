import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { SiteHeaderClient } from "./site-header-client";

// Server wrapper: resolves auth state once per request and passes a plain
// object to the interactive client shell.
export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let headerUser = null;
  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("display_name, platform_admin")
      .eq("id", user.id)
      .maybeSingle();
    headerUser = {
      email: user.email ?? "",
      displayName: profile?.display_name || user.email?.split("@")[0] || "Account",
      isAdmin: Boolean(profile?.platform_admin),
    };
  }

  return <SiteHeaderClient user={headerUser} signOutAction={signOut} />;
}
