import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ExternalLink, MapPin, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandArt } from "@/components/brand-art";

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
  external_source: string | null;
  organizations: { slug: string; legal_name: string } | null;
};

export default async function EventsPage() {
  const supabase = await createClient();
  // Left join: Luma-sourced community events have no owning organization.
  const { data: events } = await supabase
    .from("events")
    .select(
      "slug, title, starts_at, venue_address, online_url, external_source, organizations(slug, legal_name)",
    )
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
          Upcoming events hosted by verified organizations and the Truvis
          community calendar.
        </p>
      </header>

      {list.length === 0 ? (
        <div className="relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-border py-20 text-center">
          <BrandArt seed="empty-events" variant="empty" />
          <CalendarDays className="relative z-10 size-10 text-muted-foreground/50" aria-hidden />
          <p className="relative z-10 font-medium">No upcoming events right now.</p>
          <p className="relative z-10 text-sm text-muted-foreground">
            Check back soon — verified organizers publish here.
          </p>
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
                  <Card className="transition-all group-hover:-translate-y-0.5 group-hover:shadow-[0_16px_40px_-16px_rgba(2,48,89,0.25)]">
                    <CardContent className="flex items-center gap-5 p-6">
                      <div className="art-on-petroleum relative flex size-16 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-petroleum to-petroleum-deep text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]">
                        <BrandArt
                          seed={event.slug}
                          variant="medallion"
                          className="[mask-image:radial-gradient(closest-side,black,transparent)]"
                        />
                        <span className="relative z-10 font-display text-xl font-extrabold leading-none">
                          {date.getDate()}
                        </span>
                        <span className="relative z-10 text-[10px] font-semibold uppercase tracking-wide text-emerald-brand">
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
                              by {event.organizations.legal_name} <VerifiedBadge />
                            </>
                          )}
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
