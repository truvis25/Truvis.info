import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSyncStale } from "@/lib/orgs/queries";
import {
  setOrgSuspension,
  resolveReport,
  grantCompSubscription,
  revokeSubscription,
} from "@/lib/admin/actions";
import {
  Notice,
  inputCls,
  buttonCls,
  buttonGhostCls,
} from "@/components/form-field";

export const metadata: Metadata = { title: "Admin" };

const STALE_WARN_HOURS = 24;

type OrgRow = {
  id: string;
  slug: string;
  legal_name: string;
  is_visible: boolean;
  grant_active: boolean;
  admin_suspended: boolean;
  suspension_reason: string | null;
  compliance_status: {
    state: string;
    risk_level: string;
    score: number;
    synced_at: string;
  } | null;
};

type ReportRow = {
  id: string;
  reason: string;
  created_at: string;
  posts: { id: string; title: string } | null;
  org_reviews: {
    id: string;
    rating: number;
    comment: string | null;
    organizations: { legal_name: string } | null;
  } | null;
  user_profiles: { display_name: string } | null;
};

type SubscriptionRow = {
  email: string;
  plan_id: string;
  status: string;
  current_period_end: string | null;
};

type AuditRow = {
  id: number;
  action: string;
  entity_type: string;
  actor_type: string;
  reason: string | null;
  created_at: string;
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("platform_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.platform_admin) redirect("/dashboard");

  const [{ data: orgs }, { data: reports }, { data: subscriptions }, { data: audit }, { data: metrics }] =
    await Promise.all([
      supabase
        .from("organizations")
        .select(
          "id, slug, legal_name, is_visible, grant_active, admin_suspended, suspension_reason, compliance_status(state, risk_level, score, synced_at)",
        )
        .order("legal_name"),
      supabase
        .from("content_reports")
        .select(
          "id, reason, created_at, posts(id, title), org_reviews(id, rating, comment, organizations(legal_name)), user_profiles!content_reports_reporter_id_fkey(display_name)",
        )
        .eq("status", "open")
        .order("created_at"),
      supabase.rpc("admin_list_subscriptions"),
      supabase
        .from("audit_log")
        .select("id, action, entity_type, actor_type, reason, created_at")
        .order("id", { ascending: false })
        .limit(30),
      supabase.rpc("admin_metrics"),
    ]);

  const orgList = (orgs ?? []) as unknown as OrgRow[];
  const reportList = (reports ?? []) as unknown as ReportRow[];
  const subList = (subscriptions ?? []) as SubscriptionRow[];
  const auditList = (audit ?? []) as AuditRow[];
  const kpis = (metrics ?? {}) as Record<string, number>;
  const kpiTiles: Array<[string, string]> = [
    ["Users", "users"],
    ["Visible orgs", "orgs_visible"],
    ["Active listings", "listings_active"],
    ["Applications", "listing_applications"],
    ["Events live", "events_published"],
    ["Registrations", "event_registrations"],
    ["Subscribers", "subscriptions_active"],
    ["Reviews", "reviews_published"],
    ["Open reports", "reports_open"],
  ];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-16">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight text-petroleum dark:text-foreground">
          Platform administration
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organizations, moderation, subscriptions, and the audit trail.
        </p>
      </header>

      <Notice error={error} saved={saved} />

      {/* KPI overview (BRD §9) */}
      <section aria-label="Platform metrics" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpiTiles.map(([label, key]) => (
          <div key={key} className="rounded-xl border border-border bg-card p-4">
            <p className="font-display text-2xl font-extrabold text-petroleum dark:text-foreground">
              {kpis[key] ?? 0}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
          </div>
        ))}
      </section>

      {/* Organizations & compliance sync health (DSH-4, ADM-2) */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold">
          Organizations ({orgList.length})
        </h2>
        {orgList.map((org) => {
          const standing = org.compliance_status;
          const stale = isSyncStale(standing?.synced_at, STALE_WARN_HOURS);
          return (
            <div
              key={org.id}
              className="rounded-xl border border-border px-5 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link href={`/orgs/${org.slug}`} className="font-medium underline-offset-4 hover:underline">
                    {org.legal_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {org.is_visible ? (
                      <span className="text-emerald-dark">visible</span>
                    ) : (
                      <span className="text-amber-600">hidden</span>
                    )}
                    {" · grant "}{org.grant_active ? "active" : "inactive"}
                    {standing
                      ? ` · ${standing.state} / ${standing.risk_level} / ${standing.score}`
                      : " · no standing data"}
                    {stale ? (
                      <span className="text-red-600"> · sync stale</span>
                    ) : null}
                    {org.admin_suspended
                      ? ` · SUSPENDED: ${org.suspension_reason ?? "no reason"}`
                      : ""}
                  </p>
                </div>
                {org.admin_suspended ? (
                  <form action={setOrgSuspension}>
                    <input type="hidden" name="org_id" value={org.id} />
                    <input type="hidden" name="suspend" value="0" />
                    <button className={buttonGhostCls}>Unsuspend</button>
                  </form>
                ) : (
                  <form action={setOrgSuspension} className="flex items-center gap-2">
                    <input type="hidden" name="org_id" value={org.id} />
                    <input type="hidden" name="suspend" value="1" />
                    <input
                      name="reason"
                      required
                      placeholder="Suspension reason"
                      className={`${inputCls} w-44`}
                    />
                    <button className={`${buttonGhostCls} text-destructive`}>
                      Suspend
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Moderation queue (ADM-3) */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold">
          Moderation queue ({reportList.length})
        </h2>
        {reportList.map((report) => {
          const isReview = Boolean(report.org_reviews);
          const review = report.org_reviews;
          return (
            <div
              key={report.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-5 py-4"
            >
              <div>
                <p className="font-medium">
                  {isReview
                    ? `Review of ${review?.organizations?.legal_name ?? "organization"} — ${review?.rating}★${
                        review?.comment ? ` “${review.comment.slice(0, 80)}${review.comment.length > 80 ? "…" : ""}”` : ""
                      }`
                    : report.posts?.title ?? "Deleted post"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Reported by {report.user_profiles?.display_name ?? "user"} ·{" "}
                  {new Date(report.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}{" "}
                  · “{report.reason}”
                </p>
              </div>
              <div className="flex items-center gap-2">
                <form action={resolveReport}>
                  <input type="hidden" name="report_id" value={report.id} />
                  <input type="hidden" name="target" value={isReview ? "review" : "post"} />
                  <input type="hidden" name="post_id" value={report.posts?.id ?? ""} />
                  <input type="hidden" name="review_id" value={review?.id ?? ""} />
                  <input type="hidden" name="action" value="remove" />
                  <button className={`${buttonGhostCls} text-destructive`}>
                    {isReview ? "Remove review" : "Remove post"}
                  </button>
                </form>
                <form action={resolveReport}>
                  <input type="hidden" name="report_id" value={report.id} />
                  <input type="hidden" name="target" value={isReview ? "review" : "post"} />
                  <input type="hidden" name="post_id" value={report.posts?.id ?? ""} />
                  <input type="hidden" name="review_id" value={review?.id ?? ""} />
                  <input type="hidden" name="action" value="dismiss" />
                  <button className={buttonGhostCls}>Dismiss</button>
                </form>
              </div>
            </div>
          );
        })}
        {!reportList.length ? (
          <p className="text-sm text-muted-foreground">
            No open reports.
          </p>
        ) : null}
      </section>

      {/* Subscriptions (SUB-5, payments deferred) */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold">
          Subscriptions ({subList.length})
        </h2>
        <div className="flex flex-wrap gap-3">
          <form action={grantCompSubscription} className="flex items-center gap-2">
            <input
              name="email"
              type="email"
              required
              placeholder="account email"
              className={`${inputCls} w-64`}
            />
            <button className={buttonCls}>Grant 1-year access</button>
          </form>
          <form action={revokeSubscription} className="flex items-center gap-2">
            <input
              name="email"
              type="email"
              required
              placeholder="account email"
              className={`${inputCls} w-64`}
            />
            <button className={`${buttonGhostCls} text-destructive`}>
              Revoke
            </button>
          </form>
        </div>
        <ul className="flex flex-col gap-2 text-sm">
          {subList.map((sub) => (
            <li
              key={sub.email}
              className="flex flex-wrap justify-between gap-2 rounded-lg border border-border px-4 py-2"
            >
              <span className="font-medium">{sub.email}</span>
              <span className="text-muted-foreground">
                {sub.plan_id} ·{" "}
                <span className={["active", "trialing"].includes(sub.status) ? "text-emerald-dark" : ""}>
                  {sub.status}
                </span>
                {sub.current_period_end
                  ? ` · until ${new Date(sub.current_period_end).toLocaleDateString("en-GB", { dateStyle: "medium" })}`
                  : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Audit log (ADM-4) */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold">Audit log (last 30)</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {auditList.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap justify-between gap-2 border-b border-border/60 py-1.5"
            >
              <span>
                <span className="font-medium">{entry.action}</span>
                <span className="text-muted-foreground">
                  {" "}· {entry.entity_type} · {entry.actor_type}
                  {entry.reason ? ` · ${entry.reason}` : ""}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(entry.created_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
