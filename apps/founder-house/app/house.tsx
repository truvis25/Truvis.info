"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  MapPin,
  Menu,
  X,
  Coffee,
  Users,
  HeartHandshake,
  LockKeyhole,
  Plus,
  CalendarDays,
  Bell,
  CircleDot,
  Sprout,
  Lightbulb,
  Compass,
  Phone,
} from "lucide-react";
import type { PublicEvent } from "../lib/events";
import { HouseMark } from "./brand-mark";

const roleCopy = {
  Founder: true,
  "Startup team": true,
  "Angel investor": true,
  VC: true,
  "Family office": true,
  "Ecosystem operator": true,
};
const interests = [
  "Breakfasts",
  "Founder circles",
  "Investor conversations",
  "Padel",
  "Football",
  "Volleyball",
  "UAE market entry",
];
const formats = [
  {
    name: "Coffee & founder breakfasts",
    icon: Coffee,
    text: "Meet a small group of founders and investors over coffee. Introduce yourself, share what you’re working on and get to know each other.",
  },
  {
    name: "Founder & investor conversations",
    icon: HeartHandshake,
    text: "Talk through a business challenge, share your experience and meet people with relevant ideas or introductions.",
  },
  {
    name: "Padel & team sports",
    icon: CircleDot,
    text: "Get to know people through padel, football and volleyball. A relaxed way to make friends in the founder community.",
  },
];
const faqs = [
  {
    q: "Who can join?",
    a: "Founders, startup teams, angel investors, venture capital and family office professionals, and people who help startups grow. We’re starting in Abu Dhabi and welcome people with a clear connection to the UAE.",
  },
  {
    q: "Is Founder House a physical venue?",
    a: "Founder House is a community by TRUVIS. We’re starting with gatherings at selected venues around Abu Dhabi. We don’t have a permanent clubhouse or offer accommodation at this stage.",
  },
  {
    q: "How do I attend an event?",
    a: "Apply to join the community first. Once approved, you’ll receive private member access, where you can reserve a place at upcoming events. Each event has its own capacity; membership alone doesn’t reserve a place.",
  },
  {
    q: "Does it cost anything?",
    a: "Applying is free. We’ll share any membership terms or event costs, such as food or court fees, before you commit. There is no paid membership plan at this stage.",
  },
  {
    q: "Can I meet investors?",
    a: "Investor conversations are part of the community we’re building. Introductions depend on relevance and both people agreeing. Membership doesn’t guarantee an introduction or funding.",
  },
  {
    q: "Can I join before moving to Abu Dhabi?",
    a: "Yes. If you’re building a startup or working in the startup community and planning to come to the UAE, tell us your plans in your application.",
  },
];
export function Brand() {
  return (
    <a href="/" className="brand" aria-label="Founder House by TRUVIS home">
      <img
        src="/assets/brand/house-horizontal-green-600.webp"
        srcSet="/assets/brand/house-horizontal-green-600.webp 600w, /assets/brand/house-horizontal-green-1200.webp 1200w"
        sizes="(max-width: 380px) 136px, (max-width: 700px) 172px, (max-width: 900px) 200px, 238px"
        alt="Founder House by TRUVIS"
        width="600"
        height="223"
        fetchPriority="high"
      />
    </a>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer wrap">
        <div className="footer-art" aria-hidden="true">
          <div className="footer-art-door">
            <span />
          </div>
          <div className="footer-art-star" />
          <HouseMark
            className="footer-art-mark"
            sizes="(max-width: 700px) 18vw, 220px"
          />
          <div className="footer-art-window">
            <span />
          </div>
        </div>
        <div className="footer-info">
          <div className="footer-intro">
            <p>
              A community by{" "}
              <a href="https://truvis.ae/" target="_blank" rel="noreferrer">
                truvis.ae <ArrowUpRight size={16} />
              </a>
            </p>
            <nav className="footer-quicklinks" aria-label="Community links">
              <a href="/#apply">
                Join the house <ArrowUpRight size={16} />
              </a>
              <a href="/#events">
                Upcoming gatherings <ArrowUpRight size={16} />
              </a>
            </nav>
          </div>
          <address className="footer-office">
            <span className="footer-office-name">
              TRUVIS International Services
            </span>
            <span>
              Level 36, Tower 3, Etihad Towers
              <br />
              Abu Dhabi, United Arab Emirates
            </span>
            <a href="tel:+97124093184">
              <Phone size={17} aria-hidden="true" />
              +971 2 409 3184
            </a>
          </address>
          <a className="footer-email" href="mailto:info@truvis.info">
            info@truvis.info <ArrowUpRight size={25} />
          </a>
        </div>
        <a className="footer-wordmark" href="/" aria-label="Founder House home">
          <img
            src="/assets/brand/house-horizontal-green-1200.webp"
            srcSet="/assets/brand/house-horizontal-green-600.webp 600w, /assets/brand/house-horizontal-green-1200.webp 1200w, /assets/brand/house-horizontal-green-1831.webp 1831w"
            sizes="(max-width: 700px) calc(100vw - 40px), (max-width: 1080px) calc(100vw - 64px), 1000px"
            alt="Founder House by TRUVIS"
            width="1831"
            height="680"
            loading="lazy"
            decoding="async"
          />
        </a>
        <div className="footer-bottom">
          <span className="copyright">
            © 2026{" "}
            <a href="https://truvis.ae/" target="_blank" rel="noreferrer">
              truvis.ae
            </a>
            . All rights reserved.
          </span>
          <nav className="footer-legal" aria-label="Footer navigation">
            <a href="https://truvis.info/" target="_blank" rel="noreferrer">
              truvis.info <ArrowUpRight size={14} />
            </a>
            <a href="/privacy">Privacy</a>
            <a href="/community">Community principles</a>
            <a href="/admin">Organiser access</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
export default function House() {
  const [menu, setMenu] = useState(false),
    [filter, setFilter] = useState("All events"),
    [events, setEvents] = useState<PublicEvent[]>([]),
    [eventsState, setEventsState] = useState<"loading" | "ready" | "error">(
      "loading",
    ),
    [step, setStep] = useState(1),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(false),
    [chosen, setChosen] = useState(["Breakfasts"]),
    [fileName, setFileName] = useState(""),
    [applicationRole, setApplicationRole] = useState("Founder"),
    [cityChoice, setCityChoice] = useState("");
  const form = useRef<HTMLFormElement>(null);
  async function loadEvents(signal?: AbortSignal) {
    setEventsState("loading");
    try {
      const response = await fetch("/api/events", { signal });
      if (!response.ok) throw Error();
      const data = await response.json();
      if (!Array.isArray(data.events)) throw Error();
      setEvents(data.events);
      setEventsState("ready");
    } catch {
      if (!signal?.aborted) setEventsState("error");
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    void loadEvents(controller.signal);
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (success) document.getElementById("application-success")?.focus();
  }, [success]);
  useEffect(() => {
    if (error) document.getElementById("application-error")?.focus();
  }, [error, step]);
  function changeStep(value: number) {
    setError("");
    setStep(value);
    setTimeout(
      () => document.getElementById("application-step-title")?.focus(),
      0,
    );
  }
  function next() {
    setError("");
    const linkedin = form.current?.elements.namedItem(
      "linkedin",
    ) as HTMLInputElement;
    if (linkedin?.value) {
      let valid = false;
      try {
        const url = new URL(linkedin.value.trim());
        valid =
          url.protocol === "https:" &&
          /(^|\.)linkedin\.com$/.test(url.hostname) &&
          url.pathname.startsWith("/in/");
      } catch {}
      linkedin.setCustomValidity(
        valid
          ? ""
          : "Use your personal LinkedIn profile: https://www.linkedin.com/in/your-name",
      );
    }
    for (const node of form.current?.querySelectorAll(
      "[data-step='1'] input,[data-step='1'] select",
    ) ?? []) {
      const el = node as unknown as {
        checkValidity(): boolean;
        reportValidity(): boolean;
      };
      if (!el.checkValidity()) {
        el.reportValidity();
        return;
      }
    }
    const values = new FormData(form.current!);
    const cv = values.get("cv") as File;
    if (!values.get("linkedin") && !cv?.size) {
      setError(
        "Add your personal LinkedIn profile or a PDF CV before continuing.",
      );
      return;
    }
    changeStep(2);
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (step === 1) {
      next();
      return;
    }
    setError("");
    for (const node of form.current?.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >(
      "[data-step='2'] input,[data-step='2'] textarea,[data-step='2'] select",
    ) ?? []) {
      if (!node.checkValidity()) {
        node.reportValidity();
        return;
      }
    }
    const data = new FormData(e.currentTarget),
      file = data.get("cv") as File;
    if (!data.get("linkedin") && !file?.size) {
      setError("Add a personal LinkedIn profile or a PDF CV.");
      setStep(1);
      return;
    }
    if (!chosen.length) {
      setError("Choose at least one interest.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/apply", { method: "POST", body: data }),
        d = (await r.json()) as { error?: string };
      if (!r.ok) throw Error(d.error || "Please try again.");
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const shownEvents = events.filter(
    (e) =>
      filter === "All events" ||
      (filter === "Sport & social"
        ? /padel|football|volleyball|sport/i.test(e.format)
        : !/padel|football|volleyball|sport/i.test(e.format)),
  );
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="header wrap">
        <Brand />
        <nav
          id="main-nav"
          className={menu ? "nav open" : "nav"}
          aria-label="Main navigation"
        >
          <a href="#events" onClick={() => setMenu(false)}>
            Events
          </a>
          <a href="#about" onClick={() => setMenu(false)}>
            The community
          </a>
          <a href="/members">
            Member access <ArrowUpRight size={14} />
          </a>
        </nav>
        <a className="button dark nav-cta" href="#apply">
          Join us <ArrowUpRight size={17} />
        </a>
        <button
          className="mobile-menu icon-button"
          aria-controls="main-nav"
          aria-label={menu ? "Close menu" : "Open menu"}
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <main id="main-content">
        <section className="hero courtyard-hero" id="first-hello">
          <picture className="courtyard-art" aria-hidden="true">
            <source
              media="(max-width: 700px)"
              srcSet="/assets/courtyard-mobile.svg"
            />
            <img src="/assets/courtyard.svg" alt="" width="1440" height="860" />
          </picture>
          <HouseMark
            className="hero-house-mark"
            tone="white"
            sizes="48px"
            eager
          />
          <div className="hero-copy wrap">
            <div className="eyebrow">
              <span className="live-dot" /> FOUNDER HOUSE · ABU DHABI
            </div>
            <h1>
              A home for founders.
              <br />
              <span>A future built together.</span>
            </h1>
            <p>
              A community for founders, startup teams and investors in Abu
              Dhabi. Meet over coffee, share what you know and build lasting
              friendships.
            </p>
            <div className="hero-actions">
              <a className="button lime" href="#apply">
                Join the community <ArrowUpRight size={19} />
              </a>
              <a className="button outline hero-secondary" href="#events">
                See upcoming events <ArrowRight size={18} />
              </a>
            </div>
            <div className="hero-note">
              <Check size={16} />
              Free to apply · Every application personally reviewed
            </div>
          </div>
          <div className="hero-welcome">
            <span>Make yourself at home.</span>
            <a href="#events" aria-label="Explore upcoming gatherings">
              <ArrowRight size={22} />
            </a>
          </div>
        </section>
        <div className="community-strip">
          <div className="wrap">
            <span>
              <Users size={19} />
              Founders & startup teams
            </span>
            <span>
              <HeartHandshake size={19} />
              Angels, VCs & family offices
            </span>
            <span>
              <Coffee size={19} />
              Small gatherings. Personal connections.
            </span>
          </div>
        </div>
        <section id="events" className="wrap section events-section">
          <div className="section-top">
            <div>
              <div className="section-label">MEET IN PERSON</div>
              <h2>What’s coming up</h2>
            </div>
            <p>
              Find your next coffee, conversation or game.
              <br />
              Event times are shown in Abu Dhabi time.
            </p>
          </div>
          <div className="filter-row">
            <div
              className="filter-options"
              role="group"
              aria-label="Filter upcoming events"
            >
              {["All events", "Conversations", "Sport & social"].map((f) => (
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
            <a className="quiet-link calendar-link" href="/events/calendar.ics">
              <CalendarDays size={17} />
              Subscribe to calendar
            </a>
          </div>
          <div aria-live="polite" aria-busy={eventsState === "loading"}>
            {eventsState === "loading" ? (
              <div className="event-empty loading-events">
                <CalendarDays size={28} />
                <p>Loading upcoming events…</p>
              </div>
            ) : eventsState === "error" ? (
              <div className="event-empty">
                <CalendarDays size={28} />
                <div>
                  <h3>We couldn’t load the events.</h3>
                  <p>Please try again, or contact us at info@truvis.info.</p>
                </div>
                <button
                  className="button outline"
                  onClick={() => void loadEvents()}
                >
                  Try again <ArrowRight size={17} />
                </button>
              </div>
            ) : !events.length ? (
              <div className="event-empty first-events">
                <div className="empty-icon">
                  <CalendarDays size={37} strokeWidth={1.5} />
                  <span>See you soon.</span>
                </div>
                <div>
                  <span className="section-label">
                    FIRST EVENTS COMING SOON
                  </span>
                  <h3>We’re planning our first gatherings.</h3>
                  <p>
                    Dates and venues will appear here as soon as they’re
                    confirmed.
                    <br />
                    Apply to join and choose the events you’re interested in.
                  </p>
                  <div className="empty-formats">
                    <span>
                      <Coffee size={15} />
                      Founder breakfasts
                    </span>
                    <span>
                      <Users size={15} />
                      Small group conversations
                    </span>
                    <span>
                      <CircleDot size={15} />
                      Padel & team sports
                    </span>
                  </div>
                </div>
                <a className="button dark" href="#apply">
                  Keep me posted <Bell size={17} />
                </a>
              </div>
            ) : !shownEvents.length ? (
              <div className="event-empty">
                <p>No upcoming events in this category yet.</p>
                <button
                  className="button outline"
                  onClick={() => setFilter("All events")}
                >
                  See all events
                </button>
              </div>
            ) : (
              <div className="event-grid">
                {shownEvents.map((e) => (
                  <a
                    className="public-event-card"
                    href={"/events/" + e.id}
                    key={e.id}
                  >
                    <div className="event-date">
                      <strong>
                        {new Intl.DateTimeFormat("en-GB", {
                          day: "2-digit",
                          timeZone: "Asia/Dubai",
                        }).format(new Date(e.starts_at))}
                      </strong>
                      <span>
                        {new Intl.DateTimeFormat("en-GB", {
                          month: "short",
                          timeZone: "Asia/Dubai",
                        }).format(new Date(e.starts_at))}
                      </span>
                    </div>
                    <div>
                      <span className="section-label">{e.format}</span>
                      <h3>{e.title}</h3>
                      <p>
                        {new Intl.DateTimeFormat("en-GB", {
                          weekday: "long",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Dubai",
                        }).format(new Date(e.starts_at))}{" "}
                        GST
                      </p>
                      <p>
                        <MapPin size={14} />
                        {e.area}
                      </p>
                      <span className="event-members">
                        Approved members · {e.capacity} places
                      </span>
                    </div>
                    <ArrowUpRight size={21} />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="events-footnote">
            <LockKeyhole size={15} />
            <p>
              Events are for approved members. Reserve your place through your{" "}
              <a href="/members">member access</a>.
            </p>
          </div>
        </section>
        <section id="people" className="people-intro wrap section">
          <figure className="community-photo">
            <img
              src="/assets/community-terrace.webp"
              width="1536"
              height="1024"
              loading="lazy"
              alt="Illustration of founders sharing a breakfast conversation in Abu Dhabi"
            />
            <figcaption>
              <span>Good company starts with a hello.</span>
              <small>Community concept · Illustrative image</small>
            </figcaption>
          </figure>
          <div>
            <div className="section-label">WHO YOU’LL MEET</div>
            <h2>
              Come for the ideas.
              <br />
              Stay for the people.
            </h2>
            <p>
              Building a company, backing one or helping a team grow? There’s a
              place to start a conversation here.
            </p>
          </div>
          <div className="people-types">
            <article>
              <Sprout size={23} aria-hidden="true" />
              <h3>Founders & startup teams</h3>
              <p>
                Meet people building businesses and navigating similar
                challenges.
              </p>
            </article>
            <article>
              <Lightbulb size={23} aria-hidden="true" />
              <h3>Angels & venture capital</h3>
              <p>
                Get to know founders through conversations and shared interests.
              </p>
            </article>
            <article>
              <HeartHandshake size={23} aria-hidden="true" />
              <h3>Family offices</h3>
              <p>
                Build relationships with founders and others active in the local
                community.
              </p>
            </article>
            <article>
              <Compass size={23} aria-hidden="true" />
              <h3>People who help startups</h3>
              <p>
                Share your experience in building, hiring, growing or entering
                the UAE.
              </p>
            </article>
          </div>
        </section>
        <section id="about" className="about-section">
          <div className="wrap section">
            <div className="section-top">
              <div>
                <div className="section-label">WHAT IS FOUNDER HOUSE?</div>
                <h2>
                  A coffee. A conversation.
                  <br />A game. A good start.
                </h2>
              </div>
              <p>
                We’re a community by TRUVIS for people building businesses,
                backing founders and helping startups grow. We meet at venues
                across Abu Dhabi.
              </p>
            </div>
            <div className="format-grid">
              {formats.map((f, i) => (
                <article className="format-card" key={f.name}>
                  <div className="format-top">
                    <f.icon size={26} strokeWidth={1.6} />
                    <span>0{i + 1}</span>
                  </div>
                  <div className="format-visual" aria-hidden="true">
                    {i === 0 ? (
                      <>
                        <Coffee />
                        <span className="conversation-dot">hello.</span>
                      </>
                    ) : i === 1 ? (
                      <>
                        <span className="speech speech-one">What if?</span>
                        <span className="speech speech-two">Let’s talk.</span>
                      </>
                    ) : (
                      <>
                        <span className="court-line" />
                        <CircleDot />
                        <span className="sport-ball" />
                      </>
                    )}
                  </div>
                  <h3>{f.name}</h3>
                  <p>{f.text}</p>
                  <span className="format-bottom">
                    Planned gathering format
                  </span>
                </article>
              ))}
            </div>
            <div className="house-invite">
              <HouseMark className="invite-mark" sizes="72px" />
              <div>
                <h3>Come as a person. Bring what you know.</h3>
                <p>
                  A useful introduction, an honest question or time for a game.
                  Start with something you share, and get to know each other
                  from there.
                </p>
              </div>
              <a className="button" href="#apply">
                Find your place <ArrowUpRight size={18} />
              </a>
            </div>
          </div>
        </section>
        <section id="how-it-works" className="journey wrap section">
          <div>
            <div className="section-label">HOW TO JOIN</div>
            <h2>
              Start with
              <br />
              an introduction.
            </h2>
            <p className="journey-intro">
              Founders, startup teams, angels, VCs, family offices and people
              supporting startups are welcome to apply.
            </p>
          </div>
          <ol>
            {[
              [
                "Apply to join",
                "Tell us about your work, who you’d like to meet and what you could share.",
              ],
              [
                "We review your application",
                "Our team reads every application to build a relevant, welcoming community.",
              ],
              [
                "Choose an event and meet",
                "Once approved, use your member access to reserve a place at an upcoming gathering.",
              ],
            ].map(([title, text], i) => (
              <li key={title}>
                <span>0{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section id="apply" className="apply-section">
          <div className="wrap apply-grid">
            <div className="apply-copy">
              <div className="eyebrow">
                <span className="live-dot" /> JOIN THE COMMUNITY
              </div>
              <h2>
                A few details.
                <br />
                Then let’s meet.
              </h2>
              <p>
                Tell us what you do and who you’d like to meet. Our team reviews
                every application and gets in touch personally.
              </p>
              <div className="apply-reassurance">
                <LockKeyhole size={21} />
                <p>
                  Your details stay with the review team.
                  <br />
                  Your profile is never a public listing.
                </p>
              </div>
              <HouseMark className="apply-mark" tone="white" />
            </div>
            <div className="application-card">
              {success ? (
                <div
                  className="success-message"
                  role="status"
                  id="application-success"
                  tabIndex={-1}
                >
                  <div className="success-icon">
                    <Check size={42} />
                  </div>
                  <span className="section-label">APPLICATION RECEIVED</span>
                  <h3>Thanks for applying.</h3>
                  <p>
                    We’ll review your application and contact you using the
                    details you shared. If you’ve applied before, your existing
                    application is still with us.
                  </p>
                  <div className="success-next">
                    <span>WHAT HAPPENS NEXT</span>
                    <ol>
                      <li>Our team reviews your application.</li>
                      <li>We contact you with a membership decision.</li>
                      <li>If approved, you receive access to member events.</li>
                    </ol>
                  </div>
                  <a href="#events" className="text-link">
                    See upcoming events <ArrowUpRight size={18} />
                  </a>
                </div>
              ) : (
                <form ref={form} onSubmit={submit} aria-busy={busy} noValidate>
                  <div className="form-heading">
                    <span>MEMBERSHIP APPLICATION</span>
                    <span>Step {step} of 2</span>
                  </div>
                  <div className="form-step-labels">
                    <span
                      className={step === 1 ? "current" : "complete"}
                      aria-current={step === 1 ? "step" : undefined}
                    >
                      01 · Your details
                    </span>
                    <span
                      className={step === 2 ? "current" : ""}
                      aria-current={step === 2 ? "step" : undefined}
                    >
                      02 · Work & interests
                    </span>
                  </div>
                  <div
                    className="progress-track"
                    role="progressbar"
                    aria-label="Application progress"
                    aria-valuenow={step}
                    aria-valuemin={0}
                    aria-valuemax={2}
                  >
                    <i style={{ width: step === 1 ? "50%" : "100%" }} />
                  </div>
                  <h3 id="application-step-title" tabIndex={-1}>
                    {step === 1 ? "Your details" : "Your work and interests"}
                  </h3>
                  <p className="form-subtitle">
                    {step === 1
                      ? "A few details to help us get to know you."
                      : "Help us understand what you’re working on and how we can connect you."}
                  </p>
                  <p className="form-required-note">
                    All fields are required unless marked optional.
                  </p>
                  <div data-step="1" hidden={step !== 1}>
                    <div className="form-row">
                      <label>
                        Full name
                        <input
                          required
                          autoComplete="name"
                          name="name"
                          placeholder="Your name"
                          minLength={2}
                          maxLength={100}
                        />
                      </label>
                      <label>
                        Email
                        <input
                          required
                          autoComplete="email"
                          name="email"
                          type="email"
                          maxLength={254}
                          autoCapitalize="none"
                          placeholder="you@company.com"
                        />
                      </label>
                    </div>
                    <div className="form-row">
                      <label>
                        Phone number
                        <input
                          required
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="+971 50 123 4567"
                          pattern={"\\+?[0-9\\s\\(\\)\\-]{7,30}"}
                        />
                      </label>
                      <label>
                        Based in
                        <select
                          required
                          name={cityChoice === "other" ? undefined : "city"}
                          autoComplete="address-level2"
                          value={cityChoice}
                          onChange={(e) => setCityChoice(e.target.value)}
                        >
                          <option value="" disabled>
                            Select your city
                          </option>
                          {[
                            "Abu Dhabi",
                            "Dubai",
                            "Al Ain",
                            "Sharjah",
                            "Ajman",
                            "Ras Al Khaimah",
                            "Fujairah",
                            "Umm Al Quwain",
                          ].map((city) => (
                            <option key={city}>{city}</option>
                          ))}
                          <option value="other">Another city</option>
                        </select>
                      </label>
                    </div>
                    {cityChoice === "other" && (
                      <label>
                        City and country
                        <input
                          required
                          name="city"
                          autoComplete="address-level2"
                          placeholder="e.g. London, United Kingdom"
                          minLength={2}
                          maxLength={100}
                        />
                      </label>
                    )}
                    <label>
                      I’m joining as
                      <select
                        required
                        name="role"
                        value={applicationRole}
                        onChange={(e) => setApplicationRole(e.target.value)}
                      >
                        {Object.keys(roleCopy).map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </label>
                    <div className="form-row">
                      <label>
                        Company / organisation
                        <input
                          required
                          name="organisation"
                          autoComplete="organization"
                          placeholder="Company, fund or project"
                          minLength={2}
                          maxLength={150}
                        />
                      </label>
                      <label>
                        Your role / title
                        <input
                          required
                          name="title"
                          autoComplete="organization-title"
                          placeholder="e.g. Co-founder"
                          minLength={2}
                          maxLength={100}
                        />
                      </label>
                    </div>
                    <fieldset className="profile-options">
                      <legend>LinkedIn or CV</legend>
                      <p className="field-hint" id="profile-help">
                        Share your personal LinkedIn profile or upload a PDF CV.
                        One is enough.
                      </p>
                      <label>
                        LinkedIn profile
                        <input
                          name="linkedin"
                          type="url"
                          maxLength={400}
                          autoCapitalize="none"
                          spellCheck={false}
                          aria-describedby="profile-help"
                          onInput={(e) => e.currentTarget.setCustomValidity("")}
                          placeholder="https://www.linkedin.com/in/you"
                        />
                      </label>
                      <label className="upload-label">
                        <span>
                          {fileName || "Upload your CV"}
                          <small>PDF only · up to 3 MB</small>
                        </span>
                        <Plus size={21} />
                        <input
                          type="file"
                          name="cv"
                          accept="application/pdf,.pdf"
                          aria-label="Upload PDF CV"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (
                              f &&
                              (f.size > 3145728 ||
                                !f.name.toLowerCase().endsWith(".pdf"))
                            ) {
                              setError("Choose a PDF file up to 3 MB.");
                              e.target.value = "";
                              setFileName("");
                            } else {
                              setFileName(f?.name || "");
                              setError("");
                            }
                          }}
                        />
                      </label>
                      {fileName && (
                        <button
                          type="button"
                          className="remove-file"
                          onClick={() => {
                            const input = form.current?.elements.namedItem(
                              "cv",
                            ) as HTMLInputElement;
                            if (input) input.value = "";
                            setFileName("");
                            setError("");
                          }}
                        >
                          Remove CV <X size={16} />
                        </button>
                      )}
                    </fieldset>
                    {step === 1 && error && (
                      <p
                        id="application-error"
                        className="form-error"
                        role="alert"
                        tabIndex={-1}
                      >
                        {error}
                      </p>
                    )}
                    <button type="submit" className="button dark full">
                      Continue to step 2 <ArrowRight size={18} />
                    </button>
                  </div>
                  <div data-step="2" hidden={step !== 2}>
                    <label>
                      What are you building or working on?
                      <textarea
                        id="application-about"
                        required={step === 2}
                        minLength={30}
                        maxLength={1500}
                        name="about"
                        rows={3}
                        placeholder="Tell us about your startup, investment focus or work with founders."
                        aria-describedby="about-help"
                      />
                      <span className="field-hint" id="about-help">
                        A few sentences · at least 30 characters.
                      </span>
                    </label>
                    <div className="contribution-fields">
                      <label>
                        What could you share?
                        <textarea
                          required={step === 2}
                          minLength={20}
                          maxLength={1500}
                          name="offer"
                          rows={3}
                          placeholder="Experience, introductions, skills…"
                          aria-describedby="offer-help"
                        />
                        <span className="field-hint" id="offer-help">
                          Tell us how you could help others · at least 20
                          characters.
                        </span>
                      </label>
                      <label>
                        <span className="field-label">
                          What would help you?{" "}
                          <span className="optional">Optional</span>
                        </span>
                        <textarea
                          name="ask"
                          rows={3}
                          maxLength={1500}
                          placeholder="People, perspectives, a next step…"
                        />
                      </label>
                    </div>
                    <fieldset className="interests">
                      <legend>What interests you?</legend>
                      <p className="field-hint">
                        Choose at least one. You can select more than one.
                      </p>
                      <div>
                        {interests.map((i) => (
                          <label
                            key={i}
                            className={
                              chosen.includes(i)
                                ? "interest chosen"
                                : "interest"
                            }
                          >
                            <input
                              type="checkbox"
                              name="interests"
                              value={i}
                              checked={chosen.includes(i)}
                              onChange={() =>
                                setChosen((a) =>
                                  a.includes(i)
                                    ? a.filter((x) => x !== i)
                                    : [...a, i],
                                )
                              }
                            />
                            {chosen.includes(i) ? (
                              <Check size={14} />
                            ) : (
                              <Plus size={14} />
                            )}{" "}
                            {i}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <div className="form-row">
                      <label>
                        <span className="field-label">
                          Introduced by{" "}
                          <span className="optional">Optional</span>
                        </span>
                        <input
                          name="referral"
                          placeholder="Member or contact name"
                          maxLength={150}
                        />
                      </label>
                      <label>
                        <span className="field-label">
                          How did you hear about us?{" "}
                          <span className="optional">Optional</span>
                        </span>
                        <select name="source" defaultValue="">
                          <option value="">Choose an option</option>
                          {[
                            "TRUVIS",
                            "Hub71",
                            "Friend / member",
                            "Luma",
                            "Meetup",
                            "Eventbrite",
                            "LinkedIn",
                            "Other",
                          ].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="consent-panel">
                      <label className="check-label">
                        <input
                          required={step === 2}
                          type="checkbox"
                          name="consent"
                        />
                        <span>
                          I agree to the{" "}
                          <a href="/privacy" target="_blank">
                            privacy notice
                          </a>{" "}
                          and{" "}
                          <a href="/community" target="_blank">
                            community principles
                          </a>
                          , and to being contacted about my application and
                          membership.
                        </span>
                      </label>
                      <label className="check-label">
                        <input type="checkbox" name="updates" />
                        <span>
                          I’d also like occasional community news and future
                          event announcements.{" "}
                          <span className="optional">Optional</span>
                        </span>
                      </label>
                    </div>
                    {step === 2 && error && (
                      <p
                        id="application-error"
                        className="form-error"
                        role="alert"
                        tabIndex={-1}
                      >
                        {error}
                      </p>
                    )}
                    <div className="form-buttons">
                      <button
                        type="button"
                        className="back-button"
                        disabled={busy}
                        onClick={() => changeStep(1)}
                      >
                        ← Back
                      </button>
                      <button
                        type="submit"
                        disabled={busy}
                        className="button dark"
                      >
                        {busy ? (
                          <>
                            <span
                              className="expressive-loader"
                              aria-hidden="true"
                            />
                            Sending application…
                          </>
                        ) : (
                          <>
                            Submit application
                            <ArrowUpRight size={18} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <label className="honeypot" aria-hidden="true">
                    Leave blank
                    <input tabIndex={-1} name="website" autoComplete="off" />
                  </label>
                  <p className="form-footnote">
                    Our team reviews every application. Applying is free and
                    does not guarantee membership or an event place.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
        <section className="faq-section wrap section">
          <div>
            <div className="section-label">A FEW PRACTICAL DETAILS</div>
            <h2>Good to know.</h2>
            <a className="text-link" href="mailto:info@truvis.info">
              Talk to our team <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="faq-list">
            {faqs.map((f) => (
              <details key={f.q}>
                <summary>
                  {f.q}
                  <Plus size={19} />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
