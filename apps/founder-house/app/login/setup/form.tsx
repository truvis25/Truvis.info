"use client";

import { useActionState } from "react";
import { setInvitedPassword, verifyInvitation, type SetupState } from "./actions";

export function InvitationForm({ verified }: { verified: boolean }) {
  const [invitation, verify, verifying] = useActionState<SetupState, FormData>(verifyInvitation, { verified });
  const [password, save, saving] = useActionState<SetupState, FormData>(setInvitedPassword, {});
  const ready = invitation.verified;
  if (password.complete) return (
    <div role="status">
      <h2>Your password is ready.</h2>
      <p>Your organiser must separately enable administrator access. Creating an account never grants that access automatically.</p>
      <a className="button dark" href="/login">Go to sign in ↗</a>
    </div>
  );
  return ready ? (
    <form className="admin-form login-form" action={save}>
      <p>Email verified. Choose a dedicated password for your TRUVIS account.</p>
      <label>New password<input type="password" name="password" autoComplete="new-password" minLength={12} maxLength={128} required aria-describedby="password-guidance" /></label>
      <p id="password-guidance" className="form-footnote">Use 12–128 characters. Keep it different from your mailbox password.</p>
      <label>Confirm password<input type="password" name="confirmation" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
      {password.error && <p className="form-error" role="alert">{password.error}</p>}
      {password.error && <a href="/login/setup">Verify a new invitation</a>}
      <button className="button dark full" disabled={saving}>{saving ? "Saving password…" : "Save password"}</button>
    </form>
  ) : (
    <form className="admin-form login-form" action={verify}>
      <p>Use the code in your TRUVIS invitation email. Only invited accounts can complete this step.</p>
      <label>Email<input name="email" type="email" required autoComplete="email" autoCapitalize="none" /></label>
      <label>Invitation code<input name="code" type="text" inputMode="numeric" pattern="[0-9]{6,10}" minLength={6} maxLength={10} required autoComplete="one-time-code" /></label>
      {invitation.error && <p className="form-error" role="alert">{invitation.error}</p>}
      <button className="button dark full" disabled={verifying}>{verifying ? "Verifying invitation…" : "Verify invitation"}</button>
      <p className="form-footnote">Need a new invitation? <a href="mailto:info@truvis.info">Contact TRUVIS</a>.</p>
    </form>
  );
}
