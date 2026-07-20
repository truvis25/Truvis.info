import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { claimOrganization } from "@/lib/compliance/actions";
import { signOut } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Dashboard" };

type OrgRow = {
  id: string;
  slug: string;
  legal_name: string;
  is_visible: boolean;
  grant_active: boolean;
  admin_suspended: boolean;
  compliance_status: {
    state: string;
    risk_level: string;
    score: number;
    renewal_expiry: string | null;
    synced_at: string;
  } | null;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ claim_error?: string; claimed?: string }>;
}) {
  const { claim_error, claimed } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const [{ data: memberships }, { data: myRegistrations }] = await Promise.all([
    supabase
      .from("org_members")
      .select(
        "role, organizations(id, slug, legal_name, is_visible, grant_active, admin_suspended, compliance_status(state, risk_level, score, renewal_expiry, synced_at))",
      )
      .eq("user_id", user.id),
    supabase
      .from("event_registrations")
      .select("id, status, events(slug, title, starts_at)")
      .eq("user_id", user.id)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const orgs = (memberships ?? [])
    .map((m) => m.organizations as unknown as OrgRow)
    .filter(Boolean);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-16">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-petroleum dark:text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {user.email}
          </p>
        </div>
        <form action={signOut}>
          <button className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary dark:hover:bg-secondary">
            Sign out
          </button>
        </form>
      </header>

      {claimed ? (
        <p className="rounded-lg border border-emerald-brand/30 bg-emerald-brand/5 px-4 py-3 text-sm text-emerald-deeper dark:text-emerald-brand">
          Organization claimed successfully. Public profile:{" "}
          <Link href={`/orgs/${claimed}`} className="font-medium underline">
            /orgs/{claimed}
          </Link>
        </p>
      ) : null}
      {claim_error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {claim_error}
        </p>
      ) : null}

      {orgs.length === 0 ? (
        <section className="rounded-2xl border border-border p-8">
          <h2 className="font-display text-xl font-bold">Claim your organization</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            If your organization is registered on{" "}
            <span className="font-medium">compliance.truvis.tech</span> and has
            authorized publication, enter its compliance organization ID to
            claim its verified profile here.
          </p>
          <form action={claimOrganization} className="mt-6 flex max-w-md gap-3">
            <input
              name="compliance_org_id"
              placeholder="e.g. org-demo-1"
              required
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm "
            />
            <button className="rounded-md bg-gradient-to-r from-emerald-dark to-emerald-deeper shadow-[0_6px_20px_-6px_rgba(16,185,129,0.45)] px-5 py-2 text-sm font-medium text-white transition-all hover:-translate-y-0.5">
              Claim
            </button>
          </form>
        </section>
      ) : (
        orgs.map((org) => {
          const standing = org.compliance_status;
          return (
            <section
              key={org.id}
              className="rounded-2xl border border-border p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold">{org.legal_name}</h2>
                  <p className="text-sm text-muted-foreground">
                    /orgs/{org.slug}
                  </p>
                </div>
                <span
                  className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                    org.is_visible
                      ? "bg-emerald-brand/10 text-emerald-deeper dark:text-emerald-brand"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  }`}
                >
                  {org.is_visible ? "Publicly visible" : "Hidden from public"}
                </span>
              </div>

              {!org.is_visible ? (
                <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                  Your profile is currently not shown in the public directory.
                  {org.admin_suspended
                    ? " It was suspended by platform administration."
                    : !org.grant_active
                      ? " The publication grant is inactive — re-authorize on compliance.truvis.tech."
                      : " Review your compliance standing on compliance.truvis.tech to restore visibility."}
                </p>
              ) : null}

              <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-muted-foreground">Standing</dt>
                  <dd className="font-medium capitalize">
                    {standing?.state?.replace("_", " ") ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Risk</dt>
                  <dd className="font-medium capitalize">
                    {standing?.risk_level ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Score</dt>
                  <dd className="font-medium">{standing?.score ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    Last synced
                  </dt>
                  <dd className="font-medium">
                    {standing
                      ? new Date(standing.synced_at).toLocaleString("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <Link
                  href={`/orgs/${org.slug}`}
                  className="rounded-full border border-border px-4 py-2 font-medium hover:bg-secondary dark:hover:bg-secondary"
                >
                  View public profile
                </Link>
                <Link
                  href="/dashboard/profile"
                  className="rounded-full border border-border px-4 py-2 font-medium hover:bg-secondary dark:hover:bg-secondary"
                >
                  Edit profile
                </Link>
                <Link
                  href="/dashboard/catalog"
                  className="rounded-full border border-border px-4 py-2 font-medium hover:bg-secondary dark:hover:bg-secondary"
                >
                  Catalog
                </Link>
                <Link
                  href="/dashboard/posts"
                  className="rounded-full border border-border px-4 py-2 font-medium hover:bg-secondary dark:hover:bg-secondary"
                >
                  Posts
                </Link>
                <Link
                  href="/dashboard/events"
                  className="rounded-full border border-border px-4 py-2 font-medium hover:bg-secondary dark:hover:bg-secondary"
                >
                  Events
                </Link>
                <Link
                  href="/dashboard/listings"
                  className="rounded-full border border-border px-4 py-2 font-medium hover:bg-secondary dark:hover:bg-secondary"
                >
                  Marketplace listings
                </Link>
              </div>
            </section>
          );
        })
      )}

      <section className="rounded-2xl border border-border p-8">
        <h2 className="font-display text-xl font-bold">Marketplace</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Track your review applications and seller threads under{" "}
          <Link href="/dashboard/applications" className="underline underline-offset-4">
            My applications
          </Link>
          , or browse the{" "}
          <Link href="/marketplace" className="underline underline-offset-4">
            marketplace
          </Link>
          .
        </p>
      </section>

      <section className="rounded-2xl border border-border p-8">
        <h2 className="font-display text-xl font-bold">My events</h2>
        {myRegistrations?.length ? (
          <ul className="mt-4 flex flex-col gap-3">
            {myRegistrations.map((reg) => {
              const event = reg.events as unknown as {
                slug: string;
                title: string;
                starts_at: string;
              } | null;
              if (!event) return null;
              return (
                <li
                  key={reg.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <Link
                    href={`/events/${event.slug}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {event.title}
                  </Link>
                  <span className="text-muted-foreground">
                    {new Date(event.starts_at).toLocaleDateString("en-GB", {
                      dateStyle: "medium",
                    })}
                    {" · "}
                    <span
                      className={
                        reg.status === "approved"
                          ? "text-emerald-dark"
                          : reg.status === "pending"
                            ? "text-amber-600"
                            : ""
                      }
                    >
                      {reg.status}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            You have no event registrations yet.{" "}
            <Link href="/events" className="underline underline-offset-4">
              Browse events
            </Link>
          </p>
        )}
      </section>
    </main>
  );
}
