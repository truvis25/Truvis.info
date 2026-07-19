import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getManagedOrg } from "@/lib/orgs/queries";
import {
  createCatalogItem,
  setCatalogItemStatus,
  deleteCatalogItem,
  uploadCatalogImage,
} from "@/lib/catalog/actions";
import {
  Notice,
  inputCls,
  buttonCls,
  buttonGhostCls,
} from "@/components/form-field";

export const metadata: Metadata = { title: "Catalog" };

type Item = {
  id: string;
  slug: string;
  name: string;
  item_type: string;
  category: string | null;
  status: string;
};

export default async function CatalogAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/catalog");
  const org = await getManagedOrg(supabase, user.id);
  if (!org) redirect("/dashboard");

  const { data: items } = await supabase
    .from("catalog_items")
    .select("id, slug, name, item_type, category, status")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <Link href="/dashboard" className="text-sm text-gray-500 underline underline-offset-4 dark:text-gray-400">
          ← Dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Products &amp; services
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Published items appear on your public profile while your organization
          is visible.
        </p>
      </div>

      <Notice error={error} saved={saved} />

      <section className="rounded-2xl border border-black/10 p-6 dark:border-white/15">
        <h2 className="mb-4 font-semibold">Add an item</h2>
        <form action={createCatalogItem} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Name
              <input name="name" required maxLength={120} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Type
              <select name="item_type" className={inputCls} defaultValue="service">
                <option value="service">Service</option>
                <option value="product">Product</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Category
              <input name="category" maxLength={80} placeholder="e.g. Freight forwarding" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Price indication (optional)
              <input name="price_indication" maxLength={80} placeholder="e.g. From AED 1,500" className={inputCls} />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Description
            <textarea name="description" rows={4} maxLength={5000} className={inputCls} />
          </label>
          <button type="submit" className={`${buttonCls} self-start`}>
            Add item (draft)
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Items ({items?.length ?? 0})</h2>
        {(items as Item[] | null)?.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 px-5 py-4 dark:border-white/15"
          >
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.item_type}
                {item.category ? ` · ${item.category}` : ""} ·{" "}
                <span className={item.status === "published" ? "text-emerald-600" : ""}>
                  {item.status}
                </span>
              </p>
            </div>
            <form action={uploadCatalogImage} className="flex items-center gap-2">
              <input type="hidden" name="item_id" value={item.id} />
              <label className="sr-only" htmlFor={`img-${item.id}`}>Add image to {item.name}</label>
              <input
                id={`img-${item.id}`}
                type="file"
                name="file"
                accept="image/*"
                required
                className="w-44 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-xs"
              />
              <button className={buttonGhostCls}>Add image</button>
            </form>
            <div className="flex items-center gap-2">
              <form action={setCatalogItemStatus}>
                <input type="hidden" name="id" value={item.id} />
                <input
                  type="hidden"
                  name="status"
                  value={item.status === "published" ? "draft" : "published"}
                />
                <button className={buttonGhostCls}>
                  {item.status === "published" ? "Unpublish" : "Publish"}
                </button>
              </form>
              <form
                action={deleteCatalogItem}
              >
                <input type="hidden" name="id" value={item.id} />
                <button className={`${buttonGhostCls} text-red-600 dark:text-red-400`}>
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
        {!items?.length ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No items yet — add your first product or service above.
          </p>
        ) : null}
      </section>
    </main>
  );
}
