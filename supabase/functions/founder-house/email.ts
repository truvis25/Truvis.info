import type { SupabaseClient } from "npm:@supabase/supabase-js@2.110.7";

export const HOUSE_URL = "https://house.truvis.info";
export const HOUSE_EMAIL = "info@truvis.info";
export const EMAIL_BRAND = "Founder House by TRUVIS";
export const EMAIL_FROM = `${EMAIL_BRAND} <info@truvis.info>`;
export type EmailKind =
  | "application_received"
  | "application_notification"
  | "member_invitation"
  | "test";
export type EmailStatus =
  | "sending"
  | "accepted"
  | "not_configured"
  | "suppressed"
  | "failed"
  | "unknown";
export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};
export type Mailer = {
  configured: boolean;
  missing: string[];
  send: (message: EmailMessage) => Promise<{ accepted: boolean }>;
};
export type EmailResult = { status: EmailStatus; logged: boolean };
export type ApplicationSummary = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  organisation: string;
  title: string;
  city: string;
  linkedin: string | null;
  about: string;
  offer: string;
  ask: string | null;
  interests: string[];
  referral: string | null;
  source: string | null;
  hasCv: boolean;
};
type Recipient = {
  id?: string;
  name: string;
  email: string;
  application?: ApplicationSummary;
};
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

export function reservedRecipient(email: string) {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return (
    /(^|\.)(test|invalid|localhost|example)$/.test(domain) ||
    /^(example\.(com|net|org))$/.test(domain)
  );
}

export function emailMessage(
  kind: EmailKind,
  recipient: Recipient,
  inviteUrl?: string,
): EmailMessage {
  if (
    !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(
      recipient.email,
    )
  )
    throw Error("invalid_recipient");
  let title: string,
    paragraphs: string[],
    link = HOUSE_URL,
    button = "Visit Founder House";
  if (kind === "member_invitation") {
    if (
      !inviteUrl ||
      !new RegExp(
        "^https://house\\.truvis\\.info/members#access=[a-f0-9]{64}$",
      ).test(inviteUrl)
    )
      throw Error("invalid_invitation");
    title = EMAIL_BRAND + " — Welcome";
    paragraphs = [
      "Your membership has been approved. We’re glad you’re joining us.",
      "Use your private invitation to open the member room, see upcoming gatherings and reserve a place.",
      "Your link is valid for 30 days. Keep it private: it gives access to your member room. A new invitation replaces your previous link.",
      "Membership does not automatically reserve an event place. Choose an available gathering in your member room.",
    ];
    link = inviteUrl;
    button = "Open your member room";
  } else if (kind === "application_received") {
    title = EMAIL_BRAND + " — Application received";
    paragraphs = [
      "Thank you for introducing yourself. Your application is safely with our review team.",
      "We’ll read it personally and get in touch about the next step. This message confirms receipt; membership and event places are confirmed separately.",
    ];
    if (recipient.id)
      paragraphs.push("Your application reference: " + recipient.id + ".");
  } else if (kind === "application_notification") {
    const application = recipient.application;
    if (
      recipient.email.toLowerCase() !== HOUSE_EMAIL ||
      !application ||
      application.id !== recipient.id ||
      !/^FH-[A-F0-9]{8}$/.test(application.id)
    )
      throw Error("invalid_application_notification");
    title = EMAIL_BRAND + " — New application · " + application.id;
    paragraphs = [
      "A new membership application is ready for review.",
      "Applicant: " + application.name,
      "Role: " + application.role + " · " + application.title,
      "Organisation: " + application.organisation,
      "Location: " + application.city,
      "Email: " + application.email,
      "Phone: " + application.phone,
      "Interests: " + application.interests.join(", "),
      "LinkedIn: " + (application.linkedin ?? "Not provided"),
      "CV: " + (application.hasCv ? "Uploaded" : "Not provided"),
      "About: " + application.about,
      "Can contribute: " + application.offer,
      ...(application.ask ? ["Looking for: " + application.ask] : []),
      ...(application.referral
        ? ["Referral: " + application.referral]
        : []),
      ...(application.source ? ["Source: " + application.source] : []),
    ];
    link = HOUSE_URL + "/admin";
    button = "Review application";
  } else {
    title = EMAIL_BRAND + " — Email check";
    paragraphs = [
      "This is a test from the Founder House organiser desk.",
      "If this message reached your inbox, the website can send from info@truvis.info. Reply to this email to check that replies reach the team too.",
      "This test does not create an application, approve a member or reserve an event place.",
    ];
  }
  const greeting = "Hi " + recipient.name.trim() + ",";
  const text = [
    greeting,
    ...paragraphs,
    button + ": " + link,
    "Questions? Reply to this email.",
    "The Founder House team",
    "A community by truvis.ae",
    HOUSE_EMAIL,
  ].join("\n\n");
  const html = `<!doctype html><html lang="en"><body style="margin:0;background:#f5f7f2;color:#07362d;font-family:Arial,sans-serif"><table role="presentation" style="width:100%;border-collapse:collapse"><tr><td style="padding:32px 20px"><div style="max-width:580px;margin:auto;background:#fff;padding:32px;border-top:6px solid #43c6c5;border-radius:12px"><a href="${HOUSE_URL}" style="display:inline-block"><img src="${HOUSE_URL}/assets/brand/house-email-600.png" width="230" height="85" alt="Founder House by TRUVIS" style="display:block;width:230px;max-width:100%;height:auto;border:0" /></a><h1 style="font-size:30px;line-height:1.2">${escape(title)}</h1><p style="font-size:18px;line-height:1.6">${escape(greeting)}</p>${paragraphs.map((p) => `<p style="font-size:18px;line-height:1.6">${escape(p)}</p>`).join("")}<p style="margin:30px 0"><a href="${escape(link)}" style="display:inline-block;background:#07362d;color:#fff;border-radius:8px;padding:15px 20px;font-size:18px;text-decoration:none">${button}</a></p><p style="font-size:16px;line-height:1.6">Questions? Reply to this email.<br>The Founder House team</p><p style="font-size:14px;line-height:1.6">A community by <a href="https://truvis.ae" style="color:#07362d">truvis.ae</a><br><a href="mailto:${HOUSE_EMAIL}" style="color:#07362d">${HOUSE_EMAIL}</a></p></div></td></tr></table></body></html>`;
  return { to: recipient.email, subject: title, html, text };
}

// Tokens and message bodies never enter this log. A failed email never rolls back
// a saved application or approval. Unknown results are never retried automatically.
export async function deliverEmail(
  db: SupabaseClient,
  mailer: Mailer | undefined,
  kind: EmailKind,
  recipient: Recipient,
  inviteUrl?: string,
): Promise<EmailResult> {
  const id = crypto.randomUUID();
  let status: EmailStatus = reservedRecipient(recipient.email)
    ? "suppressed"
    : !mailer?.configured
      ? "not_configured"
      : "sending";
  try {
    const { error } = await db.from("fh_email_deliveries").insert({
      id,
      application_id: recipient.id ?? null,
      kind,
      recipient: recipient.email,
      status,
    });
    if (error) return { status: "failed", logged: false };
  } catch {
    return { status: "failed", logged: false };
  }
  if (status !== "sending") return { status, logged: true };
  try {
    const message = emailMessage(kind, recipient, inviteUrl);
    const response = await mailer!.send(message);
    status = response.accepted ? "accepted" : "failed";
  } catch {
    // A network timeout after DATA may mean the provider accepted the message.
    status = "unknown";
  }
  try {
    const { error } = await db
      .from("fh_email_deliveries")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    return { status, logged: !error };
  } catch {
    return { status, logged: false };
  }
}
