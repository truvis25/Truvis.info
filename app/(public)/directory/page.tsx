import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Search, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { VerifiedBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Directory",
  description: "Browse compliance-verified organizations on Truvis.info.",
};

export const dynamic = "force-dynamic";

type DirectoryOrg = {
  slug: string;
  legal_name: string;
  tagline: string | null;
  jurisdiction: string | null;
  industry_code: string | null;
  size_band: string | null;
  logo_url: string | null;
};

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
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-20 text-center">
          <Building2 className="size-10 text-muted-foreground/50" aria-hidden />
          <p className="font-medium">No organizations match your search.</p>
          <p className="text-sm text-muted-foreground">
            Try different keywords, or{" "}
            <Link href="/directory" className="font-medium text-emerald-dark underline underline-offset-4">
              clear the filters
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((org) => (
            <li key={org.slug}>
              <Link href={`/orgs/${org.slug}`} className="group block h-full">
                <Card className="h-full transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_16px_40px_-16px_rgba(2,48,89,0.25)]">
                  <CardContent className="flex h-full flex-col p-6">
                    <div className="mb-4 flex items-center gap-3">
                      {org.logo_url ? (
                        <Image
                          src={org.logo_url}
                          alt=""
                          width={44}
                          height={44}
                          className="size-11 rounded-lg border border-border object-contain"
                        />
                      ) : (
                        <span className="flex size-11 items-center justify-center rounded-lg bg-gradient-to-br from-petroleum to-petroleum-deep font-display text-sm font-bold text-white">
                          {org.legal_name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <VerifiedBadge />
                    </div>
                    <h2 className="font-display text-base font-bold text-petroleum transition-colors group-hover:text-emerald-deeper dark:text-foreground">
                      {org.legal_name}
                    </h2>
                    {org.tagline ? (
                      <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted-foreground">
                        {org.tagline}
                      </p>
                    ) : (
                      <span className="flex-1" />
                    )}
                    <p className="mt-4 text-xs text-muted-foreground">
                      {[org.jurisdiction, org.industry_code, org.size_band]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
