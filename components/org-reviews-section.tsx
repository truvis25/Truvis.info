import Link from "next/link";
import { RatingInput, RatingStars } from "@/components/ui/rating-stars";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewCard, type OrgReview } from "@/components/review-card";
import { submitReview } from "@/lib/reviews/actions";
import { inputCls, buttonCls } from "@/components/form-field";

export type OrgRating = {
  avg: number | null;
  count: number;
  dist: Record<string, number> | null;
};

// Community reviews block on the public org profile: aggregate summary with
// a per-star distribution, the review list, and the write/update form for
// eligible viewers (signed in, not a member of the org).
export function OrgReviewsSection({
  org,
  rating,
  reviews,
  viewerId,
  viewerIsMember,
  viewerReview,
}: {
  org: { id: string; slug: string; legal_name: string };
  rating: OrgRating;
  reviews: OrgReview[];
  viewerId: string | null;
  viewerIsMember: boolean;
  viewerReview: { rating: number; comment: string | null } | null;
}) {
  const count = rating.count ?? 0;
  const dist = rating.dist ?? {};
  const maxBucket = Math.max(1, ...Object.values(dist));

  return (
    <div id="reviews" className="scroll-mt-24">
      <h2 className="mb-4 flex items-center gap-2.5 font-display text-lg font-bold text-petroleum dark:text-foreground">
        <span aria-hidden className="h-5 w-1 shrink-0 rounded-full bg-emerald-brand" />
        Community Reviews
      </h2>

      {count > 0 ? (
        <Card className="mb-5">
          <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
            <div className="flex flex-col items-start gap-1 sm:items-center">
              <p className="font-display text-5xl font-extrabold text-petroleum dark:text-foreground">
                {rating.avg}
              </p>
              <RatingStars value={rating.avg} count={count} size="lg" />
              <p className="text-xs text-muted-foreground">
                {count} review{count === 1 ? "" : "s"}
              </p>
            </div>
            <dl className="flex flex-1 flex-col-reverse gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const bucket = dist[String(star)] ?? 0;
                return (
                  <div key={star} className="flex items-center gap-3 text-xs">
                    <dt className="w-6 shrink-0 text-muted-foreground">
                      {star}★
                    </dt>
                    <dd className="flex-1">
                      <span className="block h-1.5 rounded-full bg-secondary">
                        <span
                          className="block h-1.5 rounded-full bg-amber-500"
                          style={{ width: `${(bucket / maxBucket) * 100}%` }}
                        />
                      </span>
                    </dd>
                    <dd className="w-6 shrink-0 text-right text-muted-foreground">
                      {bucket}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </CardContent>
        </Card>
      ) : (
        <p className="mb-5 text-sm text-muted-foreground">
          No reviews yet — be the first to share your experience with{" "}
          {org.legal_name}.
        </p>
      )}

      {reviews.length ? (
        <ul className="flex flex-col gap-4">
          {reviews.map((review) => (
            <li key={review.id}>
              <ReviewCard review={review} orgSlug={org.slug} viewerId={viewerId} />
            </li>
          ))}
        </ul>
      ) : null}

      {viewerId && !viewerIsMember ? (
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.16em] text-petroleum dark:text-foreground">
              <span aria-hidden className="h-3.5 w-1 shrink-0 rounded-full bg-emerald-brand" />
              {viewerReview ? "Update your review" : "Write a review"}
            </h3>
            <form action={submitReview} className="mt-4 flex flex-col gap-4">
              <input type="hidden" name="org_id" value={org.id} />
              <input type="hidden" name="org_slug" value={org.slug} />
              <RatingInput defaultValue={viewerReview?.rating} />
              <textarea
                name="comment"
                rows={4}
                maxLength={2000}
                placeholder="Share your experience working with this organization (optional)"
                defaultValue={viewerReview?.comment ?? ""}
                className={`${inputCls} resize-y`}
              />
              <button className={`${buttonCls} self-start`}>
                {viewerReview ? "Update review" : "Publish review"}
              </button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {!viewerId ? (
        <p className="mt-6 text-sm text-muted-foreground">
          <Link
            href={`/login?next=${encodeURIComponent(`/orgs/${org.slug}`)}`}
            className="font-semibold text-emerald-deeper hover:underline dark:text-emerald-brand"
          >
            Sign in
          </Link>{" "}
          to leave a review.
        </p>
      ) : null}
    </div>
  );
}
