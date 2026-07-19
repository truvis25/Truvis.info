import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        // Hub-style emerald gradient CTA
        default:
          "bg-gradient-to-r from-emerald-dark to-emerald-deeper text-white shadow-[0_6px_20px_-6px_rgba(16,185,129,0.45)] hover:shadow-[0_10px_28px_-6px_rgba(16,185,129,0.55)] hover:-translate-y-0.5 active:translate-y-0",
        primary:
          "bg-petroleum text-white hover:bg-petroleum-deep shadow-sm",
        outline:
          "border border-border bg-transparent hover:bg-secondary text-foreground",
        ghost: "hover:bg-secondary text-foreground",
        destructive:
          "border border-destructive/30 text-destructive hover:bg-destructive/10",
        link: "text-emerald-dark underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-7 text-[13px] font-bold tracking-[0.14em] uppercase",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
