import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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

export default async function FeedPage() {
  const supabase = await createClient();
  // RLS keeps posts of hidden orgs out (POST-2 / DIR-6).
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, body, published_at, organizations!inner(slug, legal_name)")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);

  const list = (posts ?? []) as unknown as FeedPost[];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Feed</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Updates from verified organizations.
        </p>
      </header>

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
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
