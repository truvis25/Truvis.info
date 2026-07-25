import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { newKeys, type SearchKind, type SearchParams } from "./saved";
import { notifySavedSearchMatches } from "@/lib/email/notifications";

type SavedSearchRow = {
  id: string;
  user_id: string;
  kind: SearchKind;
  label: string;
  params: SearchParams;
  seen_keys: string[];
  alerts_enabled: boolean;
};

export type MatchItem = { key: string; title: string; href: string };

// Re-run a saved search and return its current result keys + display items.
async function runSearch(
  admin: SupabaseClient,
  kind: SearchKind,
  params: SearchParams,
): Promise<{ keys: string[]; items: Map<string, MatchItem> }> {
  const items = new Map<string, MatchItem>();
  if (kind === "directory") {
    const { data } = await admin.rpc("search_orgs", {
      p_query: params.q ?? null,
      p_industry: params.industry ?? null,
      p_jurisdiction: params.jurisdiction ?? null,
    });
    for (const r of (data ?? []) as { slug: string; legal_name: string }[]) {
      items.set(r.slug, { key: r.slug, title: r.legal_name, href: `/orgs/${r.slug}` });
    }
  } else {
    const { data } = await admin.rpc("get_public_listings", {
      p_query: params.q ?? null,
      p_type: params.type ?? null,
      p_sector: params.sector ?? null,
      p_region: params.region ?? null,
    });
    for (const r of (data ?? []) as { id: string; teaser_headline: string }[]) {
      items.set(r.id, { key: r.id, title: r.teaser_headline, href: `/marketplace/${r.id}` });
    }
  }
  return { keys: [...items.keys()], items };
}

// Daily match-alert digest. Folded into the compliance-poll cron so it doesn't
// consume a third Vercel cron slot. For each enabled saved search: re-run it,
// email only the NEW matches, then record them so they're never re-sent.
export async function processSavedSearchAlerts(
  admin: SupabaseClient,
): Promise<{ processed: number; notified: number }> {
  const { data: searches } = await admin
    .from("saved_searches")
    .select("id, user_id, kind, label, params, seen_keys, alerts_enabled")
    .eq("alerts_enabled", true);

  let notified = 0;
  const rows = (searches ?? []) as SavedSearchRow[];
  for (const s of rows) {
    const { keys, items } = await runSearch(admin, s.kind, s.params);
    const fresh = newKeys(keys, s.seen_keys ?? []);
    if (fresh.length > 0) {
      const matches = fresh
        .map((k) => items.get(k))
        .filter((m): m is MatchItem => Boolean(m));
      await notifySavedSearchMatches({
        userId: s.user_id,
        label: s.label,
        kind: s.kind,
        matches,
      });
      notified += 1;
    }
    // Record the full current set as seen (so removed-then-readded results
    // don't re-notify, and the seen list can't grow unbounded past reality).
    await admin
      .from("saved_searches")
      .update({ seen_keys: keys, last_run_at: new Date().toISOString() })
      .eq("id", s.id);
  }
  return { processed: rows.length, notified };
}
