// Pilot content seeder — NEVER runs automatically. Populates the directory,
// feed, events, and marketplace teasers with ~12 realistic UAE orgs so launch
// doesn't show an empty register. Idempotent; safe to re-run.
//
//   node --experimental-strip-types scripts/seed-pilot.mts            # upsert
//   node --experimental-strip-types scripts/seed-pilot.mts --remove   # delete pilot-* rows
//
// Requires SUPABASE_SERVICE_ROLE_KEY (bypasses RLS). Prints its target project
// and refuses to touch production without an explicit --yes confirmation.

import { createClient } from "@supabase/supabase-js";
import { pilotOrgs } from "../lib/compliance/pilot-data.ts";

const PROD_URL = "https://hyzotwxtqssefsgryawl.supabase.co";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? PROD_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const args = new Set(process.argv.slice(2));
const remove = args.has("--remove");
const confirmed = args.has("--yes");

if (!serviceKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is required.");
  process.exit(1);
}
if (url === PROD_URL && !confirmed) {
  console.error(
    `Refusing to ${remove ? "remove from" : "seed"} the PRODUCTION project (${url}) without --yes.\n` +
      "Re-run with --yes if that is intended, or point NEXT_PUBLIC_SUPABASE_URL at staging.",
  );
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });
console.log(`${remove ? "Removing pilot data from" : "Seeding pilot data into"}: ${url}`);

function isoInDays(days: number): string {
  return new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
}
function isoHoursAfter(startIso: string, hours: number): string {
  return new Date(new Date(startIso).getTime() + hours * 3600 * 1000).toISOString();
}

async function removePilot() {
  // FK cascades wipe compliance_status, posts, events, catalog_items.
  const { data, error } = await db
    .from("organizations")
    .delete()
    .like("compliance_org_id", "pilot-%")
    .select("id");
  if (error) throw error;
  console.log(`Removed ${data?.length ?? 0} pilot organizations (content cascaded).`);
}

async function seedPilot() {
  const summary: { org: string; visible: boolean; posts: number; events: number; items: number }[] = [];

  for (const org of pilotOrgs) {
    const { grant, standing, seed } = org;
    const p = grant.profile;

    // 1) organization (unclaimed — no members, so real owners can claim later).
    const { data: orgRow, error: orgErr } = await db
      .from("organizations")
      .upsert(
        {
          compliance_org_id: org.complianceOrgId,
          slug: seed.slug,
          legal_name: p.legalName,
          trade_license_no: p.tradeLicenseNo ?? null,
          jurisdiction: p.jurisdiction ?? null,
          incorporation_year: p.incorporationYear ?? null,
          industry_code: p.industryCode ?? null,
          size_band: p.sizeBand ?? null,
          contact_person: p.contactPerson ?? null,
          authorized_fields: grant.authorizedFields,
          grant_active: grant.status === "active",
          tagline: seed.tagline,
          description: seed.description,
          website: seed.website ?? null,
        },
        { onConflict: "compliance_org_id" },
      )
      .select("id")
      .single();
    if (orgErr) throw orgErr;
    const orgId = orgRow.id as string;

    // 2) compliance_status — the insert fires trg_visibility_on_status, which
    //    computes is_visible (including the intentionally-hidden orgs).
    const { error: csErr } = await db.from("compliance_status").upsert(
      {
        org_id: orgId,
        state: standing.state,
        risk_level: standing.riskLevel,
        score: standing.score,
        renewal_expiry: standing.renewalExpiry,
        checked_at: new Date().toISOString(),
        synced_at: new Date().toISOString(),
      },
      { onConflict: "org_id" },
    );
    if (csErr) throw csErr;

    // 3) catalog items (published).
    for (const item of seed.catalog) {
      const { error } = await db.from("catalog_items").upsert(
        {
          org_id: orgId,
          slug: item.slug,
          name: item.name,
          item_type: item.itemType,
          category: item.category,
          description: item.description,
          price_indication: item.priceIndication ?? null,
          status: "published",
        },
        { onConflict: "org_id,slug" },
      );
      if (error) throw error;
    }

    // 4) events (future, published, auto-approve).
    for (const event of seed.events) {
      const startsAt = isoInDays(event.daysFromNow);
      const { error } = await db.from("events").upsert(
        {
          org_id: orgId,
          slug: `pilot-${seed.slug}-${event.slug}`,
          title: event.title,
          description: event.description,
          venue_address: event.venue ?? null,
          starts_at: startsAt,
          ends_at: isoHoursAfter(startsAt, event.durationHours),
          approval_mode: "auto",
          status: "published",
        },
        { onConflict: "slug" },
      );
      if (error) throw error;
    }

    // 5) posts — no natural key, so replace this org's set. Stagger published_at
    //    over the past few weeks so the feed looks alive.
    await db.from("posts").delete().eq("org_id", orgId);
    let ago = 3;
    for (const post of seed.posts) {
      const { error } = await db.from("posts").insert({
        org_id: orgId,
        title: post.title,
        body: { text: post.text },
        status: "published",
        published_at: isoInDays(-ago),
      });
      if (error) throw error;
      ago += 4;
    }

    summary.push({
      org: p.legalName ?? seed.slug,
      visible:
        grant.status === "active" &&
        standing.state === "compliant" &&
        standing.riskLevel !== "high" &&
        standing.score >= 40,
      posts: seed.posts.length,
      events: seed.events.length,
      items: seed.catalog.length,
    });
  }

  console.table(summary);
  console.log(
    `Seeded ${summary.length} orgs (${summary.filter((s) => s.visible).length} visible, ${
      summary.filter((s) => !s.visible).length
    } intentionally hidden).`,
  );
}

try {
  if (remove) await removePilot();
  else await seedPilot();
  console.log("Done.");
} catch (error) {
  console.error("Seed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
}
