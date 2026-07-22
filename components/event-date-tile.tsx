import { BrandArt } from "@/components/brand-art";
import { dateTileParts } from "@/lib/format";
import { cn } from "@/lib/utils";

// The engraved petroleum date medallion used on event cards and rails.
export function EventDateTile({
  date,
  seed,
  size = "md",
  className,
}: {
  date: string | Date;
  seed: string;
  size?: "md" | "sm";
  className?: string;
}) {
  const { day, month } = dateTileParts(date);
  return (
    <div
      className={cn(
        "art-on-petroleum relative flex shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-petroleum to-petroleum-deep text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]",
        size === "md" ? "size-16" : "size-10 rounded-lg",
        className,
      )}
    >
      <BrandArt
        seed={seed}
        variant="medallion"
        className="[mask-image:radial-gradient(closest-side,black,transparent)]"
      />
      <span
        className={cn(
          "relative z-10 font-display font-extrabold leading-none",
          size === "md" ? "text-xl" : "text-sm",
        )}
      >
        {day}
      </span>
      <span
        className={cn(
          "relative z-10 font-semibold uppercase tracking-wide text-emerald-brand",
          size === "md" ? "text-[10px]" : "text-[8px]",
        )}
      >
        {month}
      </span>
    </div>
  );
}
