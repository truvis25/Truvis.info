import Image from "next/image";
import { Flag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RatingStars } from "@/components/ui/rating-stars";
import { deleteMyReview, reportReview } from "@/lib/reviews/actions";
import { formatDate } from "@/lib/format";
import { inputCls, buttonGhostCls } from "@/components/form-field";

export type OrgReview = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
};

// A single community review. The author can delete their own review; other
// signed-in users get a disclosure with a report form (same moderation queue
// as post reports).
export function ReviewCard({
  review,
  orgSlug,
  viewerId,
}: {
  review: OrgReview;
  orgSlug: string;
  viewerId: string | null;
}) {
  const isAuthor = viewerId === review.reviewer_id;
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        {review.reviewer_avatar ? (
          <Image
            src={review.reviewer_avatar}
            alt=""
            width={36}
            height={36}
            className="size-9 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-petroleum to-petroleum-deep text-xs font-bold text-white">
            {review.reviewer_name
              .split(/\s+/)
              .slice(0, 2)
              .map((word) => word[0]?.toUpperCase() ?? "")
              .join("")}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{review.reviewer_name}</p>
          <div className="flex items-center gap-2">
            <RatingStars value={review.rating} size="sm" />
            <span className="text-xs text-muted-foreground">
              {formatDate(review.created_at)}
            </span>
          </div>
        </div>
      </div>
      {review.comment ? (
        <p className="mt-3 whitespace-pre-line text-sm leading-6">
          {review.comment}
        </p>
      ) : null}
      {isAuthor ? (
        <form action={deleteMyReview} className="mt-3">
          <input type="hidden" name="review_id" value={review.id} />
          <input type="hidden" name="org_slug" value={orgSlug} />
          <button className={`${buttonGhostCls} text-destructive`}>
            Delete my review
          </button>
        </form>
      ) : viewerId ? (
        <details className="mt-3">
          <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-xs text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
            <Flag aria-hidden className="size-3" />
            Report
          </summary>
          <form
            action={reportReview}
            className="mt-2 flex flex-wrap items-center gap-2"
          >
            <input type="hidden" name="review_id" value={review.id} />
            <input type="hidden" name="org_slug" value={orgSlug} />
            <input
              name="reason"
              required
              placeholder="Why is this review inappropriate?"
              className={`${inputCls} w-64`}
            />
            <button className={buttonGhostCls}>Submit report</button>
          </form>
        </details>
      ) : null}
    </Card>
  );
}
