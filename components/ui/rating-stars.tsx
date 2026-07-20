import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZE_CLS = {
  sm: "[&_svg]:size-3.5",
  md: "[&_svg]:size-4",
  lg: "[&_svg]:size-5",
} as const;

function StarRow({ filled }: { filled?: boolean }) {
  return (
    <>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden
          className={cn("shrink-0", filled && "fill-current")}
        />
      ))}
    </>
  );
}

// Display-only star rating with exact fractional fill (no JS): a clipped
// amber overlay of filled stars sits on top of a muted outline row.
function RatingStars({
  value,
  count,
  size = "sm",
  className,
}: {
  value: number | null | undefined;
  count?: number;
  size?: keyof typeof SIZE_CLS;
  className?: string;
}) {
  const label =
    value == null
      ? "Not yet rated"
      : `Rated ${value} out of 5${
          count ? ` from ${count} review${count === 1 ? "" : "s"}` : ""
        }`;
  return (
    <span
      role="img"
      aria-label={label}
      className={cn("relative inline-flex shrink-0", SIZE_CLS[size], className)}
    >
      <span className="flex gap-0.5 text-border">
        <StarRow />
      </span>
      {value != null ? (
        <span
          className="absolute inset-y-0 left-0 flex gap-0.5 overflow-hidden text-amber-500"
          style={{ width: `${(Math.min(Math.max(value, 0), 5) / 5) * 100}%` }}
        >
          <StarRow filled />
        </span>
      ) : null}
    </span>
  );
}

// Keyboard-native, zero-JS star input: radios in reverse DOM order so the
// sibling combinator can light "this star and every one before it" for both
// :checked and :hover, while flex-row-reverse restores left-to-right order.
function RatingInput({
  name = "rating",
  defaultValue,
  required = true,
}: {
  name?: string;
  defaultValue?: number | null;
  required?: boolean;
}) {
  return (
    <fieldset
      className={cn(
        "flex flex-row-reverse justify-end gap-0 border-0 p-0",
        "[&>input:checked~label]:text-amber-500 [&>input:checked~label_svg]:fill-current",
        "[&>label:hover]:text-amber-400 [&>label:hover_svg]:fill-current",
        "[&>label:hover~label]:text-amber-400 [&>label:hover~label_svg]:fill-current",
        "[&>input:focus-visible+label]:rounded [&>input:focus-visible+label]:ring-2 [&>input:focus-visible+label]:ring-ring",
      )}
    >
      <legend className="sr-only">Rating</legend>
      {[5, 4, 3, 2, 1].map((star) => (
        <React.Fragment key={star}>
          <input
            type="radio"
            id={`${name}-${star}`}
            name={name}
            value={star}
            required={required && star === 1}
            defaultChecked={defaultValue === star}
            className="sr-only"
          />
          <label
            htmlFor={`${name}-${star}`}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            className="cursor-pointer p-0.5 text-border transition-colors"
          >
            <Star aria-hidden className="size-6" />
          </label>
        </React.Fragment>
      ))}
    </fieldset>
  );
}

export { RatingStars, RatingInput };
