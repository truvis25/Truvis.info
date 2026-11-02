import type { Metadata } from "next";
import {
  ArrowUpRight,
  CalendarDays,
  MapPin,
  Users,
  ShieldCheck,
} from "lucide-react";
import { Brand, Footer } from "../../house";
import { eventDate } from "../../../lib/events";
import { upcomingExternalEvents } from "../../../lib/external-events";

const EVENT_ID = "luma-pk2m8tdp";
const LUMA_URL = "https://luma.com/pk2m8tdp";
const LUMA_EMBED = "https://luma.com/embed/event/evt-EoVSOdqTbsOowoI/simple";

export const metadata: Metadata = {
  title: "Founder House Breakfast | Founder House",
  description:
    "A small Founder House breakfast for founders, startup teams and investors in Abu Dhabi.",
  alternates: { canonical: `/events/${EVENT_ID}` },
  openGraph: {
    title: "Founder House Breakfast",
    description:
      "A curated breakfast for founders, startup teams and investors in Abu Dhabi.",
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

export default async function FounderHouseBreakfastLumaPage() {
  const event =
    (await upcomingExternalEvents(0)).find((item) => item.id === EVENT_ID) ??
    null;
  if (!event) return null;

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
        <span className="section-label">{event.format} · FOUNDER HOUSE</span>
        <h1>{event.title}</h1>

        <div className="event-meta">
          <p>
            <CalendarDays size={20} />
            <span>
              {eventDate(event.starts_at)}
              <br />
              Until {eventDate(event.ends_at)}
            </span>
          </p>
          <p>
            <MapPin size={20} />
            {event.area}, Abu Dhabi
          </p>
          <p>
            <Users size={20} />
            {event.capacity} places · Registration subject to approval
          </p>
        </div>

        <p className="event-description">{event.description}</p>

        <div className="notice">
          <ShieldCheck size={20} />
          <p>
            Registration: AED 40–80. Breakfast and drinks are paid individually
            at the venue.
          </p>
        </div>

        <section
          aria-labelledby="registration-heading"
          style={{ marginTop: 42, marginBottom: 34 }}
        >
          <div style={{ marginBottom: 18 }}>
            <span className="section-label">REGISTRATION</span>
            <h2
              id="registration-heading"
              style={{ marginTop: 10, fontSize: "clamp(32px, 4vw, 48px)" }}
            >
              Reserve your place
            </h2>
          </div>

          <div
            style={{
              overflow: "hidden",
              border: "1px solid #d3ddd1",
              borderRadius: 20,
              background: "#fff",
            }}
          >
            <iframe
              src={LUMA_EMBED}
              title="Founder House Breakfast registration"
              width="100%"
              height="540"
              frameBorder="0"
              style={{ display: "block", width: "100%", border: 0 }}
              allow="fullscreen; payment"
              allowFullScreen
              tabIndex={0}
            />
          </div>

          <p style={{ marginTop: 14, fontSize: 15 }}>
            Having trouble with the form?{" "}
            <a
              className="text-link"
              href={LUMA_URL}
              target="_blank"
              rel="noreferrer"
            >
              Open registration on Luma <ArrowUpRight size={15} />
            </a>
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
