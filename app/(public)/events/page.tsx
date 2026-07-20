import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, ExternalLink, MapPin, Search, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { BrandArt } from "@/components/brand-art";
import { EventDateTile } from "@/components/event-date-tile";

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
  banner_url: string | null;
  external_source: string | null;
  organizations: { slug: string; legal_name: string; logo_url: string | null } | null;
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; mode?: string }>;
}) {
  const { q, mode } = await searchParams;
  const supabase = await createClient();

  // Left join: Luma-sourced community events have no owning organization.
  let query = supabase
    .from("events")
    .select(
      "slug, title, starts_at, venue_address, online_url, banner_url, external_source, organizations(slug, legal_name, logo_url)",
    )
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at");

  if (q?.trim()) {
    // Escape PostgREST or() separators before interpolating user input.
    const safe = q.trim().replace(/[,()]/g, " ");
    query = query.or(
      `title.ilike.%${safe}%,description.ilike.%${safe}%,venue_address.ilike.%${safe}%`,
    );
  }
  if (mode === "online") query = query.not("online_url", "is", null);
  if (mode === "in-person") query = query.not("venue_address", "is", null);

  const { data: events } = await query;
  const list = (events ?? []) as unknown as EventRow[];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-14 lg:px-12">
      <header className="mb-8 max-w-2xl">
        <h1 className="font-display text-3xl font-bold tracking-tight text-petroleum dark:text-foreground">
          Events
        </h1>
        <p className="mt-2 text-muted-foreground">
          Upcoming events hosted by verified organizations and the Truvis
          community calendar.
        </p>
      </header>

      {/* Search */}
      <form
        method="GET"
        className="mb-8 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center"
        role="search"
        aria-label="Search events"
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search events by title, topic, or venue…"
            aria-label="Search events"
            className="pl-9"
          />
        </div>
        <Select name="mode" defaultValue={mode ?? ""} aria-label="Filter by format" className="sm:w-40">
          <option value="">All formats</option>
          <option value="in-person">In person</option>
          <option value="online">Online</option>
        </Select>
        <Button type="submit" variant="primary">Search</Button>
      </form>

      {list.length === 0 ? (
        <div className="relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-border py-20 text-center">
          <BrandArt seed="empty-events" variant="empty" />
          <CalendarDays className="relative z-10 size-10 text-muted-foreground/50" aria-hidden />
          <p className="relative z-10 font-medium">
            {q || mode ? "No events match your search." : "No upcoming events right now."}
          </p>
          {q || mode ? (
            <Link href="/events" className="link-engraved relative z-10 text-sm font-medium text-emerald-dark">
              Clear the filters
            </Link>
          ) : (
            <p className="relative z-10 text-sm text-muted-foreground">
              Check back soon — verified organizers publish here.
            </p>
          )}
          <Button asChild variant="outline" size="sm" className="relative z-10">
            <Link href="/signup">Host an event</Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((event) => {
            const date = new Date(event.starts_at);
            const isLuma = event.external_source === "luma";
            return (
              <li key={event.slug}>
                <Link href={`/events/${event.slug}`} className="group block">
                  <Card className="overflow-hidden transition-all group-hover:-translate-y-0.5 group-hover:shadow-[0_16px_40px_-16px_rgba(2,48,89,0.25)]">
                    <CardContent className="flex items-stretch gap-5 p-0">
                      <div className="flex flex-1 items-center gap-5 p-6">
                        <EventDateTile date={date} seed={event.slug} />
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
                            {isLuma || !event.organizations ? (
                              <>
                                Truvis community calendar
                                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-accent/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-700 dark:text-cyan-accent">
                                  <ExternalLink className="size-3" aria-hidden />
                                  via Luma
                                </span>
                              </>
                            ) : (
                              <>
                                {event.organizations.logo_url ? (
                                  <Image
                                    src={event.organizations.logo_url}
                                    alt=""
                                    width={20}
                                    height={20}
                                    className="size-5 rounded bg-card object-contain"
                                  />
                                ) : null}
                                by {event.organizations.legal_name} <VerifiedBadge />
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      {/* Banner thumbnail (real photo) or engraved event plate */}
                      <div className="art-on-petroleum relative hidden w-44 shrink-0 overflow-hidden bg-gradient-to-br from-petroleum-deep via-petroleum to-[#03427a] md:block">
                        {event.banner_url ? (
                          <Image
                            src={event.banner_url}
                            alt=""
                            fill
                            sizes="176px"
                            className="object-cover opacity-85"
                          />
                        ) : (
                          <BrandArt seed={event.slug} variant="event" className="opacity-90" />
                        )}
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
