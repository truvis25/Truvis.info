"use client";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import { Brand, Footer } from "../house";

type Row = Record<string, string | number | null | undefined>;
type MemberResult = { error?: string; member: Row; events: Row[] };
type PublicEventsResult = { events?: Row[] };

const date = (s: unknown) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Dubai",
  }).format(new Date(String(s))) + " GST";

function calendar(e: Row) {
  const esc = (s: unknown) =>
      String(s ?? "")
        .replaceAll("\\", "\\\\")
        .replaceAll("\n", "\\n")
        .replaceAll(",", "\\,")
        .replaceAll(";", "\\;"),
    t = (s: unknown) =>
      new Date(String(s))
        .toISOString()
        .replaceAll(/[-:]/g, "")
        .replace(/\.\d{3}/, "");
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TRUVIS//Founder House//EN",
    "BEGIN:VEVENT",
    "UID:" + e.id + "@house.truvis.info",
    "DTSTAMP:" + t(new Date().toISOString()),
    "DTSTART:" + t(e.starts_at),
    "DTEND:" + t(e.ends_at),
    "SUMMARY:" + esc(e.title),
    "LOCATION:" + esc(e.venue ?? e.area),
    "DESCRIPTION:" + esc(e.description),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const u = URL.createObjectURL(
      new Blob([body], { type: "text/calendar;charset=utf-8" }),
    ),
    a = document.createElement("a");
  a.href = u;
  a.download = "founder-house.ics";
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}

function isExternalEvent(e: Row) {
  return (
    /^(luma|meetup)-/.test(String(e.id ?? "")) || !!e.external_url
  );
}

function mergeEvents(privateEvents: Row[], publicEvents: Row[]) {
  const combined = [...privateEvents];
  for (const event of publicEvents) {
    const normalized: Row = {
      ...event,
      venue: event.venue ?? event.area ?? "Abu Dhabi",
    };
    const duplicate = combined.some(
      (existing) =>
        String(existing.id) === String(normalized.id) ||
        (!!existing.external_url &&
          existing.external_url === normalized.external_url) ||
        (String(existing.title).toLowerCase() ===
          String(normalized.title).toLowerCase() &&
          existing.starts_at === normalized.starts_at),
    );
    if (!duplicate) combined.push(normalized);
  }
  return combined.sort(
    (a, b) =>
      new Date(String(a.starts_at)).getTime() -
      new Date(String(b.starts_at)).getTime(),
  );
}

export default function Members() {
  const [data, setData] = useState<{ member: Row; events: Row[] } | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const memberResponse = await fetch("/api/member", { cache: "no-store" });
    const memberData = (await memberResponse.json()) as MemberResult;
    if (!memberResponse.ok) throw Error(memberData.error);

    let publicEvents: Row[] = [];
    try {
      const publicResponse = await fetch("/api/events", { cache: "no-store" });
      if (publicResponse.ok) {
        const publicData = (await publicResponse.json()) as PublicEventsResult;
        if (Array.isArray(publicData.events)) publicEvents = publicData.events;
      }
    } catch {
      // Member access should still work if the public calendar is temporarily unavailable.
    }

    setData({
      member: memberData.member,
      events: mergeEvents(memberData.events ?? [], publicEvents),
    });
  }, []);

  useEffect(() => {
    let live = true;
    async function init() {
      try {
        const access = new URLSearchParams(location.hash.slice(1)).get(
          "access",
        );
        if (access) {
          history.replaceState(null, "", location.pathname);
          const r = await fetch("/api/member/login", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ access }),
            }),
            d = (await r.json()) as MemberResult;
          if (!r.ok) throw Error(d.error);
        }
        if (live) await load();
      } catch (e) {
        if (live)
          setError(e instanceof Error ? e.message : "Please try again.");
      } finally {
        if (live) setLoading(false);
      }
    }
    init();
    return () => {
      live = false;
    };
  }, [load]);

  async function rsvp(e: Row, cancel = false) {
    if (busy || isExternalEvent(e)) return;
    setBusy(String(e.id));
    setError("");
    try {
      const r = await fetch("/api/events/" + e.id + "/rsvp", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ cancel }),
        }),
        d = (await r.json()) as MemberResult;
      if (!r.ok) throw Error(d.error);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy("");
    }
  }

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
        <div className="section-label">THE MEMBERS’ ROOM</div>
        {loading ? (
          <p className="loading">Loading your member area…</p>
        ) : !data ? (
          <>
            <h1>Member access</h1>
            <div className="empty-state">
              <LockKeyhole size={32} />
              <h3>For approved members.</h3>
              <p>
                {error ||
                  "Open the private member invitation sent by the Founder House team. Each member has their own access link."}
              </p>
              <a
                href="/#apply"
                className="button dark"
                style={{ marginTop: 22 }}
              >
                Apply for membership <ArrowUpRight size={17} />
              </a>
            </div>
            <p>
              Already approved but need help?{" "}
              <a href="mailto:info@truvis.info">info@truvis.info</a>
            </p>
          </>
        ) : (
          <>
            <div className="member-top">
              <div>
                <h1>Welcome in, {String(data.member.name).split(" ")[0]}.</h1>
                <p>
                  {data.member.role} · {data.member.organisation} ·{" "}
                  {data.member.id}
                </p>
              </div>
              <button
                className="small-button"
                onClick={async () => {
                  await fetch("/api/member/logout", { method: "POST" });
                  setData(null);
                }}
              >
                Sign out
              </button>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="notice">
              Your membership is approved. Upcoming Founder House gatherings
              appear here automatically. Each event has its own registration or
              RSVP and limited capacity. Keep your private access link within the
              House.
            </div>
            {!data.events.length ? (
              <div className="empty-state">
                <h3>No events announced yet.</h3>
                <p>
                  When a gathering is announced, it will appear here
                  automatically and you’ll be able to reserve your place.
                </p>
              </div>
            ) : (
              data.events.map((e) => {
                const external = isExternalEvent(e);
                return (
                  <article key={String(e.id)} className="event-member">
                    <span className="section-label">{e.format} · ABU DHABI</span>
                    <h2>{e.title}</h2>
                    <p>
                      {date(e.starts_at)}
                      <br />
                      Until {date(e.ends_at)}
                      <br />
                      {e.venue ?? e.area}
                    </p>
                    <p>{e.description}</p>
                    {external ? (
                      <div className="review-buttons">
                        <a
                          className="button dark"
                          href={`/events/${encodeURIComponent(String(e.id))}`}
                        >
                          View & register <ArrowUpRight size={17} />
                        </a>
                        <button
                          className="small-button"
                          onClick={() => calendar(e)}
                        >
                          Add to calendar
                        </button>
                      </div>
                    ) : e.rsvp_status && e.rsvp_status !== "cancelled" ? (
                      <>
                        <span className={"status " + e.rsvp_status}>
                          {e.rsvp_status === "confirmed"
                            ? "Your place is confirmed"
                            : "You are on the event waitlist"}
                        </span>
                        <div className="review-buttons">
                          {e.rsvp_status === "confirmed" && (
                            <button
                              className="small-button"
                              onClick={() => calendar(e)}
                            >
                              Add to calendar
                            </button>
                          )}
                          <button
                            className="small-button"
                            disabled={!!busy}
                            onClick={() => rsvp(e, true)}
                          >
                            Release my place
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        className="button dark"
                        disabled={!!busy}
                        onClick={() => rsvp(e)}
                      >
                        {busy === String(e.id) ? "Saving…" : "Request my place"}
                        <ArrowUpRight size={17} />
                      </button>
                    )}
                  </article>
                );
              })
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
