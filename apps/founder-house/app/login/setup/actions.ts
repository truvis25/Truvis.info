"use server";

import { serverClient } from "../../../lib/supabase";

export type SetupState = { error?: string; verified?: boolean; complete?: boolean };

export async function verifyInvitation(_: SetupState, form: FormData): Promise<SetupState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const token = String(form.get("code") ?? "").trim();
  if (!email || email.length > 254 || !/^\d{6,10}$/.test(token))
    return { error: "Enter your invited email address and the code from your invitation." };
  const client = await serverClient();
  const { data, error } = await client.auth.verifyOtp({ email, token, type: "invite" });
  if (error || !data.user?.email_confirmed_at)
    return { error: "This invitation could not be verified. Check the code or ask your organiser for a new invitation." };
  return { verified: true };
}

export async function setInvitedPassword(_: SetupState, form: FormData): Promise<SetupState> {
  // Never trust client state or metadata as proof of identity or organiser access.
  const client = await serverClient();
  const { data: { user }, error: identityError } = await client.auth.getUser();
  if (identityError || !user?.email_confirmed_at)
    return { error: "Your session has expired. Verify your invitation again." };
  const password = String(form.get("password") ?? "");
  const confirmation = String(form.get("confirmation") ?? "");
  if (password.length < 12 || password.length > 128)
    return { verified: true, error: "Choose a password between 12 and 128 characters." };
  if (password !== confirmation)
    return { verified: true, error: "The passwords do not match." };
  const { error } = await client.auth.updateUser({ password });
  if (error)
    return { verified: true, error: "We could not save that password. Try a stronger password or contact your organiser." };
  await client.auth.signOut({ scope: "local" });
  return { complete: true };
}
