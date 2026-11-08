"use client";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CalendarPlus,
  LockKeyhole,
  MapPin,
  RotateCcw,
  Ticket,
  Users,
} from "lucide-react";
import { EventArt } from "./event-art";
import {
  LUMA_CALENDAR_URL,
  daysAway,
  eventParts,
  googleCalendarUrl,
  placesLabel,
  registrationPlatform,
  type EventChannels,
  type PublicEvent,
} from "../lib/events";

const FILTERS = ["All events", "Coffee & conversations", "Sport & social"];
const isSport = (e: PublicEvent) =>
  /padel|football|volleyball|sport/i.test(e.format);
const isFull = (e: PublicEvent) =>
  e.availability === "sold-out" || e.availability === "closed";
const href = (e: PublicEvent) => "/events/" + encodeURIComponent(e.id);

export function EventsSection() {
  const [events, setEvents] = useState<PublicEvent[]>([]),
    [channels, setChannels] = useState<EventChannels>({
      luma: LUMA_CALENDAR_URL,
      meetup: null,
    }),
    [state, setState] = useState<"loading" | "ready" | "error">("loading"),
    [filter, setFilter] = useState(FILTERS[0]);

  async function load(signal?: AbortSignal) {
    setState("loading");
    try {
      const response = await fetch("/api/events", { signal });
      if (!response.ok) throw Error();
      const data = (await response.json()) as {
        events?: PublicEvent[];
        channels?: EventChannels;
      };
      if (!Array.isArray(data.events)) throw Error();
      setEvents(data.events);
      if (data.channels?.luma) setChannels(data.channels);
      setState("ready");
    } catch {
      if (!signal?.aborted) setState("error");
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, []);

  const shown = events.filter(
    (e) =>
      filter === FILTERS[0] ||
      (filter === FILTERS[2] ? isSport(e) : !isSport(e)),
  );
  const [next, ...later] = shown;
  const months = new Map<string, PublicEvent[]>();
  for (const e of later) {
    const month = eventParts(e.starts_at, e.ends_at).monthLong;
    months.set(month, [...(months.get(month) ?? []), e]);
  }
  const sources = channels.meetup ? "Luma and Meetup" : "Luma";
  // With no dates, the follow actions move into the panel itself.
  const quiet = state === "ready" && !events.length;

  return (
    <section
      id="events"
      className="wrap section events-section"
      aria-labelledby="events-title"
    >
      <div className="events-head">
        <div>
          <div className="section-label">MEET IN PERSON</div>
          <h2 id="events-title">What’s coming up</h2>
          <p>
            Breakfasts, conversations and games around Abu Dhabi. Times are in
            Gulf Standard Time.
          </p>
        </div>
        <div className="event-channels">
          <p className="channels-status">
            <span className="live-dot" aria-hidden="true" />
            Updated live from {sources}
          </p>
          {!quiet && (
            <nav aria-label="Follow Founder House events">
              <a href={channels.luma} target="_blank" rel="noreferrer">
                <span className="channel-mark luma" aria-hidden="true" />
                Follow on Luma <ArrowUpRight size={15} />
              </a>
              {channels.meetup && (
                <a href={channels.meetup} target="_blank" rel="noreferrer">
                  <span className="channel-mark meetup" aria-hidden="true" />
                  Join on Meetup <ArrowUpRight size={15} />
                </a>
              )}
              <a href="/events/calendar.ics">
                <CalendarDays size={16} aria-hidden="true" />
                Subscribe to calendar
              </a>
            </nav>
          )}
        </div>
      </div>

      {state === "ready" && events.length > 1 && (
        <div
          className="filter-options events-filter"
          role="group"
          aria-label="Filter upcoming events"
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              className={filter === f ? "filter active" : "filter"}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      <div aria-live="polite" aria-busy={state === "loading"}>
        {state === "loading" ? (
          <div className="next-event is-skeleton">
            <div className="next-poster" />
            <div className="next-body">
              <span className="sr-only">Loading upcoming events…</span>
              <i />
              <i />
              <i />
            </div>
          </div>
        ) : state === "error" ? (
          <div className="event-empty">
            <CalendarDays size={28} aria-hidden="true" />
            <div>
              <h3>Events didn’t load.</h3>
              <p>
                Check your connection and try again, or see every date on the
                Founder House Luma calendar.
              </p>
            </div>
            <div className="event-empty-actions">
              <button className="button outline" onClick={() => void load()}>
                <RotateCcw size={17} /> Try again
              </button>
              <a
                className="quiet-link"
                href={channels.luma}
                target="_blank"
                rel="noreferrer"
              >
                Open Luma calendar <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        ) : !events.length ? (
          <QuietCalendar channels={channels} sources={sources} />
        ) : !next ? (
          <div className="event-empty">
            <CalendarDays size={28} aria-hidden="true" />
            <div>
              <h3>Nothing in this category yet.</h3>
              <p>Other gatherings are coming up.</p>
            </div>
            <button
              className="button outline"
              onClick={() => setFilter(FILTERS[0])}
            >
              Show all events
            </button>
          </div>
        ) : (
          <>
            <NextEvent e={next} />
            {[...months].map(([month, list]) => (
              <section className="agenda" key={month} aria-label={month}>
                <h3 className="agenda-month">{month}</h3>
                <ol>
                  {list.map((e) => (
                    <li key={e.id}>
                      <AgendaRow e={e} />
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </>
        )}
      </div>
      <div className="events-footnote">
        <LockKeyhole size={15} aria-hidden="true" />
        <p>
          The host confirms every registration on {sources}. Approved members
          can also reserve through <a href="/members">member access</a>.
        </p>
      </div>
    </section>
  );
}

function Platforms({ e }: { e: PublicEvent }) {
  const links = e.links ?? [];
  return (
    <span className="platforms">
      {links.length ? (
        links.map((l) => (
          <span key={l.platform} className="platform">
            <span
              className={"channel-mark " + l.platform.toLowerCase()}
              aria-hidden="true"
            />
            {l.platform}
          </span>
        ))
      ) : (
        <span className="platform">
          <LockKeyhole size={13} aria-hidden="true" />
          Members
        </span>
      )}
    </span>
  );
}

function NextEvent({ e }: { e: PublicEvent }) {
  const when = eventParts(e.starts_at, e.ends_at);
  const platform = registrationPlatform(e);
  const others = (e.links ?? []).filter((l) => l.url !== e.external_url);
  return (
    <article className="next-event">
      <a
        className="next-poster"
        href={href(e)}
        tabIndex={-1}
        aria-hidden="true"
      >
        <EventArt format={e.format} />
        <span className="poster-date">
          <strong>{when.day}</strong>
          {when.month}
        </span>
      </a>
      <div className="next-body">
        <p className="next-kicker">
          <span className="next-flag">Next gathering</span>
          <span>{daysAway(e.starts_at)}</span>
          <span>{e.format}</span>
        </p>
        <h3>
          <a href={href(e)}>{e.title}</a>
        </h3>
        {e.description && <p className="next-text">{e.description}</p>}
        <dl className="next-facts">
          <div>
            <dt>
              <CalendarDays size={16} aria-hidden="true" /> When
            </dt>
            <dd>
              {when.weekday} {when.day} {when.month}
              <br />
              {when.time} GST
            </dd>
          </div>
          <div>
            <dt>
              <MapPin size={16} aria-hidden="true" /> Where
            </dt>
            <dd>{e.area}</dd>
          </div>
        </dl>
      </div>
      <aside className="next-ticket" aria-label={"Registration for " + e.title}>
        <dl>
          {(e.price || !e.external_url) && (
            <div>
              <dt>
                <Ticket size={16} aria-hidden="true" /> Entry
              </dt>
              <dd>{e.price ?? "Members only"}</dd>
            </div>
          )}
          <div>
            <dt>
              <Users size={16} aria-hidden="true" /> Places
            </dt>
            <dd className={isFull(e) ? "is-full" : undefined}>
              {placesLabel(e)}
            </dd>
          </div>
        </dl>
        <span className="ticket-tear" aria-hidden="true" />
        <a className="button lime" href={href(e)}>
          {isFull(e) ? "See details" : "Reserve your place"}
          <ArrowRight size={18} />
        </a>
        <p className="ticket-via">
          <span>
            {platform ? (
              <>
                Registration on{" "}
                <a href={e.external_url!} target="_blank" rel="noreferrer">
                  {platform}
                </a>
              </>
            ) : (
              "Reserved through member access"
            )}
          </span>
          {others.map((l) => (
            <span key={l.platform}>
              Also on{" "}
              <a href={l.url} target="_blank" rel="noreferrer">
                {l.platform}
              </a>
            </span>
          ))}
        </p>
        <a
          className="quiet-link"
          href={googleCalendarUrl(e)}
          target="_blank"
          rel="noreferrer"
        >
          <CalendarPlus size={17} aria-hidden="true" /> Add to Google Calendar
        </a>
      </aside>
    </article>
  );
}

function AgendaRow({ e }: { e: PublicEvent }) {
  const when = eventParts(e.starts_at, e.ends_at);
  return (
    <a className="agenda-row" href={href(e)}>
      <time className="agenda-date" dateTime={e.starts_at}>
        <strong>{when.day}</strong>
        <span>{when.weekdayShort}</span>
      </time>
      <span className="agenda-art" aria-hidden="true">
        <EventArt format={e.format} />
      </span>
      <span className="agenda-main">
        <span className="agenda-meta">
          {when.time} GST
          <span className="agenda-format">{e.format}</span>
        </span>
        <span className="agenda-title">{e.title}</span>
        <span className="agenda-where">
          <MapPin size={15} aria-hidden="true" />
          {e.area}
        </span>
      </span>
      <span className="agenda-side">
        <Platforms e={e} />
        <span className={isFull(e) ? "agenda-places is-full" : "agenda-places"}>
          {placesLabel(e)}
        </span>
      </span>
      <ArrowUpRight className="agenda-go" size={22} aria-hidden="true" />
    </a>
  );
}

function QuietCalendar({
  channels,
  sources,
}: {
  channels: EventChannels;
  sources: string;
}) {
  return (
    <div className="quiet-calendar">
      <div className="quiet-copy">
        <h3>The next dates are being set.</h3>
        <p>
          New gatherings appear here as soon as they’re published on {sources}.
          Follow the calendar to hear first when registration opens.
        </p>
        <div className="quiet-actions">
          <a
            className="button lime"
            href={channels.luma}
            target="_blank"
            rel="noreferrer"
          >
            Follow on Luma <ArrowUpRight size={18} />
          </a>
          {channels.meetup && (
            <a
              className="button outline-light"
              href={channels.meetup}
              target="_blank"
              rel="noreferrer"
            >
              Join on Meetup <ArrowUpRight size={18} />
            </a>
          )}
          <a className="quiet-link" href="/events/calendar.ics">
            <CalendarDays size={17} aria-hidden="true" /> Subscribe to calendar
          </a>
        </div>
      </div>
      <ul className="quiet-arcade" aria-label="What we host">
        {[
          ["Founder breakfast", "Founder breakfasts"],
          ["Conversation", "Founder & investor conversations"],
          ["Sport & social", "Padel & team sports"],
        ].map(([format, label]) => (
          <li key={format}>
            <span className="quiet-window" aria-hidden="true">
              <EventArt format={format} />
            </span>
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
