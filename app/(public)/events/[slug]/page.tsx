import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registerForEvent, cancelRegistration } from "@/lib/events/actions";

export const dynamic = "force-dynamic";

type EventDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  venue_address: string | null;
  online_url: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number | null;
  registration_deadline: string | null;
  approval_mode: "auto" | "manual";
  status: string;
  organizations: { slug: string; legal_name: string };
};

async function fetchEvent(slug: string): Promise<EventDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(
      "id, slug, title, description, venue_address, online_url, starts_at, ends_at, capacity, registration_deadline, approval_mode, status, organizations!inner(slug, legal_name)",
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let registration: { id: string; status: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("event_registrations")
      .select("id, status")
      .eq("event_id", event.id)
      .eq("user_id", user.id)
      .maybeSingle();
    registration = data;
  }

  const started = new Date(event.starts_at) <= new Date();
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
      <Link href="/events" className="text-sm text-gray-500 underline underline-offset-4 dark:text-gray-400">
        ← All events
      </Link>

      <header className="mt-6 flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{event.title}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Hosted by{" "}
          <Link
            href={`/orgs/${event.organizations.slug}`}
            className="font-medium underline underline-offset-4"
          >
            {event.organizations.legal_name}
          </Link>{" "}
          <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Verified
          </span>
        </p>
      </header>

      <dl className="mt-8 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Starts</dt>
          <dd className="font-medium">
            {new Date(event.starts_at).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Ends</dt>
          <dd className="font-medium">
            {new Date(event.ends_at).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })}
          </dd>
        </div>
        {event.venue_address ? (
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Venue</dt>
            <dd className="font-medium">{event.venue_address}</dd>
          </div>
        ) : null}
        {event.online_url ? (
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Online</dt>
            <dd className="font-medium">Link shared with approved attendees</dd>
          </div>
        ) : null}
        {event.registration_deadline ? (
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Register by</dt>
            <dd className="font-medium">
              {new Date(event.registration_deadline).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Attendance</dt>
          <dd className="font-medium">
            {event.approval_mode === "manual" ? "Organizer approval required" : "Open registration"}
          </dd>
        </div>
      </dl>

      {event.description ? (
        <p className="mt-8 whitespace-pre-line text-sm leading-6 text-gray-700 dark:text-gray-300">
          {event.description}
        </p>
      ) : null}

      <section className="mt-10 rounded-2xl border border-black/10 p-6 dark:border-white/15">
        {error ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        ) : null}
        {registered ? (
          <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
            Registration submitted.
          </p>
        ) : null}

        {!user ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <Link href={`/login?next=/events/${event.slug}`} className="font-medium underline underline-offset-4">
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
                <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
                  Cancel registration
                </button>
              </form>
            ) : null}
          </div>
        ) : canRegister ? (
          <form action={registerForEvent}>
            <input type="hidden" name="event_slug" value={event.slug} />
            <button className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background hover:opacity-85">
              Register for this event
            </button>
          </form>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Registration is closed{started ? " — the event has started" : deadlinePassed ? " — the deadline has passed" : ""}.
          </p>
        )}
      </section>
    </main>
  );
}
