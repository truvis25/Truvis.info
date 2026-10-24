import "server-only";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";
import type { PublicEvent } from "./events";
export async function publicEvents(
  path = "/api/events",
): Promise<PublicEvent[]> {
  const response = await fetch(SUPABASE_URL + "/functions/v1/founder-house", {
    headers: {
      authorization: "Bearer " + SUPABASE_ANON_KEY,
      apikey: SUPABASE_ANON_KEY,
      "x-fh-path": path,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw Error("Events are temporarily unavailable.");
  const data = await response.json();
  return data.events;
}
