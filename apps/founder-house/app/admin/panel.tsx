"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, Download, Check, Copy } from "lucide-react";
import { Brand, Footer } from "../house";
type Row = Record<string, string | number | null>;
type Channel = {
  name: string;
  connected: boolean;
  mode: string;
  requirement: string;
};
const statusLabel = (status: unknown) =>
  (
    ({
      not_connected: "Not connected",
      needs_review: "Check channel before retrying",
      needs_update: "Update needed",
      accepted: "Awaiting publication receipt",
      publishing: "Publishing",
      published: "Published",
      synced: "Changes synced",
      failed: "Failed · retry available",
      in_progress: "Already in progress",
    }) as Record<string, string>
  )[String(status)] ?? String(status);
type ApiResult = {
  error?: string;
  admin: boolean;
  authenticated: boolean;
  configured: boolean;
  applications: Row[];
  events: Row[];
  channels: Channel[];
  jobs: Row[];
  inviteUrl?: string;
  attendees: Row[];
  message: string;
  results: { channel: string; status: string }[];
  distribution?: { results: { channel: string; status: string }[] };
};
async function api(path: string, options: RequestInit = {}) {
  const r = await fetch(path, options),
    b = (await r.json()) as ApiResult;
  if (!r.ok) throw Error(b.error || "Request failed.");
  return b;
}
const date = (s: unknown) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dubai",
  }).format(new Date(String(s))) + " GST";
function save(name: string, body: string, mime = "text/plain") {
  const u = URL.createObjectURL(new Blob([body], { type: mime })),
    a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
function cell(v: unknown) {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
export default function Admin() {
  const [auth, setAuth] = useState<{
      admin: boolean;
      authenticated: boolean;
      configured: boolean;
    } | null>(null),
    [tab, setTab] = useState("Applications"),
    [apps, setApps] = useState<Row[]>([]),
    [events, setEvents] = useState<Row[]>([]),
    [channels, setChannels] = useState<Channel[]>([]),
    [jobs, setJobs] = useState<Row[]>([]),
    [editing, setEditing] = useState<Row | null>(null),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [invite, setInvite] = useState<{ url: string; name: string } | null>(null),
    [copied, setCopied] = useState(false),
    [attendees, setAttendees] = useState<{
      eventId: string;
      rows: Row[];
    } | null>(null);
  const load = useCallback(async () => {
    const [a, e, d] = await Promise.all([
      api("/api/admin/applications"),
      api("/api/admin/events"),
      api("/api/admin/distribution"),
    ]);
    setApps(a.applications);
    setEvents(e.events);
    setChannels(d.channels);
    setJobs(d.jobs);
  }, []);
  useEffect(() => {
    let live = true;
    api("/api/me")
      .then((a) => {
        if (!live) return;
        setAuth(a);
        if (a.admin) load().catch((e) => setError(e.message));
      })
      .catch((e) => setError(e.message));
    return () => {
      live = false;
    };
  }, [load]);
  async function act(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function review(a: Row, s: string) {
    await act(async () => {
      const d = await api("/api/admin/applications/" + a.id, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: s }),
      });
      if (d.inviteUrl) {
        setInvite({ url: d.inviteUrl, name: String(a.name) });
        setCopied(false);
      } else setInvite(null);
      setMessage(
        s === "approved"
          ? "Approved. Copy the private invitation below and send it directly to the member. It has not been emailed."
          : "Membership status updated. Any previous access has been revoked.",
      );
      await load();
    });
  }
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget,
      data = new FormData(f),
      b = Object.fromEntries(data);
    await act(async () => {
      const response = await api(
        "/api/admin/events" + (editing ? "/" + editing.id : ""),
        {
          method: editing ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...b,
            capacity: Number(b.capacity),
            startsAt: new Date(String(b.startsAt) + "+04:00").toISOString(),
            endsAt: new Date(String(b.endsAt) + "+04:00").toISOString(),
          }),
        },
      );
      f.reset();
      setEditing(null);
      setMessage(
        "Event saved." +
          (response.distribution
            ? " " +
              response.distribution.results
                .map((x) => x.channel + ": " + statusLabel(x.status))
                .join(" · ")
            : " Drafts stay private until you publish."),
      );
      await load();
    });
  }
  async function eventStatus(e: Row, s: string) {
    await act(async () => {
      const response = await api("/api/admin/events/" + e.id, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: s }),
      });
      setMessage(
        "Event is now " +
          s +
          ". " +
          (response.distribution?.results
            .map((x) => x.channel + ": " + statusLabel(x.status))
            .join(" · ") ?? "Check Distribution for channel status."),
      );
      await load();
    });
  }
  function pack(e: Row) {
    const origin = location.origin;
    save(
      "founder-house-event-" + e.id + ".txt",
      [
        e.title,
        "Founder House by TRUVIS",
        date(e.starts_at) + " – " + date(e.ends_at),
        String(e.area) + ", Abu Dhabi",
        String(e.description),
        "",
        "APPROVED MEMBERS ONLY",
        "Event page and application: " + origin + "/events/" + e.id,
        "An external listing or RSVP does not confirm admission. Approved members receive a separate confirmation. Do not publish the private venue or guest list.",
        "",
        "CHANNEL COPY",
        "Luma / Meetup / Eventbrite: Use the description above and link to the membership application. Keep approval on where supported.",
        "LinkedIn: " +
          e.title +
          " | Abu Dhabi. A small gathering for approved Founder House members. Apply: " +
          origin +
          "/events/" +
          e.id,
        "",
        "Do not publish until the date, venue and any event costs are confirmed.",
      ].join("\n"),
    );
  }
  const filtered = apps.filter(
    (a) =>
      (status === "all" || a.status === status) &&
      [a.name, a.email, a.organisation, a.role, a.city]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="subheader">
        <header className="header wrap">
          <Brand />
          <a href="/" className="quiet-link">
            Back to the House <ArrowUpRight size={16} />
          </a>
        </header>
      </div>
      <main className="wrap subpage">
        <div className="section-label">FOUNDER HOUSE / ORGANISER DESK</div>
        <h1>Manage the community.</h1>
        <p>
          Review applications, manage events and check where each event has been
          published.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {!auth ? (
          <p className="loading">Opening the organiser desk…</p>
        ) : !auth.admin ? (
          <div className="notice">
            <h3>Organiser access is restricted.</h3>
            <p>
              {auth.configured
                ? "Use the authorised organiser account to review members and manage events."
                : "The organiser account must be configured before member records can be opened. Applicant data is protected."}
            </p>
            {!auth.authenticated && (
              <a className="button dark" href="/login" target="_top">
                Sign in to TRUVIS <ArrowUpRight size={17} />
              </a>
            )}
          </div>
        ) : (
          <>
            <div className="admin-stats">
              {["pending", "approved", "waitlisted", "declined"].map((s) => (
                <div key={s}>
                  <strong>{apps.filter((a) => a.status === s).length}</strong>
                  <span>
                    {s === "pending"
                      ? "Awaiting review"
                      : s === "approved"
                        ? "Approved members"
                        : s === "waitlisted"
                          ? "Membership waitlist"
                          : "Declined"}
                  </span>
                </div>
              ))}
            </div>
            <div className="admin-tabs">
              {["Applications", "Gatherings", "Distribution"].map((t) => (
                <button
                  key={t}
                  className={tab === t ? "active" : ""}
                  onClick={() => {
                    setTab(t);
                    setMessage("");
                    setError("");
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            {message && (
              <div className="notice" role="status">
                {message}
              </div>
            )}
            {invite && (
              <div className="invite-output">
                <strong>Private invitation for {invite.name}</strong>
                <p>
                  This link grants member access for 30 days. Send it only to
                  the approved member. Generating a new invitation invalidates
                  the previous one.
                </p>
                <input
                  readOnly
                  value={invite.url}
                  aria-label="Private member invitation"
                />
                <button
                  className="small-button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(invite.url);
                    setCopied(true);
                  }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}{" "}
                  {copied ? "Copied" : "Copy invitation"}
                </button>
              </div>
            )}
            {tab === "Applications" && (
              <>
                <div className="admin-tools">
                  <input
                    aria-label="Search applications"
                    placeholder="Search name, company, role or city"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <select
                    aria-label="Filter membership status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="all">All statuses</option>
                    {["pending", "approved", "waitlisted", "declined"].map(
                      (s) => (
                        <option key={s}>{s}</option>
                      ),
                    )}
                  </select>
                  <button
                    className="small-button"
                    onClick={() => {
                      const keys = [
                        "id",
                        "name",
                        "email",
                        "phone",
                        "role",
                        "organisation",
                        "title",
                        "city",
                        "status",
                        "interests",
                        "ask",
                        "offer",
                        "source",
                        "referral",
                        "updates_consent",
                        "created_at",
                      ];
                      save(
                        "founder-house-applications.csv",
                        [
                          keys.map(cell).join(","),
                          ...filtered.map((a) =>
                            keys.map((k) => cell(a[k])).join(","),
                          ),
                        ].join("\r\n"),
                        "text/csv;charset=utf-8",
                      );
                    }}
                  >
                    <Download size={13} /> Export filtered CSV
                  </button>
                </div>
                <p className="form-subtitle">
                  Showing {filtered.length} applications. Review relevance,
                  contribution and community balance; membership is not a
                  measure of personal worth.
                </p>
                {!filtered.length && (
                  <div className="empty-state">
                    <h3>The first hello starts here.</h3>
                    <p>
                      New applications will appear here for personal review.
                      There are no demo applicants in the live list.
                    </p>
                  </div>
                )}
                {filtered.map((a) => (
                  <details className="applicant" key={String(a.id)}>
                    <summary>
                      <div>
                        <h3>{a.name}</h3>
                        <p>
                          {a.role} · {a.organisation} · {a.city}
                        </p>
                      </div>
                      <span className={"status " + a.status}>{a.status}</span>
                    </summary>
                    <div className="applicant-body">
                      <div className="contact-row">
                        <a href={"mailto:" + a.email}>{a.email}</a>
                        <a href={"tel:" + a.phone}>{a.phone}</a>
                        {a.linkedin && (
                          <a
                            href={String(a.linkedin)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            LinkedIn ↗
                          </a>
                        )}
                        {a.cv_key && (
                          <a href={"/api/admin/applications/" + a.id + "/cv"}>
                            Download PDF CV
                          </a>
                        )}
                      </div>
                      <p>
                        {a.title} · Applied {date(a.created_at)} · {a.id}
                      </p>
                      <h4>Current work</h4>
                      <p>{a.about}</p>
                      <h4>Can contribute</h4>
                      <p>{a.offer}</p>
                      <h4>Looking for</h4>
                      <p>{a.ask || "Not specified"}</p>
                      <h4>Interests</h4>
                      <p>
                        {(() => {
                          try {
                            return (
                              Array.isArray(a.interests)
                                ? a.interests
                                : JSON.parse(String(a.interests))
                            ).join(" · ");
                          } catch {
                            return a.interests;
                          }
                        })()}
                      </p>
                      <p>
                        Introduced by: {a.referral || "—"} · Source:{" "}
                        {a.source || "—"} · News opt-in:{" "}
                        {a.updates_consent ? "Yes" : "No"}
                      </p>
                      <div className="review-buttons">
                        <button
                          disabled={busy}
                          className="small-button primary"
                          onClick={() => review(a, "approved")}
                        >
                          {a.status === "approved"
                            ? "Renew private invitation"
                            : "Approve & create invitation"}
                        </button>
                        <button
                          disabled={busy}
                          className="small-button"
                          onClick={() => review(a, "waitlisted")}
                        >
                          Waitlist
                        </button>
                        <button
                          disabled={busy}
                          className="small-button"
                          onClick={() => review(a, "declined")}
                        >
                          Decline / revoke
                        </button>
                        <button
                          disabled={busy}
                          className="small-button"
                          onClick={() => review(a, "pending")}
                        >
                          Return to review
                        </button>
                      </div>
                    </div>
                  </details>
                ))}
              </>
            )}
            {tab === "Gatherings" && (
              <>
                <form
                  className="admin-form"
                  id="event-form"
                  key={String(editing?.id ?? "new")}
                  onSubmit={create}
                >
                  <h3>{editing ? "Edit event" : "Create an event"}</h3>
                  <p className="form-subtitle">
                    Publishing saves the event on this site and sends it to
                    every configured channel. Drafts stay private. Check
                    Distribution for confirmed links and any errors.
                  </p>
                  <div className="form-row">
                    <label>
                      Event title
                      <input
                        name="title"
                        defaultValue={String(editing?.title ?? "")}
                        required
                        maxLength={150}
                        placeholder="e.g. The Founder Breakfast"
                      />
                    </label>
                    <label>
                      Format
                      <select
                        name="format"
                        defaultValue={String(editing?.format ?? "Breakfast")}
                      >
                        <option>Breakfast</option>
                        <option>Founder circle</option>
                        <option>Investor conversation</option>
                        <option>Padel</option>
                        <option>Football</option>
                        <option>Volleyball</option>
                      </select>
                    </label>
                  </div>
                  <div className="form-row">
                    <label>
                      Starts · Abu Dhabi time (UTC+4)
                      <input
                        type="datetime-local"
                        name="startsAt"
                        required
                        defaultValue={
                          editing
                            ? new Date(
                                new Date(String(editing.starts_at)).getTime() +
                                  4 * 3600000,
                              )
                                .toISOString()
                                .slice(0, 16)
                            : ""
                        }
                      />
                    </label>
                    <label>
                      Ends · Abu Dhabi time (UTC+4)
                      <input
                        type="datetime-local"
                        name="endsAt"
                        required
                        defaultValue={
                          editing
                            ? new Date(
                                new Date(String(editing.ends_at)).getTime() +
                                  4 * 3600000,
                              )
                                .toISOString()
                                .slice(0, 16)
                            : ""
                        }
                      />
                    </label>
                  </div>
                  <div className="form-row">
                    <label>
                      Public area
                      <input
                        name="area"
                        defaultValue={String(editing?.area ?? "")}
                        required
                        placeholder="e.g. Al Maryah Island"
                        maxLength={100}
                      />
                    </label>
                    <label>
                      Capacity
                      <input
                        name="capacity"
                        required
                        type="number"
                        min={2}
                        max={300}
                        defaultValue={Number(editing?.capacity ?? 12)}
                      />
                    </label>
                  </div>
                  <label>
                    Private venue · approved members only
                    <input
                      name="venue"
                      defaultValue={String(editing?.venue ?? "")}
                      required
                      placeholder="Venue name, exact address and arrival instructions"
                      maxLength={300}
                    />
                  </label>
                  <label>
                    Description · include any ticket, food or court cost
                    <textarea
                      name="description"
                      defaultValue={String(editing?.description ?? "")}
                      required
                      rows={4}
                      maxLength={4000}
                    />
                  </label>
                  <label>
                    Visibility
                    <select
                      name="status"
                      defaultValue={
                        editing?.status === "published" ? "published" : "draft"
                      }
                    >
                      <option value="draft">Draft · organisers only</option>
                      <option value="published">
                        Published · member RSVP open
                      </option>
                    </select>
                  </label>
                  <button disabled={busy} className="button dark" type="submit">
                    {editing ? "Save changes & sync channels" : "Save event"}{" "}
                    <ArrowUpRight size={17} />
                  </button>
                  {editing && (
                    <button
                      className="small-button"
                      type="button"
                      onClick={() => setEditing(null)}
                    >
                      Cancel editing
                    </button>
                  )}
                </form>
                {!events.length && (
                  <p className="notice">
                    No events announced yet. Create your first event above.
                    Published events appear in the upcoming events section.
                  </p>
                )}
                {events.map((e) => (
                  <article className="event-admin-card" key={String(e.id)}>
                    <span className={"status " + e.status}>{e.status}</span>
                    <h3>{e.title}</h3>
                    <p>
                      {date(e.starts_at)} – {date(e.ends_at)}
                      <br />
                      {e.area} · Private venue: {e.venue}
                      <br />
                      {e.confirmed} / {e.capacity} confirmed · {e.waitlisted} on
                      event waitlist
                    </p>
                    <div className="review-buttons">
                      {e.status !== "cancelled" && (
                        <a
                          className="small-button"
                          href="#event-form"
                          onClick={() => setEditing(e)}
                        >
                          Edit event
                        </a>
                      )}
                      <a
                        className="small-button"
                        href={"/events/" + e.id}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View public page
                      </a>
                      <button
                        disabled={busy}
                        className="small-button"
                        onClick={() =>
                          eventStatus(
                            e,
                            e.status === "published" ? "draft" : "published",
                          )
                        }
                      >
                        {e.status === "published"
                          ? "Return to draft"
                          : "Publish on site"}
                      </button>
                      <button
                        disabled={busy}
                        className="small-button"
                        onClick={() => eventStatus(e, "cancelled")}
                      >
                        Cancel
                      </button>
                      <button className="small-button" onClick={() => pack(e)}>
                        Download publication pack
                      </button>
                      <button
                        disabled={busy}
                        className="small-button"
                        onClick={() =>
                          act(async () => {
                            const d = await api(
                              "/api/admin/events/" + e.id + "/attendees",
                            );
                            setAttendees({
                              eventId: String(e.id),
                              rows: d.attendees,
                            });
                          })
                        }
                      >
                        View guest list
                      </button>
                      <button
                        disabled={busy || e.status !== "published"}
                        className="small-button primary"
                        onClick={() =>
                          act(async () => {
                            const d = await api(
                              "/api/admin/events/" + e.id + "/distribute",
                              { method: "POST" },
                            );
                            setMessage(
                              d.message +
                                " " +
                                d.results
                                  .map(
                                    (x: { channel: string; status: string }) =>
                                      x.channel + ": " + statusLabel(x.status),
                                  )
                                  .join(" · "),
                            );
                            await load();
                          })
                        }
                      >
                        Sync / retry channels
                      </button>
                    </div>
                    {attendees?.eventId === e.id && (
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Role</th>
                              <th>RSVP</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendees.rows.map((a) => (
                              <tr key={String(a.id)}>
                                <td>{a.name}</td>
                                <td>{a.email}</td>
                                <td>{a.role}</td>
                                <td>{a.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {!attendees.rows.length && <p>No RSVPs yet.</p>}
                      </div>
                    )}
                  </article>
                ))}
              </>
            )}
            {tab === "Distribution" && (
              <>
                <div className="notice">
                  Events are sent to all configured channels when published or
                  changed. Each channel keeps its own status. External RSVPs do
                  not grant membership or a confirmed place; final reservations
                  stay in Founder House.
                </div>
                <div className="channel-grid">
                  {channels.map((c) => (
                    <div key={c.name}>
                      <h3>{c.name}</h3>
                      <span className="status">
                        {c.connected
                          ? "Configured · account test needed"
                          : "Not connected"}
                      </span>
                      <p>
                        <strong>{c.mode}</strong>
                        <br />
                        {c.requirement}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="notice">
                  Calendar feed:{" "}
                  <a href="/events/calendar.ics">
                    Subscribe in Apple Calendar, Google Calendar or Outlook
                  </a>
                  . It updates from published events and includes cancellations.
                  Eventbrite and LinkedIn require a publishing workflow that
                  returns a verified listing URL and ID. Workflow acceptance
                  alone is shown as awaiting a receipt.
                </div>
                <h3>Publication history</h3>
                {!jobs.length ? (
                  <p className="notice">
                    No external publications have been attempted.
                  </p>
                ) : (
                  jobs.map((j) => (
                    <article className="publication-job" key={String(j.id)}>
                      <div>
                        <h4>
                          {j.channel} · {statusLabel(j.status)}
                        </h4>
                        <p>
                          {events.find((e) => e.id === j.event_id)?.title ??
                            j.event_id}{" "}
                          · {date(j.updated_at)}
                        </p>
                        {j.message && <p>{j.message}</p>}
                        {j.external_url && (
                          <a
                            className="text-link"
                            href={String(j.external_url)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View listing <ArrowUpRight size={15} />
                          </a>
                        )}
                      </div>
                      {["needs_review", "accepted", "publishing"].includes(
                        String(j.status),
                      ) && (
                        <form
                          className="receipt-form"
                          onSubmit={(event) => {
                            event.preventDefault();
                            const f = new FormData(event.currentTarget);
                            void act(async () => {
                              await api(
                                "/api/admin/events/" +
                                  j.event_id +
                                  "/distribution-receipt",
                                {
                                  method: "POST",
                                  headers: {
                                    "content-type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    channel: j.channel,
                                    externalId: f.get("externalId"),
                                    externalUrl: f.get("externalUrl"),
                                  }),
                                },
                              );
                              setMessage(
                                "Listing receipt recorded. Check the listing reflects the current event details.",
                              );
                              await load();
                            });
                          }}
                        >
                          <p>
                            Check the channel dashboard first. If the current
                            listing exists, record its URL and ID.
                          </p>
                          <div className="form-row">
                            <label>
                              Listing URL
                              <input
                                type="url"
                                name="externalUrl"
                                required
                                defaultValue={String(j.external_url ?? "")}
                                placeholder="https://…"
                              />
                            </label>
                            <label>
                              Event / post ID
                              <input
                                name="externalId"
                                required
                                defaultValue={String(j.external_id ?? "")}
                                maxLength={200}
                              />
                            </label>
                          </div>
                          <div className="review-buttons">
                            <button
                              className="small-button primary"
                              disabled={busy}
                            >
                              Confirm current listing
                            </button>
                            <button
                              className="small-button"
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                void act(async () => {
                                  await api(
                                    "/api/admin/events/" +
                                      j.event_id +
                                      "/distribution-receipt",
                                    {
                                      method: "POST",
                                      headers: {
                                        "content-type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        channel: j.channel,
                                        notCreated: true,
                                      }),
                                    },
                                  );
                                  setMessage(
                                    "You confirmed the channel dashboard was checked. Use Sync / retry channels to retry safely.",
                                  );
                                  await load();
                                })
                              }
                            >
                              I checked: no listing / safe to retry
                            </button>
                          </div>
                        </form>
                      )}
                    </article>
                  ))
                )}
              </>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
