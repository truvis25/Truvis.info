import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getManagedOrg } from "@/lib/orgs/queries";
import { updateOrgProfile, uploadOrgImage } from "@/lib/orgs/actions";
import { Notice, inputCls, buttonCls, buttonGhostCls } from "@/components/form-field";

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
        <Link href="/dashboard" className="text-sm text-muted-foreground underline underline-offset-4">
          ← Dashboard
        </Link>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-petroleum dark:text-foreground">
          Edit public profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {org.legal_name} — marketing content. Verified company facts are
          managed on compliance.truvis.tech and cannot be edited here.
        </p>
      </div>

      <Notice error={error} saved={saved} />

      {/* Branding uploads (DIR-3) */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-1 font-display font-semibold">Branding</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Logo appears on your directory card and profile; the cover sits
          behind your profile header. PNG/JPG/WebP, max 5MB.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <form action={uploadOrgImage} className="flex flex-1 items-end gap-3">
            <input type="hidden" name="kind" value="logo" />
            <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
              Logo
              <input type="file" name="file" accept="image/*" required className={inputCls} />
            </label>
            <button type="submit" className={buttonGhostCls}>Upload</button>
          </form>
          <form action={uploadOrgImage} className="flex flex-1 items-end gap-3">
            <input type="hidden" name="kind" value="cover" />
            <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
              Cover image
              <input type="file" name="file" accept="image/*" required className={inputCls} />
            </label>
            <button type="submit" className={buttonGhostCls}>Upload</button>
          </form>
        </div>
      </section>

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
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            LinkedIn
            <input name="linkedin" type="url" defaultValue={org.social_links?.linkedin ?? ""} placeholder="https://linkedin.com/company/…" className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            X
            <input name="x" type="url" defaultValue={org.social_links?.x ?? ""} placeholder="https://x.com/…" className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Instagram
            <input name="instagram" type="url" defaultValue={org.social_links?.instagram ?? ""} placeholder="https://instagram.com/…" className={inputCls} />
          </label>
        </div>
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
