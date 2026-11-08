import {
  ArrowDown,
  CalendarDays,
  MapPin,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";
import { EventArt } from "../event-art";
import {
  daysAway,
  eventParts,
  placesLabel,
  registrationPlatform,
  type PublicEvent,
} from "../../lib/events";

export function EventHero({ e }: { e: PublicEvent }) {
  const when = eventParts(e.starts_at, e.ends_at);
  const place = /abu dhabi/i.test(e.area) ? e.area : e.area + ", Abu Dhabi";
  const upcoming =
    new Date(e.ends_at).getTime() > Date.now() && e.status !== "cancelled";
  const platform = registrationPlatform(e);
  const facts: Array<[LucideIcon, string, React.ReactNode]> = [
    [
      CalendarDays,
      "When",
      <>
        {when.weekday} {when.day} {when.month}
        <br />
        {when.time} GST
      </>,
    ],
    [MapPin, "Where", place],
  ];
  if (e.price) facts.push([Ticket, "Entry", e.price]);
  facts.push([Users, "Places", placesLabel(e)]);
  return (
    <div className="event-hero">
      <div className="event-hero-copy">
        <div className="event-hero-tags">
          <span className="section-label">{e.format}</span>
          {upcoming && (
            <span className="event-hero-soon">{daysAway(e.starts_at)}</span>
          )}
        </div>
        <h1>{e.title}</h1>
        <dl className="event-hero-facts">
          {facts.map(([Icon, label, value]) => (
            <div key={label}>
              <dt>
                <Icon size={18} aria-hidden="true" /> {label}
              </dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {upcoming && (
          <a className="button dark" href="#register">
            {platform === "Meetup"
              ? "RSVP on Meetup"
              : platform
                ? "Register on Luma"
                : "Reserve your place"}
            <ArrowDown size={18} />
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
