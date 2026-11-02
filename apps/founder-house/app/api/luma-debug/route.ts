export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

export async function GET() {
  const urls = [
    "https://luma.com/pk2m8tdp",
    "https://luma.com/embed/event/evt-EoVSOdqTbsOowoI/simple",
  ];

  const out = [] as Array<Record<string, unknown>>;
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "Mozilla/5.0 FounderHouse/1.0" },
        cache: "no-store",
      });
      const text = await response.text();
      const calendars = unique(text.match(/cal-[A-Za-z0-9]+/g) ?? []);
      const isoDates = unique(
        text.match(/20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g) ?? [],
      ).slice(0, 30);
      const dateLike = unique(
        text.match(/20\d{2}-\d{2}-\d{2}[T ][0-2]\d:[0-5]\d(?::[0-5]\d)?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/g) ?? [],
      ).slice(0, 30);
      out.push({
        url,
        status: response.status,
        finalUrl: response.url,
        calendars,
        isoDates,
        dateLike,
        hasFounderHouse: /Founder House/i.test(text),
        hasBreakfast: /Breakfast/i.test(text),
        length: text.length,
      });
    } catch (error) {
      out.push({ url, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return Response.json({ out }, { headers: { "cache-control": "no-store" } });
}
