import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getManagedOrg } from "@/lib/orgs/queries";
import { updateOrgProfile } from "@/lib/orgs/actions";
import { Notice, inputCls, buttonCls } from "@/components/form-field";

export const metadata: Metadata = { title: "Edit profile" };

export default async function ProfileEditPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/profile");
  const org = await getManagedOrg(supabase, user.id);
  if (!org) redirect("/dashboard");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <Link href="/dashboard" className="text-sm text-gray-500 underline underline-offset-4 dark:text-gray-400">
          ← Dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Edit public profile
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          {org.legal_name} — marketing content. Verified company facts are
          managed on compliance.truvis.tech and cannot be edited here.
        </p>
      </div>

      <Notice error={error} saved={saved} />

      <form action={updateOrgProfile} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Tagline
          <input
            name="tagline"
            defaultValue={org.tagline ?? ""}
            maxLength={140}
            placeholder="One line describing what you do"
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          About
          <textarea
            name="description"
            defaultValue={org.description ?? ""}
            rows={8}
            maxLength={5000}
            placeholder="Tell buyers and partners about your organization"
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Website
          <input
            name="website"
            type="url"
            defaultValue={org.website ?? ""}
            placeholder="https://example.com"
            className={inputCls}
          />
        </label>
        <div className="flex items-center gap-4">
          <button type="submit" className={buttonCls}>
            Save changes
          </button>
          <Link
            href={`/orgs/${org.slug}`}
            className="text-sm underline underline-offset-4"
          >
            View public profile
          </Link>
        </div>
      </form>
    </main>
  );
}
