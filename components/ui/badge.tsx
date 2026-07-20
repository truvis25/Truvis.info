import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-petroleum text-white",
        verified:
          "bg-emerald-brand/10 text-emerald-deeper dark:bg-emerald-brand/15 dark:text-emerald-brand ring-1 ring-emerald-brand/25",
        success:
          "bg-emerald-brand/10 text-emerald-deeper dark:text-emerald-brand",
        warning:
          "bg-amber-500/10 text-amber-700 dark:text-amber-400",
        danger: "bg-destructive/10 text-destructive",
        outline: "border border-border text-muted-foreground",
        accent: "bg-gradient-to-r from-emerald-dark to-emerald-deeper text-white",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

// The platform's trust mark (replaces bare ✓ glyphs; accessible label included).
function VerifiedBadge({ className, long = false }: { className?: string; long?: boolean }) {
  return (
    <Badge
      variant="verified"
      className={cn(
        "transition-transform duration-150 hover:scale-[1.06] hover:drop-shadow-[0_0_6px_rgba(16,185,129,0.35)] active:scale-95",
        className,
      )}
    >
      <ShieldCheck aria-hidden />
      <span>{long ? "Verified via Truvis Compliance" : "Verified"}</span>
    </Badge>
  );
}

export { Badge, VerifiedBadge, badgeVariants };
