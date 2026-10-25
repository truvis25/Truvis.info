import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  CalendarDays,
  MapPin,
  Users,
  ArrowUpRight,
  LockKeyhole,
} from "lucide-react";
import { Brand, Footer } from "../../house";
import { publicEvents } from "../../../lib/public-events";
import { HOUSE_ORIGIN, eventDate } from "../../../lib/events";
export const dynamic = "force-dynamic";
const getEvent = cache(async (id: string) => {
  if (!/^[a-f0-9-]{36}$/i.test(id)) notFound();
  const events = await publicEvents("/api/calendar");
  const event = events.find((e) => e.id === id);
  if (!event) notFound();
  return event;
});
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  return {
    title: event.title + " | Founder House",
    description: event.description.slice(0, 155),
    alternates: { canonical: "/events/" + event.id },
    openGraph: {
      title: event.title,
      description: event.description.slice(0, 155),
      url: HOUSE_ORIGIN + "/events/" + event.id,
      images: [
        {
          url: "/assets/brand/house-share-1200x630.png",
          width: 1200,
          height: 630,
          alt: "Founder House by TRUVIS",
        },
      ],
    },
  };
}
export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const e = await getEvent(id);
  const cancelled = e.status === "cancelled";
  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    description: e.description,
    startDate: e.starts_at,
    endDate: e.ends_at,
    eventStatus:
      "https://schema.org/" + (cancelled ? "EventCancelled" : "EventScheduled"),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: e.area,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Abu Dhabi",
        addressCountry: "AE",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "Founder House by TRUVIS",
      url: HOUSE_ORIGIN,
    },
    url: HOUSE_ORIGIN + "/events/" + e.id,
  };
  return (
    <>
      <div className="subheader">
        <header className="header wrap">
          <Brand />
          <a className="quiet-link" href="/#events">
            All events <ArrowUpRight size={16} />
          </a>
        </header>
      </div>
      <main className="wrap subpage event-detail">
        <span className="section-label">{e.format} · FOUNDER HOUSE</span>
        <h1>{e.title}</h1>
        {cancelled && (
          <div className="form-error" role="status">
            This event has been cancelled. Please check the upcoming events for
            another gathering.
          </div>
        )}
        <div className="event-meta">
          <p>
            <CalendarDays size={20} />
            <span>
              {eventDate(e.starts_at)}
              <br />
              Until {eventDate(e.ends_at)}
            </span>
          </p>
          <p>
            <MapPin size={20} />
            {e.area}, Abu Dhabi
          </p>
          <p>
            <Users size={20} />
            {e.capacity} places · Approved members
          </p>
        </div>
        <p className="event-description">{e.description}</p>
        <div className="notice">
          <LockKeyhole size={20} />
          <p>
            Members receive the exact venue details in their private member
            area. Apply to join first, then reserve a place. Any event costs are
            shared before you commit.
          </p>
        </div>
        {!cancelled && (
          <div className="hero-actions">
            <a className="button dark" href="/members">
              Member access & RSVP <ArrowUpRight size={18} />
            </a>
            <a className="button outline" href="/#apply">
              New here? Apply to join <ArrowUpRight size={18} />
            </a>
          </div>
        )}
        <a className="quiet-link" href="/events/calendar.ics">
          Subscribe to the events calendar <CalendarDays size={17} />
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      </main>
      <Footer />
    </>
  );
}
