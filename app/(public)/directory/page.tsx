import type { Metadata } from "next";
import Link from "next/link";
import { Search, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  OrgBusinessCard,
  type DirectoryOrg,
} from "@/components/org-business-card";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BrandArt } from "@/components/brand-art";

export const metadata: Metadata = {
  title: "Directory",
  description: "Browse compliance-verified organizations on Truvis.info.",
};

export const dynamic = "force-dynamic";

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; industry?: string; jurisdiction?: string }>;
}) {
  const { q, industry, jurisdiction } = await searchParams;
  const supabase = await createClient();

  // Search + facets via search_orgs (RLS keeps hidden orgs out — DIR-4/5/6).
  const [{ data: orgs }, { data: allVisible }] = await Promise.all([
    supabase.rpc("search_orgs", {
      p_query: q ?? null,
      p_industry: industry ?? null,
      p_jurisdiction: jurisdiction ?? null,
    }),
    supabase.from("organizations").select("industry_code, jurisdiction"),
  ]);

  const list = (orgs ?? []) as DirectoryOrg[];
  const industries = [...new Set((allVisible ?? []).map((o) => o.industry_code).filter(Boolean))] as string[];
  const jurisdictions = [...new Set((allVisible ?? []).map((o) => o.jurisdiction).filter(Boolean))] as string[];

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-14 lg:px-12">
      <header className="mb-8 max-w-2xl">
        <h1 className="font-display text-3xl font-bold tracking-tight text-petroleum dark:text-foreground">
          Business Directory
        </h1>
        <p className="mt-2 text-muted-foreground">
          {list.length} verified organization{list.length === 1 ? "" : "s"} —
          every listing continuously vetted through Truvis Compliance.
        </p>
      </header>

      {/* Search & facets */}
      <form
        method="GET"
        className="mb-10 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center"
        role="search"
        aria-label="Search the directory"
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by name or description…"
            aria-label="Search organizations"
            className="pl-9"
          />
        </div>
        <Select name="industry" defaultValue={industry ?? ""} aria-label="Filter by industry" className="sm:w-44">
          <option value="">All industries</option>
          {industries.map((code) => (
            <option key={code} value={code}>{code}</option>
          ))}
        </Select>
        <Select name="jurisdiction" defaultValue={jurisdiction ?? ""} aria-label="Filter by jurisdiction" className="sm:w-44">
          <option value="">All jurisdictions</option>
          {jurisdictions.map((code) => (
            <option key={code} value={code}>{code}</option>
          ))}
        </Select>
        <Button type="submit" variant="primary">Search</Button>
      </form>

      {list.length === 0 ? (
        <div className="relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-border py-20 text-center">
          <BrandArt seed="empty-directory" variant="empty" />
          <Building2 className="relative z-10 size-10 text-muted-foreground/50" aria-hidden />
          <p className="relative z-10 font-medium">No organizations match your search.</p>
          <p className="relative z-10 text-sm text-muted-foreground">
            Try different keywords, or{" "}
            <Link href="/directory" className="font-medium text-emerald-dark underline underline-offset-4">
              clear the filters
            </Link>
            .
          </p>
          <Button asChild variant="outline" size="sm" className="relative z-10">
            <Link href="/signup">List your organization</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((org) => (
            <li key={org.slug}>
              <OrgBusinessCard org={org} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
