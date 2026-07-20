import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { reportPost } from "@/lib/moderation/actions";

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
  organizations: { slug: string; legal_name: string };
};

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ reported?: string; error?: string }>;
}) {
  const { reported, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // RLS keeps posts of hidden orgs out (POST-2 / DIR-6).
  const [{ data: posts }, { data: follows }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, body, published_at, org_id, organizations!inner(slug, legal_name)")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(50),
    user
      ? supabase.from("org_follows").select("org_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] as Array<{ org_id: string }> }),
  ]);

  // Followed organizations first (POST-2), then newest.
  const followedIds = new Set((follows ?? []).map((f) => f.org_id));
  const list = ((posts ?? []) as unknown as (FeedPost & { org_id: string })[]).sort(
    (a, b) => Number(followedIds.has(b.org_id)) - Number(followedIds.has(a.org_id)),
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <header className="mb-10">
        <h1 className="font-display text-3xl font-bold tracking-tight text-petroleum dark:text-foreground">Feed</h1>
        <p className="mt-2 text-muted-foreground">
          Updates from verified organizations.
        </p>
      </header>

      {reported ? (
        <p className="mb-6 rounded-lg border border-emerald-brand/30 bg-emerald-brand/5 px-4 py-3 text-sm text-emerald-deeper dark:text-emerald-brand">
          Thanks — the post was reported for review.
        </p>
      ) : null}
      {error ? (
        <p className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No updates published yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-5">
          {list.map((post) => (
            <li
              key={post.id}
              className="rounded-2xl border border-border p-6"
            >
              <div className="flex items-center gap-2 text-sm">
                <Link
                  href={`/orgs/${post.organizations.slug}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {post.organizations.legal_name}
                </Link>
                <span className="rounded-full bg-emerald-brand/10 px-2 py-0.5 text-[10px] font-medium text-emerald-deeper dark:text-emerald-brand">
                  Verified
                </span>
                {post.published_at ? (
                  <span className="text-xs text-muted-foreground">
                    {new Date(post.published_at).toLocaleDateString("en-GB", {
                      dateStyle: "medium",
                    })}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-2 font-semibold">{post.title}</h2>
              <p className="mt-1 whitespace-pre-line text-sm text-foreground/80">
                {post.body?.text ?? ""}
              </p>
              {user ? (
                <form action={reportPost} className="mt-3 flex items-center gap-2">
                  <input type="hidden" name="post_id" value={post.id} />
                  <input
                    name="reason"
                    placeholder="Reason (optional)"
                    maxLength={300}
                    className="rounded-lg border border-border px-2 py-1 text-xs "
                  />
                  <button className="text-xs text-muted-foreground underline underline-offset-4">
                    Report
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
