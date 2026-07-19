import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CatalogDetail = {
  id: string;
  name: string;
  item_type: string;
  category: string | null;
  description: string | null;
  price_indication: string | null;
  catalog_media: Array<{ id: string; storage_path: string | null; media_type: string }>;
  organizations: {
    slug: string;
    legal_name: string;
    contact_person: { email?: string } | null;
  };
};

const MEDIA_BASE =
  "https://hyzotwxtqssefsgryawl.supabase.co/storage/v1/object/public/public-media/";

async function fetchItem(
  slug: string,
  itemSlug: string,
): Promise<CatalogDetail | null> {
  const supabase = await createClient();
  // RLS hides items of hidden orgs and unpublished items from the public.
  const { data } = await supabase
    .from("catalog_items")
    .select(
      "id, name, item_type, category, description, price_indication, catalog_media(id, storage_path, media_type), organizations!inner(slug, legal_name, contact_person)",
    )
    .eq("slug", itemSlug)
    .eq("status", "published")
    .eq("organizations.slug", slug)
    .maybeSingle();
  return (data as unknown as CatalogDetail | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; itemSlug: string }>;
}): Promise<Metadata> {
  const { slug, itemSlug } = await params;
  const item = await fetchItem(slug, itemSlug);
  if (!item) return { title: "Not found" };
  return {
    title: `${item.name} — ${item.organizations.legal_name}`,
    description: item.description?.slice(0, 160),
  };
}

export default async function CatalogItemPage({
  params,
}: {
  params: Promise<{ slug: string; itemSlug: string }>;
}) {
  const { slug, itemSlug } = await params;
  const item = await fetchItem(slug, itemSlug);
  if (!item) notFound();

  const contactEmail = item.organizations.contact_person?.email;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <Link
        href={`/orgs/${slug}`}
        className="text-sm text-gray-500 underline underline-offset-4 dark:text-gray-400"
      >
        ← {item.organizations.legal_name}
      </Link>

      <header className="mt-6 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{item.name}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {[item.item_type, item.category, item.price_indication]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </header>

      {item.catalog_media?.filter((m) => m.media_type === "image" && m.storage_path).length ? (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {item.catalog_media
            .filter((m) => m.media_type === "image" && m.storage_path)
            .map((media) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={media.id}
                src={`${MEDIA_BASE}${media.storage_path}`}
                alt={`${item.name} image`}
                className="aspect-[4/3] w-full rounded-xl border border-border object-cover"
                loading="lazy"
              />
            ))}
        </div>
      ) : null}

      {item.description ? (
        <p className="mt-8 whitespace-pre-line text-sm leading-6 text-gray-700 dark:text-gray-300">
          {item.description}
        </p>
      ) : null}

      {contactEmail ? (
        <a
          href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Inquiry: ${item.name}`)}`}
          className="mt-10 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-85"
        >
          Contact this organization
        </a>
      ) : null}
    </main>
  );
}
