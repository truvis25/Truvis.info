import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// The platform's accent-bar section heading (emerald bar + display face),
// previously copy-pasted across org profile, reviews, and marketplace detail.
const SIZES = {
  lg: { text: "text-lg font-bold", bar: "h-5" },
  md: { text: "font-semibold", bar: "h-4" },
  sm: { text: "text-sm font-bold uppercase tracking-[0.16em]", bar: "h-3.5" },
} as const;

export function SectionHeading({
  as: Tag = "h2",
  size = "lg",
  className,
  children,
}: {
  as?: "h2" | "h3";
  size?: keyof typeof SIZES;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={cn(
        "flex items-center gap-2.5 font-display text-petroleum dark:text-foreground",
        SIZES[size].text,
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("w-1 shrink-0 rounded-full bg-emerald-brand", SIZES[size].bar)}
      />
      {children}
    </Tag>
  );
}
