import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowUpRight,
  CalendarDays,
  CalendarPlus,
  LockKeyhole,
} from "lucide-react";
import { Brand, Footer } from "../../house";
import { publicEvents } from "../../../lib/public-events";
import {
  combineEvents,
  upcomingExternalEvents,
} from "../../../lib/external-events";
import {
  HOUSE_ORIGIN,
  googleCalendarUrl,
  registrationPlatform,
  type PublicEvent,
} from "../../../lib/events";
import { EventHero } from "../event-hero";
export const dynamic = "force-dynamic";
const getEvent = cache(async (id: string): Promise<PublicEvent> => {
  if (/^(luma|meetup)-[A-Za-z0-9_-]+$/.test(id)) {
    const event = (await upcomingExternalEvents(0)).find((e) => e.id === id);
    if (!event) notFound();
    return event;
  }
  if (!/^[a-f0-9-]{36}$/i.test(id)) notFound();
  const events = await publicEvents("/api/calendar");
  const event = events.find((e) => e.id === id);
  if (!event) notFound();
  // Attach the event's Luma and Meetup listings, if it has any.
  return (
    combineEvents([event], await upcomingExternalEvents(0)).find(
      (e) => e.id === id,
    ) ?? event
  );
});
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  const summary = (event.description || event.title).slice(0, 155);
  return {
    title: event.title + " | Founder House",
    description: summary,
    alternates: { canonical: "/events/" + event.id },
    openGraph: {
      title: event.title,
      description: summary,
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
  const platform = registrationPlatform(e);
  const others = (e.links ?? []).filter((l) => l.url !== e.external_url);
  const full = e.availability === "sold-out" || e.availability === "closed";
  const embed =
    platform === "Luma" &&
    e.luma_api_id &&
    /^evt-[A-Za-z0-9]+$/.test(e.luma_api_id)
      ? "https://luma.com/embed/event/" + e.luma_api_id + "/simple"
      : null;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    description: e.description || e.title,
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
    ...(e.external_url
      ? {
          offers: {
            "@type": "Offer",
            url: e.external_url,
            availability:
              "https://schema.org/" + (full ? "SoldOut" : "InStock"),
          },
        }
      : {}),
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
        <EventHero e={e} />
        {cancelled && (
          <div className="form-error" role="status">
            This event has been cancelled. Please check the upcoming events for
            another gathering.
          </div>
        )}
        <div className="event-body">
          {!cancelled && (
            <aside
              id="register"
              className="event-register"
              aria-labelledby="register-heading"
            >
              <h2 id="register-heading">
                {full ? "Registration" : "Reserve your place"}
              </h2>
              {embed && !full ? (
                <>
                  <div className="luma-embed">
                    <iframe
                      src={embed}
                      title={"Register for " + e.title + " on Luma"}
                      width="100%"
                      height="640"
                      allow="fullscreen; payment"
                    />
                  </div>
                  <p className="register-help">
                    Form not loading?{" "}
                    <a href={e.external_url!} target="_blank" rel="noreferrer">
                      Open registration on Luma <ArrowUpRight size={15} />
                    </a>
                  </p>
                </>
              ) : platform ? (
                <>
                  <p className="register-lede">
                    {full
                      ? "This gathering is fully booked. The listing shows any waitlist or released places."
                      : platform === "Meetup"
                        ? "RSVP on Meetup. The host confirms each place."
                        : "Register on Luma. The host confirms each place."}
                  </p>
                  <a
                    className="button dark"
                    href={e.external_url!}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {platform === "Meetup"
                      ? "RSVP on Meetup"
                      : "Register on Luma"}
                    <ArrowUpRight size={18} />
                  </a>
                </>
              ) : (
                <>
                  <p className="register-lede">
                    Approved members reserve their place in member access.
                  </p>
                  <a className="button dark" href="/members">
                    Member access & RSVP <ArrowUpRight size={18} />
                  </a>
                  <a className="button outline" href="/#apply">
                    New here? Apply to join <ArrowUpRight size={18} />
                  </a>
                </>
              )}
              {others.length > 0 && (
                <p className="register-also">
                  Also listed on{" "}
                  {others.map((l, i) => (
                    <span key={l.platform}>
                      {i > 0 && " and "}
                      <a href={l.url} target="_blank" rel="noreferrer">
                        {l.platform}
                      </a>
                    </span>
                  ))}
                </p>
              )}
              <div className="register-calendar">
                <a
                  className="quiet-link"
                  href={googleCalendarUrl(e)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <CalendarPlus size={17} aria-hidden="true" /> Add to Google
                  Calendar
                </a>
                <a className="quiet-link" href="/events/calendar.ics">
                  <CalendarDays size={17} aria-hidden="true" /> Subscribe to all
                  events
                </a>
              </div>
            </aside>
          )}
          <section className="event-about" aria-labelledby="about-heading">
            <h2 id="about-heading">About this gathering</h2>
            {e.description ? (
              <p className="event-description">{e.description}</p>
            ) : (
              <p className="event-description">
                Details are on the {platform ?? "event"} listing.
              </p>
            )}
            <div className="notice">
              <LockKeyhole size={20} aria-hidden="true" />
              {platform ? (
                <p>
                  The exact venue is shared with confirmed guests. New to
                  Founder House?{" "}
                  <a href="/#apply">Apply to join the community</a>.
                </p>
              ) : (
                <p>
                  Events are for approved members. Apply to join first, then
                  reserve a place. Any event costs are shared before you commit.
                </p>
              )}
            </div>
          </section>
        </div>
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
