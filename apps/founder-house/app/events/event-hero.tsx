import { CalendarDays, MapPin, Users } from "lucide-react";
import { EventArt } from "../event-art";
import {
  daysAway,
  eventParts,
  googleCalendarUrl,
  type PublicEvent,
} from "../../lib/events";

export function EventHero({ e }: { e: PublicEvent }) {
  const when = eventParts(e.starts_at, e.ends_at);
  const place = /abu dhabi/i.test(e.area) ? e.area : e.area + ", Abu Dhabi";
  const upcoming = new Date(e.ends_at).getTime() > Date.now();
  return (
    <div className="event-hero">
      <div className="event-hero-copy">
        <span className="section-label">{e.format}</span>
        <h1>{e.title}</h1>
        {upcoming && e.status !== "cancelled" && (
          <span className="event-hero-soon">{daysAway(e.starts_at)}</span>
        )}
        <dl className="event-hero-facts">
          <div>
            <dt>
              <CalendarDays size={19} /> When
            </dt>
            <dd>
              {when.weekday} {when.day} {when.month}
              <br />
              {when.time} GST
            </dd>
          </div>
          <div>
            <dt>
              <MapPin size={19} /> Where
            </dt>
            <dd>{place}</dd>
          </div>
          <div>
            <dt>
              <Users size={19} /> Places
            </dt>
            <dd>
              {e.capacity} {e.external_url ? "left" : "places"} · subject to
              approval
            </dd>
          </div>
        </dl>
        {upcoming && (
          <a
            className="quiet-link"
            href={googleCalendarUrl(e)}
            target="_blank"
            rel="noreferrer"
          >
            <CalendarDays size={17} /> Add to Google Calendar
          </a>
        )}
      </div>
      <div className="event-hero-poster">
        <EventArt format={e.format} />
        <span className="poster-date">
          <strong>{when.day}</strong>
          {when.month}
        </span>
      </div>
    </div>
  );
}
