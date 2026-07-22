import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Newspaper } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { reportPost } from "@/lib/moderation/actions";
import { formatDate } from "@/lib/format";
import { Pagination, pageCountFor, parsePage } from "@/components/pagination";
import { Card } from "@/components/ui/card";
import { VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandArt } from "@/components/brand-art";
import { initials } from "@/lib/utils";

const FEED_PAGE_SIZE = 20;

export const metadata: Metadata = {
  title: "Feed",
  description: "Latest updates from verified organizations on Truvis.info.",
};

export const dynamic = "force-dynamic";

type FeedPost = {
  id: string;
  title: string;
  body: { text?: string } | null;
  published_at: string | null;
  organizations: { slug: string; legal_name: string; logo_url: string | null };
};

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ reported?: string; error?: string; page?: string }>;
}) {
  const { reported, error, page: pageRaw } = await searchParams;
  const page = parsePage(pageRaw);
  const from = (page - 1) * FEED_PAGE_SIZE;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // RLS keeps posts of hidden orgs out (POST-2 / DIR-6).
  const [{ data: posts, count: postCount }, { data: follows }] = await Promise.all([
    supabase
      .from("posts")
      .select(
        "id, title, body, published_at, org_id, organizations!inner(slug, legal_name, logo_url)",
        { count: "exact" },
      )
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(from, from + FEED_PAGE_SIZE - 1),
    user
      ? supabase.from("org_follows").select("org_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] as Array<{ org_id: string }> }),
  ]);

  const pageCount = pageCountFor(postCount ?? 0, FEED_PAGE_SIZE);

  // Followed organizations first within the page (POST-2), then newest.
  const followedIds = new Set((follows ?? []).map((f) => f.org_id));
  const list = ((posts ?? []) as unknown as (FeedPost & { org_id: string })[]).sort(
    (a, b) => Number(followedIds.has(b.org_id)) - Number(followedIds.has(a.org_id)),
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <header className="mb-10">
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-deeper dark:text-emerald-brand">
          <span aria-hidden className="relative inline-block size-3">
            <BrandArt seed="truvis-hero" variant="medallion" rings={1} accent="emerald" />
          </span>
          Live from the network
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-petroleum dark:text-foreground">
          Updates Feed
        </h1>
        <p className="mt-2 text-muted-foreground">
          Every update below is published by a compliance-verified
          organization.{" "}
          <Link
            href="/#network"
            className="link-engraved font-semibold text-emerald-deeper dark:text-emerald-brand"
          >
            Back to the network hub →
          </Link>
        </p>
      </header>

      {reported ? (
        <p role="status" className="mb-6 rounded-lg border border-emerald-brand/30 bg-emerald-brand/5 px-4 py-3 text-sm text-emerald-deeper dark:text-emerald-brand">
          Thanks — the post was reported for review.
        </p>
      ) : null}
      {error ? (
        <p className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {list.length === 0 ? (
        <div className="relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-border py-20 text-center">
          <BrandArt seed="empty-feed" variant="empty" />
          <Newspaper className="relative z-10 size-10 text-muted-foreground/50" aria-hidden />
          <p className="relative z-10 font-medium">No updates published yet.</p>
          <p className="relative z-10 text-sm text-muted-foreground">
            Follow verified organizations to see their updates here.
          </p>
          <Button asChild variant="outline" size="sm" className="relative z-10">
            <Link href="/directory">Explore the directory</Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((post) => {
            const org = post.organizations;
            return (
              <li key={post.id} className="reveal">
                <Card className="overflow-hidden p-0">
                  <div className="flex items-start gap-3 p-5 pb-3">
                    {org.logo_url ? (
                      <Image
                        src={org.logo_url}
                        alt=""
                        width={40}
                        height={40}
                        className="size-10 rounded-lg bg-card object-contain ring-1 ring-border"
                      />
                    ) : (
                      <span className="art-on-petroleum relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-petroleum to-petroleum-deep font-display text-sm font-bold text-white">
                        <BrandArt seed={org.slug} variant="medallion" rings={1} className="scale-[1.3] opacity-60" />
                        <span className="relative z-10">{initials(org.legal_name)}</span>
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Link
                          href={`/orgs/${org.slug}`}
                          className="truncate hover:underline"
                        >
                          {org.legal_name}
                        </Link>
                        <VerifiedBadge />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        posted an update
                        {post.published_at ? (
                          <>
                            {" · "}
                            <time dateTime={post.published_at}>
                              {formatDate(post.published_at)}
                            </time>
                          </>
                        ) : null}
                      </p>
                    </div>
                  </div>
                  <div aria-hidden className="rule-engraved ml-5 max-w-[60%]" />
                  <div className="px-5 pb-4 pt-3">
                    <h2 className="font-display text-base font-bold leading-snug">
                      {post.title}
                    </h2>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-foreground/80">
                      {post.body?.text ?? ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 border-t border-border/60 px-5 py-2.5 text-xs">
                    <Link
                      href={`/orgs/${org.slug}`}
                      className="link-engraved font-semibold text-emerald-deeper dark:text-emerald-brand"
                    >
                      View organization →
                    </Link>
                    {user ? (
                      <form action={reportPost} className="ml-auto flex items-center gap-2">
                        <input type="hidden" name="post_id" value={post.id} />
                        <input
                          name="reason"
                          placeholder="Reason (optional)"
                          aria-label="Reason for reporting"
                          maxLength={300}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                        />
                        <button className="text-muted-foreground underline underline-offset-4 hover:text-foreground">
                          Report
                        </button>
                      </form>
                    ) : null}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
      <Pagination page={page} pageCount={pageCount} basePath="/feed" />
    </main>
  );
}
