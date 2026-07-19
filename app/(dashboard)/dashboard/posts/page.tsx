import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getManagedOrg } from "@/lib/orgs/queries";
import { createPost, setPostStatus, deletePost } from "@/lib/posts/actions";
import {
  Notice,
  inputCls,
  buttonCls,
  buttonGhostCls,
} from "@/components/form-field";

export const metadata: Metadata = { title: "Posts" };

type Post = {
  id: string;
  title: string;
  status: string;
  published_at: string | null;
};

export default async function PostsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/posts");
  const org = await getManagedOrg(supabase, user.id);
  if (!org) redirect("/dashboard");

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, status, published_at")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <Link href="/dashboard" className="text-sm text-gray-500 underline underline-offset-4 dark:text-gray-400">
          ← Dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Posts</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Updates published here appear on your profile and in the public feed.
        </p>
      </div>

      <Notice error={error} saved={saved} />

      <section className="rounded-2xl border border-black/10 p-6 dark:border-white/15">
        <h2 className="mb-4 font-semibold">Write a post</h2>
        <form action={createPost} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Title
            <input name="title" required maxLength={160} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Body
            <textarea name="body" required rows={6} maxLength={10000} className={inputCls} />
          </label>
          <div className="flex gap-3">
            <button type="submit" name="publish" value="1" className={buttonCls}>
              Publish
            </button>
            <button type="submit" name="publish" value="0" className={buttonGhostCls}>
              Save draft
            </button>
          </div>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Your posts ({posts?.length ?? 0})</h2>
        {(posts as Post[] | null)?.map((post) => (
          <div
            key={post.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 px-5 py-4 dark:border-white/15"
          >
            <div>
              <p className="font-medium">{post.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <span className={post.status === "published" ? "text-emerald-600" : ""}>
                  {post.status}
                </span>
                {post.published_at
                  ? ` · ${new Date(post.published_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}`
                  : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <form action={setPostStatus}>
                <input type="hidden" name="id" value={post.id} />
                <input
                  type="hidden"
                  name="status"
                  value={post.status === "published" ? "draft" : "published"}
                />
                <button className={buttonGhostCls}>
                  {post.status === "published" ? "Unpublish" : "Publish"}
                </button>
              </form>
              <form action={deletePost}>
                <input type="hidden" name="id" value={post.id} />
                <button className={`${buttonGhostCls} text-red-600 dark:text-red-400`}>
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
        {!posts?.length ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No posts yet.
          </p>
        ) : null}
      </section>
    </main>
  );
}
