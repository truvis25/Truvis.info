"use server";
import { redirect } from "next/navigation";
import { serverClient } from "../../lib/supabase";
export async function signIn(form: FormData) {
  const email = String(form.get("email") ?? "").trim(),
    password = String(form.get("password") ?? "");
  if (!email || !password)
    redirect("/login?error=Please%20enter%20your%20email%20and%20password");
  const client = await serverClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error)
    redirect(
      "/login?error=We%20could%20not%20sign%20you%20in.%20Check%20your%20details.",
    );
  redirect("/admin");
}

export async function signOut() {
  const client = await serverClient();
  await client.auth.signOut({ scope: "local" });
  redirect("/login");
}
