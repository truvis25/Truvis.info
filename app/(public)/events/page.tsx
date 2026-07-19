import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, MapPin, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { VerifiedBadge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Events",
  description: "Business events hosted by verified organizations.",
};

export const revalidate = 300;

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
  const { data: events } = await supabase
    .from("events")
    .select("slug, title, starts_at, venue_address, online_url, organizations!inner(slug, legal_name)")
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at");

  const list = (events ?? []) as unknown as EventRow[];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-14 lg:px-12">
      <header className="mb-10 max-w-2xl">
        <h1 className="font-display text-3xl font-bold tracking-tight text-petroleum dark:text-foreground">
          Events
        </h1>
        <p className="mt-2 text-muted-foreground">
          Upcoming events hosted by verified organizations.
        </p>
      </header>

      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-20 text-center">
          <CalendarDays className="size-10 text-muted-foreground/50" aria-hidden />
          <p className="font-medium">No upcoming events right now.</p>
          <p className="text-sm text-muted-foreground">Check back soon — verified organizers publish here.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((event) => {
            const date = new Date(event.starts_at);
            return (
              <li key={event.slug}>
                <Link href={`/events/${event.slug}`} className="group block">
                  <Card className="transition-all group-hover:-translate-y-0.5 group-hover:shadow-[0_16px_40px_-16px_rgba(2,48,89,0.25)]">
                    <CardContent className="flex items-center gap-5 p-6">
                      <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-petroleum to-petroleum-deep text-white">
                        <span className="font-display text-xl font-extrabold leading-none">
                          {date.getDate()}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-brand">
                          {date.toLocaleString("en-GB", { month: "short" })}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-display text-lg font-bold text-petroleum transition-colors group-hover:text-emerald-deeper dark:text-foreground">
                          {event.title}
                        </h2>
                        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span>
                            {date.toLocaleString("en-GB", { weekday: "long", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {event.venue_address ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="size-3.5" aria-hidden /> {event.venue_address}
                            </span>
                          ) : null}
                          {event.online_url ? (
                            <span className="inline-flex items-center gap-1">
                              <Video className="size-3.5" aria-hidden /> Online
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          by {event.organizations.legal_name} <VerifiedBadge />
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
