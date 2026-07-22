import { Badge } from "@/components/ui/badge";

// One visual language for lifecycle statuses across dashboard and admin
// (listings, posts, events, catalog, registrations, applications).
const STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "danger" | "outline"
> = {
  published: "success",
  active: "success",
  approved: "success",
  visible: "success",
  pending: "warning",
  paused: "warning",
  waitlist: "warning",
  hidden: "warning",
  rejected: "danger",
  cancelled: "danger",
  suspended: "danger",
  draft: "outline",
  closed: "outline",
  completed: "outline",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <Badge
      variant={STATUS_VARIANT[status] ?? "outline"}
      className={`capitalize ${className ?? ""}`}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
