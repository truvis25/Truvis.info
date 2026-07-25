import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/config";
import {
  INDUSTRIES,
  industryBySlug,
} from "@/lib/taxonomy/industries";
import {
  OrgBusinessCard,
  type DirectoryOrg,
} from "@/components/org-business-card";
import { Button } from "@/components/ui/button";
import { BrandArt } from "@/components/brand-art";

export const dynamic = "force-dynamic";

// Pre-render the known industry slugs.
export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const industry = industryBySlug(slug);
  if (!industry) return { title: "Industry not found" };
  const title = `Verified ${industry.label} Companies`;
  const description = `Browse compliance-verified ${industry.label.toLowerCase()} organizations on Truvis.info. ${industry.blurb}`;
  const url = `${SITE_URL}/directory/industry/${industry.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
  };
}

export default async function IndustryDirectoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const industry = industryBySlug(slug);
  if (!industry) notFound();

  const supabase = await createClient();
  const { data } = await supabase.rpc("search_orgs", {
    p_query: null,
    p_industry: industry.code,
    p_jurisdiction: null,
  });
  const orgs = (data ?? []) as DirectoryOrg[];

  // JSON-LD: a CollectionPage listing the verified orgs in this industry.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Verified ${industry.label} Companies`,
    description: industry.blurb,
    url: `${SITE_URL}/directory/industry/${industry.slug}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: orgs.length,
      itemListElement: orgs.slice(0, 25).map((org, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/orgs/${org.slug}`,
        name: org.legal_name,
      })),
    },
  };

  return (
    <main className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Industry band — mirrors the directory's dark signature surface */}
      <header className="art-on-petroleum relative overflow-hidden bg-gradient-to-br from-petroleum-deep via-petroleum to-petroleum-light text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 [mask-image:linear-gradient(to_top,black,transparent)]"
        >
          <BrandArt seed={`industry-${industry.slug}`} variant="horizon" draw />
        </div>
        <div className="relative mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-6 px-6 pb-16 pt-12 lg:px-12">
          <div className="max-w-2xl">
            <nav aria-label="Breadcrumb" className="mb-3 text-sm text-white/60">
              <Link href="/directory" className="hover:text-white">Directory</Link>
              <span aria-hidden> / </span>
              <span className="text-white/90">{industry.label}</span>
            </nav>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Verified {industry.label} companies
            </h1>
            <p className="mt-2 text-white/70">{industry.blurb} Every organization below is in continuous good compliance standing.</p>
          </div>
          <p className="font-display text-6xl font-extrabold tabular-nums text-emerald-brand">
            {orgs.length}
            <span className="ml-3 align-middle text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              verified
            </span>
          </p>
        </div>
        <div aria-hidden className="rule-engraved absolute inset-x-0 bottom-0" />
      </header>

      <div className="mx-auto w-full max-w-5xl px-6 pb-14 lg:px-12">
        {orgs.length === 0 ? (
          <div className="relative mt-8 flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-border py-20 text-center">
            <BrandArt seed="empty-industry" variant="empty" />
            <Building2 className="relative z-10 size-10 text-muted-foreground/50" aria-hidden />
            <p className="relative z-10 font-medium">
              No verified {industry.label.toLowerCase()} companies yet.
            </p>
            <p className="relative z-10 text-sm text-muted-foreground">
              Check the{" "}
              <Link href="/directory" className="underline underline-offset-4">full directory</Link>{" "}
              or claim your organization&apos;s profile.
            </p>
            <Button asChild variant="outline" size="sm" className="relative z-10">
              <Link href="/signup">Claim your profile</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {orgs.map((org) => (
              <li key={org.slug} className="reveal">
                <OrgBusinessCard org={org} />
              </li>
            ))}
          </ul>
        )}

        {/* Cross-links: other industries (crawlable internal linking) */}
        <nav aria-label="Other industries" className="mt-14 border-t border-border pt-8">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em] text-emerald-deeper dark:text-emerald-brand">
            Browse other industries
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {INDUSTRIES.filter((i) => i.slug !== industry.slug).map((i) => (
              <li key={i.slug}>
                <Link
                  href={`/directory/industry/${i.slug}`}
                  className="inline-block rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
                >
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}
