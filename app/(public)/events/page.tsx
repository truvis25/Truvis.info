import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Events",
  description: "Business events hosted by verified organizations.",
};

export const dynamic = "force-dynamic";

type EventRow = {
  slug: string;
  title: string;
  starts_at: string;
  venue_address: string | null;
  online_url: string | null;
  organizations: { slug: string; legal_name: string };
};

export default async function EventsPage() {
  const supabase = await createClient();
  // RLS: only published events of visible orgs reach the public (EVT-2).
  const { data: events } = await supabase
    .from("events")
    .select("slug, title, starts_at, venue_address, online_url, organizations!inner(slug, legal_name)")
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at");

  const list = (events ?? []) as unknown as EventRow[];

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Events</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Upcoming events hosted by verified organizations.
        </p>
      </header>

      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/15 p-10 text-center text-gray-500 dark:border-white/20 dark:text-gray-400">
          No upcoming events. Check back soon.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((event) => (
            <li key={event.slug}>
              <Link
                href={`/events/${event.slug}`}
                className="flex flex-col gap-1 rounded-2xl border border-black/10 p-6 transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
              >
                <span className="text-lg font-semibold">{event.title}</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {new Date(event.starts_at).toLocaleString("en-GB", {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  by {event.organizations.legal_name}
                  {event.venue_address ? ` · ${event.venue_address}` : ""}
                  {event.online_url ? " · Online" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
