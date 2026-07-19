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

  const { data: memberships } = await supabase
    .from("org_members")
    .select(
      "role, organizations(id, slug, legal_name, is_visible, grant_active, admin_suspended, compliance_status(state, risk_level, score, renewal_expiry, synced_at))",
    )
    .eq("user_id", user.id);

  const orgs = (memberships ?? [])
    .map((m) => m.organizations as unknown as OrgRow)
    .filter(Boolean);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-16">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Signed in as {user.email}
          </p>
        </div>
        <form action={signOut}>
          <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
            Sign out
          </button>
        </form>
      </header>

      {claimed ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          Organization claimed successfully. Public profile:{" "}
          <Link href={`/orgs/${claimed}`} className="font-medium underline">
            /orgs/{claimed}
          </Link>
        </p>
      ) : null}
      {claim_error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {claim_error}
        </p>
      ) : null}

      {orgs.length === 0 ? (
        <section className="rounded-2xl border border-black/10 p-8 dark:border-white/15">
          <h2 className="text-xl font-semibold">Claim your organization</h2>
          <p className="mt-2 max-w-xl text-sm text-gray-600 dark:text-gray-300">
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
              className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
            />
            <button className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-85">
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
              className="rounded-2xl border border-black/10 p-8 dark:border-white/15"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{org.legal_name}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    /orgs/{org.slug}
                  </p>
                </div>
                <span
                  className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                    org.is_visible
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  }`}
                >
                  {org.is_visible ? "Publicly visible" : "Hidden from public"}
                </span>
              </div>

              {!org.is_visible ? (
                <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
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
                  <dt className="text-gray-500 dark:text-gray-400">Standing</dt>
                  <dd className="font-medium capitalize">
                    {standing?.state?.replace("_", " ") ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Risk</dt>
                  <dd className="font-medium capitalize">
                    {standing?.risk_level ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Score</dt>
                  <dd className="font-medium">{standing?.score ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">
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
                  className="rounded-full border border-black/10 px-4 py-2 font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                >
                  View public profile
                </Link>
                <Link
                  href="/dashboard/profile"
                  className="rounded-full border border-black/10 px-4 py-2 font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                >
                  Edit profile
                </Link>
                <Link
                  href="/dashboard/catalog"
                  className="rounded-full border border-black/10 px-4 py-2 font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                >
                  Catalog
                </Link>
                <Link
                  href="/dashboard/posts"
                  className="rounded-full border border-black/10 px-4 py-2 font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                >
                  Posts
                </Link>
                <span className="rounded-full border border-dashed border-black/10 px-4 py-2 text-gray-400 dark:border-white/15">
                  Events — Phase 3
                </span>
              </div>
            </section>
          );
        })
      )}
    </main>
  );
}
