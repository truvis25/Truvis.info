export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function snippets(text: string, needle: RegExp, radius = 550) {
  const out: string[] = [];
  for (const match of text.matchAll(needle)) {
    const i = match.index ?? 0;
    out.push(text.slice(Math.max(0, i - radius), Math.min(text.length, i + radius)));
    if (out.length >= 8) break;
  }
  return out;
}

export async function GET() {
  const urls = [
    "https://luma.com/pk2m8tdp",
    "https://luma.com/Founderhouse",
    "https://luma.com/embed/calendar/cal-1asC7OUxbMbZXiV/events?lt=light",
  ];

  const out = [] as Array<Record<string, unknown>>;
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "Mozilla/5.0 FounderHouse/1.0" },
        cache: "no-store",
      });
      const text = await response.text();
      out.push({
        url,
        status: response.status,
        finalUrl: response.url,
        calendars: unique(text.match(/cal-[A-Za-z0-9]+/g) ?? []),
        isoDates: unique(
          text.match(/20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g) ?? [],
        ).slice(0, 80),
        eventIds: unique(text.match(/evt-[A-Za-z0-9]+/g) ?? []).slice(0, 80),
        titleSnippets: snippets(text, /Founder House Breakfast/gi),
        eventKeySnippets: snippets(text, /calendar_api_id/gi),
        startKeySnippets: snippets(text, /start_at/gi),
        length: text.length,
      });
    } catch (error) {
      out.push({ url, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return Response.json({ out }, { headers: { "cache-control": "no-store" } });
}
