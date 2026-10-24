import { publicEvents } from "../../../lib/public-events";
import { calendarFeed } from "../../../lib/calendar";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return new Response(calendarFeed(await publicEvents("/api/calendar")), {
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
