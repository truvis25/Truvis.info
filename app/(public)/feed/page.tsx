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
        <h1 className="text-3xl font-semibold tracking-tight">Feed</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Updates from verified organizations.
        </p>
      </header>

      {reported ? (
        <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          Thanks — the post was reported for review.
        </p>
      ) : null}
      {error ? (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/15 p-10 text-center text-gray-500 dark:border-white/20 dark:text-gray-400">
          No updates published yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-5">
          {list.map((post) => (
            <li
              key={post.id}
              className="rounded-2xl border border-black/10 p-6 dark:border-white/15"
            >
              <div className="flex items-center gap-2 text-sm">
                <Link
                  href={`/orgs/${post.organizations.slug}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {post.organizations.legal_name}
                </Link>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Verified
                </span>
                {post.published_at ? (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(post.published_at).toLocaleDateString("en-GB", {
                      dateStyle: "medium",
                    })}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-2 font-semibold">{post.title}</h2>
              <p className="mt-1 whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                {post.body?.text ?? ""}
              </p>
              {user ? (
                <form action={reportPost} className="mt-3 flex items-center gap-2">
                  <input type="hidden" name="post_id" value={post.id} />
                  <input
                    name="reason"
                    placeholder="Reason (optional)"
                    maxLength={300}
                    className="rounded-lg border border-black/10 px-2 py-1 text-xs dark:border-white/15 dark:bg-transparent"
                  />
                  <button className="text-xs text-gray-500 underline underline-offset-4 dark:text-gray-400">
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
