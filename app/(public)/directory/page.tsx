import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Directory",
  description:
    "Browse compliance-verified organizations on Truvis.info.",
};

export const dynamic = "force-dynamic";

type DirectoryOrg = {
  slug: string;
  legal_name: string;
  tagline: string | null;
  jurisdiction: string | null;
  industry_code: string | null;
  size_band: string | null;
};

export default async function DirectoryPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Directory</h1>
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          The directory backend is not configured in this environment.
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  // RLS only returns orgs with is_visible = true to public readers (DIR-6).
  const { data: orgs } = await supabase
    .from("organizations")
    .select("slug, legal_name, tagline, jurisdiction, industry_code, size_band")
    .order("legal_name");

  const list = (orgs ?? []) as DirectoryOrg[];

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Directory</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          {list.length} verified organization{list.length === 1 ? "" : "s"}.
          Every listing is continuously vetted through the Truvis compliance
          platform.
        </p>
      </header>

      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/15 p-10 text-center text-gray-500 dark:border-white/20 dark:text-gray-400">
          No organizations published yet. Verified organizations appear here as
          soon as they authorize publication.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((org) => (
            <li key={org.slug}>
              <Link
                href={`/orgs/${org.slug}`}
                className="flex flex-col gap-1 rounded-2xl border border-black/10 p-6 transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold">
                    {org.legal_name}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Verified
                  </span>
                </div>
                {org.tagline ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {org.tagline}
                  </p>
                ) : null}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {[org.jurisdiction, org.industry_code, org.size_band]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
