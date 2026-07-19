"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect(String(formData.get("next") || "/dashboard"));
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback`,
      data: { display_name: String(formData.get("display_name") ?? "") },
    },
  });
  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/signup?sent=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
