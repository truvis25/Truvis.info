"use client";
import { useCallback, useEffect, useState } from "react";
type Delivery = {
  id: string;
  kind: string;
  recipient: string;
  status: string;
  created_at: string;
};
type EmailState = {
  configured: boolean;
  missing: string[];
  from: string;
  replyTo: string;
  testRecipient: string;
  deliveries: Delivery[];
};
export const deliveryLabel = (status: string) =>
  ({
    accepted: "Accepted by mail server",
    not_configured: "Email not connected",
    suppressed: "Test address · not sent",
    failed: "Not sent",
    unknown: "Delivery uncertain · check mailbox",
    sending: "Sending · check mailbox if this persists",
  })[status] ?? status;
export default function LaunchChecks({
  databaseReady,
  eventCount,
  connectedChannels,
}: {
  databaseReady: boolean;
  eventCount: number;
  connectedChannels: number;
}) {
  const [email, setEmail] = useState<EmailState | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch("/api/admin/email", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok)
      throw Error(data.error || "Email status is unavailable. Please refresh.");
    setEmail(data.email);
  }, []);
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);
  async function testEmail() {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/email/test", { method: "POST" });
      const data = await response.json();
      if (!response.ok)
        throw Error(data.error || "The email test could not be completed.");
      const result = data.emailResult;
      setMessage(
        result.status === "accepted"
          ? "The mail server accepted the test. Check info@truvis.info, including spam, and reply to confirm that replies reach your team."
          : deliveryLabel(result.status) +
              ". No successful delivery has been confirmed.",
      );
      if (!result.logged)
        setError(
          "The delivery log could not be updated. Check the mailbox before sending another test.",
        );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const latestTest = email?.deliveries.find((d) => d.kind === "test");
  return (
    <section className="launch-checks" aria-labelledby="launch-checks-title">
      <h2 id="launch-checks-title">Before you invite everyone.</h2>
      <p className="form-subtitle">
        Check the essentials, send yourself a test email and review your first
        gathering.
      </p>
      <div className="launch-grid">
        <article className="launch-card">
          <span className="section-label">01 / APPLICATIONS</span>
          <h3>
            {databaseReady ? "Database connected" : "Checking the database"}
          </h3>
          <p>
            {databaseReady
              ? "Applications and events loaded from the live database. Open Applications to review every submitted detail."
              : "Wait for the live records to load. Resolve any error before launch."}
          </p>
        </article>
        <article className="launch-card">
          <span className="section-label">02 / EMAIL</span>
          <h3>
            {!email
              ? "Checking email"
              : !email.configured
                ? "Connection needed"
                : latestTest?.status === "accepted"
                  ? "Check the test inbox"
                  : "Ready for a test"}
          </h3>
          <p>
            Application receipts and approved-member invitations use
            info@truvis.info. A successful server response still needs an inbox
            check.
          </p>
        </article>
        <article className="launch-card">
          <span className="section-label">03 / GATHERINGS</span>
          <h3>
            {eventCount
              ? `${eventCount} upcoming ${eventCount === 1 ? "gathering" : "gatherings"}`
              : "First gathering to add"}
          </h3>
          <p>
            {eventCount
              ? "Check the date, capacity, public description and private venue before inviting members."
              : "The website currently shows that the first events are coming soon. Add a confirmed date when it is ready."}
          </p>
        </article>
        <article className="launch-card">
          <span className="section-label">04 / OTHER PLATFORMS</span>
          <h3>{connectedChannels} of 4 channels connected</h3>
          <p>
            Use Distribution to confirm Luma, Meetup, Eventbrite and LinkedIn
            connections and the result of each publication.
          </p>
        </article>
      </div>
      <div className="admin-form">
        <h3>Email connection</h3>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
        {email ? (
          <>
            <dl className="email-details">
              <div>
                <dt>From</dt>
                <dd>{email.from}</dd>
              </div>
              <div>
                <dt>Replies</dt>
                <dd>{email.replyTo}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  {email.configured
                    ? "Connection details saved · delivery test required"
                    : "Not connected"}
                </dd>
              </div>
            </dl>
            {!email.configured && (
              <div className="notice">
                <h4>Connect the company mailbox</h4>
                <p>
                  Missing: {email.missing.join(", ")}. Save these securely in
                  the project’s Edge Function secrets. Passwords are never
                  entered in this page or shown in delivery logs.
                </p>
                <a
                  href="https://supabase.com/dashboard/project/hyzotwxtqssefsgryawl/functions/secrets"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open secure email settings ↗
                </a>
                <p className="form-footnote">
                  Use FOUNDER_HOUSE_SMTP_HOST, FOUNDER_HOUSE_SMTP_USER and
                  FOUNDER_HOUSE_SMTP_PASS. TLS port 465 is required. The sending
                  mailbox must be authorised for info@truvis.info.
                </p>
              </div>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="button dark"
                disabled={busy || !email.configured}
                onClick={testEmail}
              >
                {busy ? "Sending test…" : "Send test to info@truvis.info"}
              </button>
              <button
                type="button"
                className="small-button"
                disabled={busy}
                onClick={() => {
                  setError("");
                  load().catch((e) => setError(e.message));
                }}
              >
                Refresh status
              </button>
            </div>
            <p className="form-footnote">
              Receipts confirm an application was saved. Invitations are sent
              only after approval. No newsletter or bulk email is sent from this
              panel.
            </p>
          </>
        ) : (
          <p>Loading email connection…</p>
        )}
      </div>
      <h3>Recent email activity</h3>
      <p className="form-subtitle">
        “Accepted” means the mail server accepted the message, not that it
        arrived in the inbox. An uncertain result should be checked before
        sending again.
      </p>
      {email && !email.deliveries.length ? (
        <div className="empty-state">
          <p>No emails have been attempted yet.</p>
        </div>
      ) : (
        <div className="email-activity">
          {email?.deliveries.map((d) => (
            <article className="email-record" key={d.id}>
              <div>
                <strong>
                  {d.kind === "application_received"
                    ? "Application receipt"
                    : d.kind === "member_invitation"
                      ? "Member invitation"
                      : "Connection test"}
                </strong>
                <p>{d.recipient}</p>
              </div>
              <div>
                <strong>{deliveryLabel(d.status)}</strong>
                <p>
                  {new Intl.DateTimeFormat("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Asia/Dubai",
                  }).format(new Date(d.created_at))}{" "}
                  GST
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
