import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ContactPerson } from "@/types/domain";

export const dynamic = "force-dynamic";

type ProfileOrg = {
  id: string;
  slug: string;
  legal_name: string;
  tagline: string | null;
  description: string | null;
  website: string | null;
  jurisdiction: string | null;
  trade_license_no: string | null;
  incorporation_year: number | null;
  industry_code: string | null;
  size_band: string | null;
  contact_person: ContactPerson | null;
};

async function fetchOrg(slug: string): Promise<ProfileOrg | null> {
  const supabase = await createClient();
  // RLS returns nothing for hidden orgs — public routes 404 them (DIR-6).
  const { data } = await supabase
    .from("organizations")
    .select(
      "id, slug, legal_name, tagline, description, website, jurisdiction, trade_license_no, incorporation_year, industry_code, size_band, contact_person",
    )
    .eq("slug", slug)
    .maybeSingle();
  return (data as ProfileOrg | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const org = await fetchOrg(slug);
  if (!org) return { title: "Organization not found" };
  return {
    title: org.legal_name,
    description: org.tagline ?? `Verified profile of ${org.legal_name} on Truvis.info`,
  };
}

export default async function OrgProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = await fetchOrg(slug);
  if (!org) notFound();

  const supabase = await createClient();
  const [{ data: catalog }, { data: posts }] = await Promise.all([
    supabase
      .from("catalog_items")
      .select("slug, name, item_type, category, price_indication")
      .eq("org_id", org.id)
      .eq("status", "published")
      .order("sort_order")
      .order("name"),
    supabase
      .from("posts")
      .select("id, title, body, published_at")
      .eq("org_id", org.id)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(10),
  ]);

  const contact = org.contact_person;
  const facts: Array<[string, string | number | null]> = [
    ["Jurisdiction", org.jurisdiction],
    ["Trade license", org.trade_license_no],
    ["Founded", org.incorporation_year],
    ["Industry", org.industry_code],
    ["Company size", org.size_band],
  ];

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
      <Link
        href="/directory"
        className="text-sm text-gray-500 underline underline-offset-4 dark:text-gray-400"
      >
        ← Directory
      </Link>

      <header className="mt-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            {org.legal_name}
          </h1>
          <span
            className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            title="Identity and standing verified via the Truvis compliance platform"
          >
            ✓ Verified via Truvis Compliance
          </span>
        </div>
        {org.tagline ? (
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {org.tagline}
          </p>
        ) : null}
        {org.website ? (
          <a
            href={org.website}
            rel="noopener noreferrer nofollow"
            target="_blank"
            className="text-sm font-medium underline underline-offset-4"
          >
            {org.website}
          </a>
        ) : null}
      </header>

      <section className="mt-10 grid gap-8 sm:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-8">
          {org.description ? (
            <div>
              <h2 className="mb-2 font-semibold">About</h2>
              <p className="whitespace-pre-line text-sm leading-6 text-gray-700 dark:text-gray-300">
                {org.description}
              </p>
            </div>
          ) : null}
          {catalog?.length ? (
            <div>
              <h2 className="mb-3 font-semibold">Products &amp; services</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {catalog.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/orgs/${org.slug}/catalog/${item.slug}`}
                      className="flex h-full flex-col gap-1 rounded-xl border border-black/10 p-4 transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
                    >
                      <span className="font-medium">{item.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {[item.item_type, item.category, item.price_indication]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {posts?.length ? (
            <div>
              <h2 className="mb-3 font-semibold">Latest updates</h2>
              <ul className="flex flex-col gap-4">
                {posts.map((post) => (
                  <li
                    key={post.id}
                    className="rounded-xl border border-black/10 p-4 dark:border-white/15"
                  >
                    <p className="font-medium">{post.title}</p>
                    {post.published_at ? (
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(post.published_at).toLocaleDateString("en-GB", {
                          dateStyle: "medium",
                        })}
                      </p>
                    ) : null}
                    <p className="mt-2 whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                      {(post.body as { text?: string })?.text ?? ""}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <h2 className="mb-2 font-semibold">Company facts</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {facts
                .filter(([, v]) => v != null && v !== "")
                .map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-gray-500 dark:text-gray-400">
                      {label}
                    </dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
            </dl>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Company facts are sourced from the organization&apos;s verified
              records on the Truvis compliance platform.
            </p>
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          {contact ? (
            <div className="rounded-2xl border border-black/10 p-6 dark:border-white/15">
              <h2 className="mb-3 font-semibold">Contact person</h2>
              <p className="font-medium">{contact.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {contact.title}
              </p>
              <div className="mt-3 flex flex-col gap-1 text-sm">
                <a
                  href={`mailto:${contact.email}`}
                  className="underline underline-offset-4"
                >
                  {contact.email}
                </a>
                <a
                  href={`tel:${contact.phone}`}
                  className="underline underline-offset-4"
                >
                  {contact.phone}
                </a>
              </div>
            </div>
          ) : null}
          <div className="rounded-2xl border border-dashed border-black/10 p-6 text-sm text-gray-500 dark:border-white/15 dark:text-gray-400">
            Events by this organization arrive in Phase 3.
          </div>
        </aside>
      </section>
    </main>
  );
}
