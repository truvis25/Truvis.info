import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getManagedOrg } from "@/lib/orgs/queries";
import { updateCatalogItem } from "@/lib/catalog/actions";
import { Notice, inputCls, buttonCls } from "@/components/form-field";

export const metadata: Metadata = { title: "Edit catalog item" };

export default async function EditCatalogItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/catalog/${id}`);
  const org = await getManagedOrg(supabase, user.id);
  if (!org || !org.canManageContent) redirect("/dashboard");

  const { data: item } = await supabase
    .from("catalog_items")
    .select("id, name, item_type, category, description, price_indication, status")
    .eq("id", id)
    .eq("org_id", org.id)
    .maybeSingle();
  if (!item) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <Link href="/dashboard/catalog" className="text-sm text-muted-foreground underline underline-offset-4">
          ← Catalog
        </Link>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-petroleum dark:text-foreground">
          Edit item
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Status: {item.status}. Changes to a published item are visible on
          your public profile immediately.
        </p>
      </div>

      <Notice error={error} saved={saved} />

      <form action={updateCatalogItem} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
        <input type="hidden" name="id" value={item.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Name
            <input name="name" required maxLength={120} defaultValue={item.name} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Type
            <select name="item_type" defaultValue={item.item_type} className={inputCls}>
              <option value="service">Service</option>
              <option value="product">Product</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Category
            <input name="category" maxLength={80} defaultValue={item.category ?? ""} placeholder="e.g. Freight forwarding" className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Price indication (optional)
            <input name="price_indication" maxLength={80} defaultValue={item.price_indication ?? ""} placeholder="e.g. From AED 1,500" className={inputCls} />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Description
          <textarea name="description" rows={6} maxLength={5000} defaultValue={item.description ?? ""} className={inputCls} />
        </label>
        <button type="submit" className={`${buttonCls} self-start`}>Save changes</button>
      </form>
    </main>
  );
}
