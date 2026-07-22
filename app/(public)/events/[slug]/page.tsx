import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { registerForEvent, cancelRegistration } from "@/lib/events/actions";
import { VerifiedBadge, SealBadge } from "@/components/ui/badge";
import { BrandArt } from "@/components/brand-art";
import { dateTileParts, formatDate, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type EventDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  venue_address: string | null;
  online_url: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number | null;
  registration_deadline: string | null;
  approval_mode: "auto" | "manual";
  status: string;
  external_source: string | null;
  luma_event_url: string | null;
  organizations: { slug: string; legal_name: string } | null;
};

async function fetchEvent(slug: string): Promise<EventDetail | null> {
  const supabase = await createClient();
  // Left join: Luma-sourced community events carry no owning organization.
  const { data } = await supabase
    .from("events")
    .select(
      "id, slug, title, description, banner_url, venue_address, online_url, starts_at, ends_at, capacity, registration_deadline, approval_mode, status, external_source, luma_event_url, organizations(slug, legal_name)",
    )
    .eq("slug", slug)
    .maybeSingle();
  return (data as unknown as EventDetail | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await fetchEvent(slug);
  if (!event) return { title: "Event not found" };
  return { title: event.title, description: event.description?.slice(0, 160) };
}

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; registered?: string }>;
}) {
  const { slug } = await params;
  const { error, registered } = await searchParams;
  const event = await fetchEvent(slug);
  if (!event || event.status !== "published") notFound();
  const isLuma = event.external_source === "luma";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let registration: { id: string; status: string } | null = null;
  if (user && !isLuma) {
    const { data } = await supabase
      .from("event_registrations")
      .select("id, status")
      .eq("event_id", event.id)
      .eq("user_id", user.id)
      .maybeSingle();
    registration = data;
  }

  const startDate = new Date(event.starts_at);
  const startTile = dateTileParts(startDate);
  const started = startDate <= new Date();
  const deadlinePassed =
    event.registration_deadline != null &&
    new Date(event.registration_deadline) <= new Date();
  const canRegister =
    !started && !deadlinePassed && (!registration || registration.status === "cancelled");

  const statusCopy: Record<string, string> = {
    pending: "Registration received — awaiting organizer approval.",
    approved: "You are confirmed for this event.",
    rejected: "The organizer was unable to approve your registration.",
    waitlisted: "You are on the waitlist.",
    cancelled: "You cancelled your registration.",
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <Link href="/events" className="link-engraved text-sm text-muted-foreground">
        ← All events
      </Link>

      {/* Engraved header band: real banner when set, generative plate otherwise */}
      <div className="art-on-petroleum relative mt-6 h-40 overflow-hidden rounded-2xl bg-gradient-to-br from-petroleum-deep via-petroleum to-petroleum-light shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] sm:h-52">
        {event.banner_url ? (
          <div className="duotone absolute inset-0">
            <Image
              src={event.banner_url}
              alt=""
              fill
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover opacity-80"
            />
            <div aria-hidden className="duotone-overlay" />
            <div
              className="absolute inset-0 bg-gradient-to-t from-petroleum-deep/60 to-transparent"
              aria-hidden
            />
          </div>
        ) : (
          <BrandArt seed={event.slug} variant="event" draw />
        )}
        {!isLuma && event.organizations ? (
          <div className="absolute right-4 top-4">
            <SealBadge seed={event.organizations.slug} className="bg-white/90 dark:bg-card/90" />
          </div>
        ) : null}
        <div aria-hidden className="rule-engraved absolute inset-x-0 bottom-0" />
      </div>

      {/* Overlapping date medallion */}
      <div className="art-on-petroleum relative -mt-6 ml-6 flex size-20 flex-col items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-petroleum to-petroleum-deep ring-4 ring-background">
        <BrandArt
          seed={event.slug}
          variant="medallion"
          className="[mask-image:radial-gradient(closest-side,black,transparent)]"
        />
        <span className="relative z-10 font-display text-2xl font-extrabold leading-none text-white">
          {startTile.day}
        </span>
        <span className="relative z-10 text-[11px] font-semibold uppercase tracking-wide text-emerald-brand">
          {startTile.month}
        </span>
      </div>

      <header className="mt-5 flex flex-col gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight text-petroleum dark:text-foreground">{event.title}</h1>
        {isLuma || !event.organizations ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            Community event
            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-accent/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-700 dark:text-cyan-accent">
              <ExternalLink className="size-3" aria-hidden />
              via Luma
            </span>
          </p>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            Hosted by{" "}
            <Link
              href={`/orgs/${event.organizations.slug}`}
              className="link-engraved font-medium"
            >
              {event.organizations.legal_name}
            </Link>
            <VerifiedBadge />
          </p>
        )}
      </header>

      <dl className="mt-8 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Starts</dt>
          <dd className="font-medium">
            {formatDateTime(startDate)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Ends</dt>
          <dd className="font-medium">
            {formatDateTime(event.ends_at)}
          </dd>
        </div>
        {event.venue_address ? (
          <div>
            <dt className="text-muted-foreground">Venue</dt>
            <dd className="font-medium">{event.venue_address}</dd>
          </div>
        ) : null}
        {event.online_url ? (
          <div>
            <dt className="text-muted-foreground">Online</dt>
            <dd className="font-medium">
              {isLuma ? "Online event" : "Link shared with approved attendees"}
            </dd>
          </div>
        ) : null}
        {event.registration_deadline && !isLuma ? (
          <div>
            <dt className="text-muted-foreground">Register by</dt>
            <dd className="font-medium">
              {formatDateTime(event.registration_deadline)}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-muted-foreground">Attendance</dt>
          <dd className="font-medium">
            {isLuma
              ? "Registration on lu.ma"
              : event.approval_mode === "manual"
                ? "Organizer approval required"
                : "Open registration"}
          </dd>
        </div>
      </dl>

      {event.description ? (
        <p className="mt-8 whitespace-pre-line text-sm leading-6 text-foreground/80">
          {event.description}
        </p>
      ) : null}

      {isLuma ? (
        <section className="mt-10 rounded-2xl border border-border p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Registration for this event is managed on Luma.
            </p>
            <a
              href={event.luma_event_url ?? "https://lu.ma"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-emerald-dark to-emerald-deeper px-6 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(16,185,129,0.45)] transition-all hover:-translate-y-0.5"
            >
              Register on lu.ma
              <ExternalLink className="size-4" aria-hidden />
            </a>
          </div>
        </section>
      ) : (
        <section className="mt-10 rounded-2xl border border-border p-6">
          {error ? (
            <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {registered ? (
            <p className="mb-4 rounded-lg border border-emerald-brand/30 bg-emerald-brand/5 px-4 py-3 text-sm text-emerald-deeper dark:text-emerald-brand">
              Registration submitted.
            </p>
          ) : null}

          <div className="grid gap-6 sm:grid-cols-[1fr_auto_1.4fr]">
            <div className="flex flex-col gap-2 text-sm">
              <p className="font-display text-xs font-bold uppercase tracking-wide text-petroleum dark:text-foreground">
                Attendance
              </p>
              <p className="text-muted-foreground">
                {event.approval_mode === "manual"
                  ? "Organizer approval required"
                  : "Open registration"}
                {event.capacity ? ` · limited to ${event.capacity} seats` : ""}
              </p>
              {event.registration_deadline ? (
                <p className="text-muted-foreground">
                  Register by{" "}
                  {formatDate(event.registration_deadline)}
                </p>
              ) : null}
            </div>
            <div aria-hidden className="rule-engraved-vertical hidden self-stretch sm:block" />
            <div className="flex items-center">
              {!user ? (
                <p className="text-sm text-muted-foreground">
                  <Link href={`/login?next=/events/${event.slug}`} className="link-engraved font-medium">
                    Sign in
                  </Link>{" "}
                  to register for this event.
                </p>
              ) : registration && registration.status !== "cancelled" ? (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm font-medium">
                    {statusCopy[registration.status] ?? registration.status}
                  </p>
                  {["pending", "approved", "waitlisted"].includes(registration.status) ? (
                    <form action={cancelRegistration}>
                      <input type="hidden" name="event_slug" value={event.slug} />
                      <input type="hidden" name="registration_id" value={registration.id} />
                      <button className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary dark:hover:bg-secondary">
                        Cancel registration
                      </button>
                    </form>
                  ) : null}
                </div>
              ) : canRegister ? (
                <form action={registerForEvent}>
                  <input type="hidden" name="event_slug" value={event.slug} />
                  <button className="rounded-md bg-gradient-to-r from-emerald-dark to-emerald-deeper shadow-[0_6px_20px_-6px_rgba(16,185,129,0.45)] px-6 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5">
                    Register for this event
                  </button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Registration is closed{started ? " — the event has started" : deadlinePassed ? " — the deadline has passed" : ""}.
                </p>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
