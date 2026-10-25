const LUMA_SLUG_MAX = 50;

export function makeLumaSlug(eventSlug: string, eventId: string): string {
  const cleanSlug = eventSlug
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "event";
  const suffix = eventId.replace(/[^a-z0-9]/gi, "").slice(0, 8).toLowerCase();
  const prefix = "truvis-";
  const reserved = prefix.length + suffix.length + 1;
  const base = cleanSlug.slice(0, LUMA_SLUG_MAX - reserved).replace(/-+$/g, "");
  return `${prefix}${base}-${suffix}`;
}

export function lumaSlugFromUrl(value: string): string | null {
  try {
    const parts = new URL(value).pathname.split("/").filter(Boolean);
    return parts.at(-1) ?? null;
  } catch {
    return null;
  }
}
