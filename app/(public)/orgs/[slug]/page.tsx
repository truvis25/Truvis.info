import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Globe,
  Mail,
  Phone,
  CalendarDays,
  UserPlus,
  UserCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MEDIA_BASE } from "@/lib/config";
import { toggleFollow } from "@/lib/orgs/actions";
import { VerifiedBadge, Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/ui/rating-stars";
import {
  OrgReviewsSection,
  type OrgRating,
} from "@/components/org-reviews-section";
import type { OrgReview } from "@/components/review-card";
import { Notice } from "@/components/form-field";
import { BrandArt } from "@/components/brand-art";
import type { ContactPerson } from "@/types/domain";

export const dynamic = "force-dynamic";

type ProfileOrg = {
  id: string;
  slug: string;
  legal_name: string;
  tagline: string | null;
  description: string | null;
  website: string | null;
  jurisdiction: string | null;
  trade_license_no: string | null;
  incorporation_year: number | null;
  industry_code: string | null;
  size_band: string | null;
  contact_person: ContactPerson | null;
  logo_url: string | null;
  cover_url: string | null;
  social_links: { linkedin?: string; x?: string; instagram?: string } | null;
};

async function fetchOrg(slug: string): Promise<ProfileOrg | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizations")
    .select(
      "id, slug, legal_name, tagline, description, website, jurisdiction, trade_license_no, incorporation_year, industry_code, size_band, contact_person, logo_url, cover_url, social_links",
    )
    .eq("slug", slug)
    .maybeSingle();
  return (data as ProfileOrg | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const org = await fetchOrg(slug);
  if (!org) return { title: "Organization not found" };
  return {
    title: org.legal_name,
    description: org.tagline ?? `Verified profile of ${org.legal_name} on Truvis.info`,
    openGraph: {
      title: `${org.legal_name} — Verified on Truvis.info`,
      description: org.tagline ?? undefined,
      images: org.logo_url ? [org.logo_url] : undefined,
    },
  };
}

export default async function OrgProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; reviewed?: string; reported?: string }>;
}) {
  const { slug } = await params;
  const { error, reviewed, reported } = await searchParams;
  const org = await fetchOrg(slug);
  if (!org) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const nowIso = new Date().toISOString();

  const [
    { data: catalog },
    { data: posts },
    { data: events },
    { data: followerCount },
    followingRes,
    { data: ratingData },
    { data: reviews },
    membershipRes,
    ownReviewRes,
  ] = await Promise.all([
    supabase
      .from("catalog_items")
      .select(
        "slug, name, item_type, category, price_indication, catalog_media(storage_path, media_type)",
      )
      .eq("org_id", org.id)
      .eq("status", "published")
      .order("sort_order")
      .order("name"),
    supabase
      .from("posts")
      .select("id, title, body, published_at")
      .eq("org_id", org.id)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(6),
    supabase
      .from("events")
      .select("slug, title, starts_at, venue_address")
      .eq("org_id", org.id)
      .eq("status", "published")
      .gte("starts_at", nowIso)
      .order("starts_at")
      .limit(4),
    supabase.rpc("get_follower_count", { p_org_id: org.id }),
    user
      ? supabase
          .from("org_follows")
          .select("org_id")
          .eq("org_id", org.id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.rpc("get_org_rating", { p_org_id: org.id }),
    supabase.rpc("get_org_reviews", { p_org_id: org.id, p_limit: 10 }),
    user
      ? supabase
          .from("org_members")
          .select("org_id")
          .eq("org_id", org.id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("org_reviews")
          .select("rating, comment")
          .eq("org_id", org.id)
          .eq("reviewer_id", user.id)
          .eq("status", "published")
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const isFollowing = Boolean(followingRes.data);
  const rating = (ratingData ?? { avg: null, count: 0, dist: null }) as OrgRating;
  const reviewList = (reviews ?? []) as OrgReview[];
  const viewerIsMember = Boolean(membershipRes.data);
  const viewerReview =
    (ownReviewRes.data as { rating: number; comment: string | null } | null) ??
    null;
  const contact = org.contact_person;
  const socials = org.social_links ?? {};
  const facts: Array<[string, string | number | null]> = [
    ["Jurisdiction", org.jurisdiction],
    ["Trade license", org.trade_license_no],
    ["Founded", org.incorporation_year],
    ["Industry", org.industry_code],
    ["Company size", org.size_band],
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: org.legal_name,
    url: `https://truvis.info/orgs/${org.slug}`,
    logo: org.logo_url ?? undefined,
    description: org.tagline ?? undefined,
    sameAs: [socials.linkedin, socials.x, socials.instagram, org.website].filter(Boolean),
    aggregateRating:
      rating.count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: rating.avg,
            reviewCount: rating.count,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  };

  return (
    <main className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Cover band */}
      <div className="art-on-petroleum relative h-44 bg-gradient-to-r from-petroleum-deep via-petroleum to-[#03427a] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] sm:h-56">
        {org.cover_url ? (
          <>
            <Image src={org.cover_url} alt="" fill className="object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-petroleum-deep/60 to-transparent" aria-hidden />
          </>
        ) : (
          <BrandArt seed={org.slug} variant="card" />
        )}
        <div aria-hidden className="rule-engraved absolute inset-x-0 bottom-0" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 lg:px-12">
        {/* Identity header */}
        <div className="relative -mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            {org.logo_url ? (
              <Image
                src={org.logo_url}
                alt={`${org.legal_name} logo`}
                width={96}
                height={96}
                className="size-24 rounded-xl border-4 border-background bg-card object-contain shadow-lg"
              />
            ) : (
              <span className="flex size-24 items-center justify-center rounded-xl border-4 border-background bg-gradient-to-br from-petroleum to-petroleum-deep font-display text-2xl font-bold text-white shadow-lg">
                {org.legal_name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight text-petroleum sm:text-3xl dark:text-foreground">
                  {org.legal_name}
                </h1>
                <VerifiedBadge long />
              </div>
              {org.tagline ? (
                <p className="mt-1 text-muted-foreground">{org.tagline}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3 pb-1">
            {rating.count > 0 ? (
              <a
                href="#reviews"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <RatingStars value={rating.avg} count={rating.count} size="sm" />
                <span className="font-semibold text-foreground">{rating.avg}</span>
                <span>
                  ({rating.count} review{rating.count === 1 ? "" : "s"})
                </span>
              </a>
            ) : null}
            <span className="text-sm text-muted-foreground">
              {Number(followerCount ?? 0)} follower{Number(followerCount ?? 0) === 1 ? "" : "s"}
            </span>
            <form action={toggleFollow}>
              <input type="hidden" name="org_id" value={org.id} />
              <input type="hidden" name="org_slug" value={org.slug} />
              <input type="hidden" name="following" value={isFollowing ? "1" : "0"} />
              <Button variant={isFollowing ? "outline" : "default"} size="sm" type="submit">
                {isFollowing ? <UserCheck aria-hidden /> : <UserPlus aria-hidden />}
                {isFollowing ? "Following" : "Follow"}
              </Button>
            </form>
          </div>
        </div>

        {/* Zero-JS anchor nav */}
        <nav
          aria-label="Profile sections"
          className="mt-8 flex flex-wrap gap-1 border-b border-border text-sm"
        >
          {(
            [
              org.description ? ["#about", "About"] : null,
              catalog?.length ? ["#catalog", "Products & Services"] : null,
              events?.length ? ["#org-events", "Events"] : null,
              posts?.length ? ["#updates", "Updates"] : null,
              ["#reviews", "Reviews"],
            ] as Array<[string, string] | null>
          )
            .filter((entry): entry is [string, string] => entry !== null)
            .map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="link-engraved rounded-t-md px-3 py-2 text-muted-foreground hover:text-foreground"
              >
                {label}
              </a>
            ))}
        </nav>

        {/* Body */}
        <section className="mt-10 grid gap-10 pb-20 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-10">
            <Notice error={error} saved={reviewed} />
            {reported ? (
              <p
                role="status"
                className="rounded-md border border-emerald-brand/30 bg-emerald-brand/5 px-4 py-3 text-sm text-emerald-deeper dark:text-emerald-brand"
              >
                Report received — our moderation team will take a look.
              </p>
            ) : null}
            {org.description ? (
              <div id="about" className="scroll-mt-24">
                <h2 className="mb-3 font-display text-lg font-bold text-petroleum dark:text-foreground">About</h2>
                <p className="whitespace-pre-line text-sm leading-7 text-foreground/80">
                  {org.description}
                </p>
              </div>
            ) : null}

            {catalog?.length ? (
              <div id="catalog" className="scroll-mt-24">
                <h2 className="mb-4 font-display text-lg font-bold text-petroleum dark:text-foreground">
                  Products &amp; Services
                </h2>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {catalog.map((item) => {
                    const media = (item.catalog_media ?? []).find(
                      (m: { storage_path: string | null; media_type: string }) =>
                        m.media_type === "image" && m.storage_path,
                    );
                    return (
                      <li key={item.slug}>
                        <Link href={`/orgs/${org.slug}/catalog/${item.slug}`} className="group block h-full">
                          <Card className="h-full overflow-hidden transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                            <div className="relative aspect-[4/3] bg-gradient-to-br from-secondary to-secondary/40">
                              {media ? (
                                <Image
                                  src={`${MEDIA_BASE}${media.storage_path}`}
                                  alt=""
                                  fill
                                  sizes="(min-width: 640px) 320px, 100vw"
                                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                />
                              ) : (
                                <span className="absolute inset-0 flex items-center justify-center font-display text-3xl font-bold text-border">
                                  {item.name.slice(0, 1).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <CardContent className="p-5">
                              <p className="font-semibold text-petroleum group-hover:text-emerald-deeper dark:text-foreground">
                                {item.name}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {[item.item_type, item.category, item.price_indication].filter(Boolean).join(" · ")}
                              </p>
                            </CardContent>
                          </Card>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            {events?.length ? (
              <div id="org-events" className="scroll-mt-24">
                <h2 className="mb-4 font-display text-lg font-bold text-petroleum dark:text-foreground">
                  Upcoming Events
                </h2>
                <ul className="flex flex-col gap-3">
                  {events.map((event) => (
                    <li key={event.slug}>
                      <Link
                        href={`/events/${event.slug}`}
                        className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-petroleum text-emerald-brand">
                          <CalendarDays className="size-5" aria-hidden />
                        </span>
                        <span>
                          <span className="block font-semibold">{event.title}</span>
                          <span className="block text-xs text-muted-foreground">
                            {new Date(event.starts_at).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })}
                            {event.venue_address ? ` · ${event.venue_address}` : ""}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {posts?.length ? (
              <div id="updates" className="scroll-mt-24">
                <h2 className="mb-4 font-display text-lg font-bold text-petroleum dark:text-foreground">
                  Latest Updates
                </h2>
                <ul className="flex flex-col gap-4">
                  {posts.map((post) => (
                    <li key={post.id}>
                      <Card>
                        <CardContent className="p-5">
                          <p className="font-semibold">{post.title}</p>
                          {post.published_at ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {new Date(post.published_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}
                            </p>
                          ) : null}
                          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground/80">
                            {(post.body as { text?: string })?.text ?? ""}
                          </p>
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <OrgReviewsSection
              org={{ id: org.id, slug: org.slug, legal_name: org.legal_name }}
              rating={rating}
              reviews={reviewList}
              viewerId={user?.id ?? null}
              viewerIsMember={viewerIsMember}
              viewerReview={viewerReview}
            />
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
            {contact ? (
              <Card>
                <CardContent className="p-6">
                  <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-petroleum dark:text-foreground">
                    Contact Person
                  </h2>
                  <p className="font-semibold">{contact.name}</p>
                  <p className="text-sm text-muted-foreground">{contact.title}</p>
                  <div className="mt-4 flex flex-col gap-2 text-sm">
                    <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 text-emerald-deeper hover:underline dark:text-emerald-brand">
                      <Mail className="size-4" aria-hidden />
                      {contact.email}
                    </a>
                    <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-2 text-emerald-deeper hover:underline dark:text-emerald-brand">
                      <Phone className="size-4" aria-hidden />
                      {contact.phone}
                    </a>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <Card className="relative overflow-hidden outline outline-1 outline-offset-4 outline-border/50">
              <BrandArt
                seed={org.slug}
                variant="medallion"
                className="scale-[2.5] opacity-[0.04]"
              />
              <CardContent className="relative p-6">
                <h2 className="font-display text-sm font-bold uppercase tracking-wide text-petroleum dark:text-foreground">
                  Certificate of Standing
                </h2>
                <div aria-hidden className="rule-engraved mb-4 mt-2" />
                <dl className="flex flex-col gap-3 text-sm">
                  {facts
                    .filter(([, v]) => v != null && v !== "")
                    .map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="font-medium">{value}</dd>
                      </div>
                    ))}
                </dl>
                <div className="mt-4 flex items-center gap-2">
                  <VerifiedBadge />
                  <span className="text-xs text-muted-foreground">
                    In good standing · monitored continuously
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  Sourced from verified records on the Truvis compliance
                  platform.
                </p>
              </CardContent>
            </Card>

            {(org.website || socials.linkedin || socials.x || socials.instagram) ? (
              <Card>
                <CardContent className="flex flex-wrap items-center gap-3 p-6">
                  {org.website ? (
                    <Button asChild variant="outline" size="sm">
                      <a href={org.website} target="_blank" rel="noopener noreferrer nofollow">
                        <Globe aria-hidden /> Website
                      </a>
                    </Button>
                  ) : null}
                  {socials.linkedin ? (
                    <Button asChild variant="outline" size="sm">
                      <a href={socials.linkedin} target="_blank" rel="noopener noreferrer nofollow">LinkedIn</a>
                    </Button>
                  ) : null}
                  {socials.x ? (
                    <Button asChild variant="outline" size="sm">
                      <a href={socials.x} target="_blank" rel="noopener noreferrer nofollow">X</a>
                    </Button>
                  ) : null}
                  {socials.instagram ? (
                    <Button asChild variant="outline" size="sm">
                      <a href={socials.instagram} target="_blank" rel="noopener noreferrer nofollow">Instagram</a>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <Badge variant="outline" className="self-start">
              Profile hidden automatically if compliance standing lapses
            </Badge>
          </aside>
        </section>
      </div>
    </main>
  );
}
