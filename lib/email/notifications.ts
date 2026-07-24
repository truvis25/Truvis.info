import "server-only";

import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/config";
import { sendEmail } from "./sender";

// Minimal, image-free, inline-styled layout — email clients strip <style> and
// external assets. Petroleum header bar + white content card + muted footer.
function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1a1d29;">
    <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
      <div style="background:#023059;border-radius:12px 12px 0 0;padding:20px 24px;">
        <span style="color:#ffffff;font-weight:800;letter-spacing:0.04em;font-size:18px;">Truvis.info</span>
      </div>
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
        <h1 style="margin:0 0 12px;font-size:18px;color:#023059;">${title}</h1>
        ${bodyHtml}
      </div>
      <p style="margin:16px 4px;font-size:12px;color:#6b7280;line-height:1.5;">
        You received this because of activity on your Truvis.info account.
        <br /><a href="${SITE_URL}" style="color:#047857;">${SITE_URL.replace(/^https?:\/\//, "")}</a>
      </p>
    </div>
  </body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:8px;background:#059669;color:#ffffff;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:6px;font-size:14px;">${label}</a>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#374151;">${text}</p>`;
}

// Recipient resolution — emails live only in auth.users, reachable via the
// service role. Returns null (with a warning) when the admin client is absent.
async function emailForUser(userId: string): Promise<string | null> {
  const admin = tryCreateAdminClient();
  if (!admin) {
    console.warn("[email] no service-role client — cannot resolve recipient email");
    return null;
  }
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) {
    console.error("[email] getUserById failed:", error.message);
    return null;
  }
  return data.user?.email ?? null;
}

async function ownerEmailForOrg(orgId: string): Promise<string | null> {
  const admin = tryCreateAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("org_members")
    .select("user_id")
    .eq("org_id", orgId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  if (!data?.user_id) return null;
  return emailForUser(data.user_id as string);
}

// Each notifier swallows its own errors: notifications are best-effort and must
// never break the action that triggered them. Call sites just `await` these.
async function safeSend(to: string | null, subject: string, bodyHtml: string): Promise<void> {
  if (!to) return;
  try {
    await sendEmail({ to, subject, html: layout(subject, bodyHtml) });
  } catch (error) {
    console.error(`[email] notification "${subject}" failed:`, error);
  }
}

// --- Events -----------------------------------------------------------------

export async function notifyRegistrationReceived(p: {
  eventTitle: string;
  eventId: string;
  registrantName: string;
  orgId: string;
}): Promise<void> {
  try {
    const to = await ownerEmailForOrg(p.orgId);
    await safeSend(
      to,
      `New registration for ${p.eventTitle}`,
      paragraph(`<strong>${p.registrantName}</strong> registered for <strong>${p.eventTitle}</strong>.`) +
        paragraph("Review and approve attendees from your organizer dashboard.") +
        button(`${SITE_URL}/dashboard/events/${p.eventId}`, "Manage registrations"),
    );
  } catch (error) {
    console.error("[email] notifyRegistrationReceived failed:", error);
  }
}

export async function notifyRegistrationDecided(p: {
  registrantUserId: string;
  eventTitle: string;
  eventSlug: string;
  decision: "approved" | "rejected";
}): Promise<void> {
  try {
    const to = await emailForUser(p.registrantUserId);
    const approved = p.decision === "approved";
    await safeSend(
      to,
      approved
        ? `You're approved for ${p.eventTitle}`
        : `Update on your ${p.eventTitle} registration`,
      paragraph(
        approved
          ? `Your registration for <strong>${p.eventTitle}</strong> has been approved. We look forward to seeing you.`
          : `Your registration for <strong>${p.eventTitle}</strong> was not approved this time.`,
      ) + button(`${SITE_URL}/events/${p.eventSlug}`, "View event"),
    );
  } catch (error) {
    console.error("[email] notifyRegistrationDecided failed:", error);
  }
}

export async function notifyEventCancelled(p: {
  eventId: string;
  eventTitle: string;
}): Promise<void> {
  try {
    const admin = tryCreateAdminClient();
    if (!admin) return;
    const { data: regs } = await admin
      .from("event_registrations")
      .select("user_id")
      .eq("event_id", p.eventId)
      .in("status", ["pending", "approved", "waitlisted"]);
    for (const reg of regs ?? []) {
      const to = await emailForUser(reg.user_id as string);
      await safeSend(
        to,
        `${p.eventTitle} has been cancelled`,
        paragraph(`We're sorry — <strong>${p.eventTitle}</strong> has been cancelled by the organizer.`) +
          button(`${SITE_URL}/events`, "Browse other events"),
      );
    }
  } catch (error) {
    console.error("[email] notifyEventCancelled failed:", error);
  }
}

// --- Marketplace (identity-safe: headline + generic links only) -------------

// org_id is not session-selectable on marketplace_listings (anonymity
// hardening, migration 0007), so these resolve the org + headline via the
// admin client from the listing id alone.
async function listingHeadlineAndOrg(
  listingId: string,
): Promise<{ headline: string; orgId: string } | null> {
  const admin = tryCreateAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("marketplace_listings")
    .select("teaser_headline, org_id")
    .eq("id", listingId)
    .maybeSingle();
  if (!data) return null;
  return { headline: data.teaser_headline as string, orgId: data.org_id as string };
}

export async function notifyApplicationReceived(p: {
  listingId: string;
}): Promise<void> {
  try {
    const listing = await listingHeadlineAndOrg(p.listingId);
    if (!listing) return;
    const to = await ownerEmailForOrg(listing.orgId);
    await safeSend(
      to,
      "New application to review your listing",
      paragraph(`A subscriber applied to review <strong>${listing.headline}</strong>.`) +
        paragraph("Approve or decline the request from your listings dashboard.") +
        button(`${SITE_URL}/dashboard/listings`, "Review application"),
    );
  } catch (error) {
    console.error("[email] notifyApplicationReceived failed:", error);
  }
}

export async function notifyApplicationDecided(p: {
  applicantUserId: string;
  listingId: string;
  decision: "approved" | "rejected";
}): Promise<void> {
  try {
    const listing = await listingHeadlineAndOrg(p.listingId);
    const headline = listing?.headline ?? "the listing";
    const to = await emailForUser(p.applicantUserId);
    const approved = p.decision === "approved";
    await safeSend(
      to,
      approved
        ? "Your review application was approved"
        : "Update on your review application",
      approved
        ? paragraph(`Your application to review <strong>${headline}</strong> was approved. Full detail and a private thread with the seller are now open.`) +
            button(`${SITE_URL}/marketplace/${p.listingId}`, "Open the listing")
        : paragraph(`Your application to review <strong>${headline}</strong> was not approved.`) +
            button(`${SITE_URL}/marketplace`, "Browse the marketplace"),
    );
  } catch (error) {
    console.error("[email] notifyApplicationDecided failed:", error);
  }
}

export async function notifyNewListingMessage(p: {
  applicationId: string;
  senderUserId: string;
  preview: string;
}): Promise<void> {
  try {
    const admin = tryCreateAdminClient();
    if (!admin) return;
    const { data: app } = await admin
      .from("listing_applications")
      .select("applicant_id, listing_id, marketplace_listings(org_id)")
      .eq("id", p.applicationId)
      .maybeSingle();
    if (!app) return;
    const listing = app.marketplace_listings as unknown as { org_id: string } | null;
    const senderIsApplicant = app.applicant_id === p.senderUserId;
    // Recipient is the other side of the thread.
    const to = senderIsApplicant
      ? listing?.org_id
        ? await ownerEmailForOrg(listing.org_id)
        : null
      : await emailForUser(app.applicant_id as string);
    const dashboardLink = senderIsApplicant
      ? `${SITE_URL}/dashboard/listings`
      : `${SITE_URL}/dashboard/applications`;
    const snippet = p.preview.slice(0, 140) + (p.preview.length > 140 ? "…" : "");
    await safeSend(
      to,
      "New message on a marketplace listing",
      paragraph("You have a new message in one of your listing threads:") +
        `<p style="margin:0 0 12px;padding:12px;background:#f5f5f5;border-radius:8px;font-size:14px;color:#374151;">${snippet}</p>` +
        button(dashboardLink, "Open the thread"),
    );
  } catch (error) {
    console.error("[email] notifyNewListingMessage failed:", error);
  }
}
