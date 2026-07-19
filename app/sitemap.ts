import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SITE_URL } from "@/lib/config";

// Only visible orgs/events reach the sitemap — the anon client is bound by
// RLS, so hidden organizations can never leak into search engines (DIR-7).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const [{ data: orgs }, { data: events }] = await Promise.all([
    supabase.from("organizations").select("slug, updated_at"),
    supabase.from("events").select("slug, updated_at").eq("status", "published"),
  ]);

  const statics: MetadataRoute.Sitemap = [
    "",
    "/directory",
    "/events",
    "/marketplace",
    "/feed",
    "/pricing",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.8,
  }));

  return [
    ...statics,
    ...(orgs ?? []).map((org) => ({
      url: `${SITE_URL}/orgs/${org.slug}`,
      lastModified: org.updated_at ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...(events ?? []).map((event) => ({
      url: `${SITE_URL}/events/${event.slug}`,
      lastModified: event.updated_at ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
