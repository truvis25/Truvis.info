import { publicEvents } from "../../../lib/public-events";
import { calendarFeed } from "../../../lib/calendar";
import {
  mergeExternalEvents,
  upcomingExternalEvents,
} from "../../../lib/external-events";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    // Luma and Meetup listings join the organiser's events. If the
    // membership desk is unreachable, the external listings still publish.
    const events = await publicEvents("/api/calendar").then(
      mergeExternalEvents,
      () => upcomingExternalEvents(),
    );
    return new Response(calendarFeed(events), {
      headers: {
        "content-type": "text/calendar; charset=utf-8",
        "content-disposition": "inline; filename=founder-house-events.ics",
        "cache-control": "public, max-age=300",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return new Response(
      "The events calendar is temporarily unavailable. Please try again.",
      {
        status: 503,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
        },
      },
    );
  }
}
