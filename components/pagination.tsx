import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Link-based pager for server-rendered lists. Preserves the current filters
// via `params`; page 1 drops the page param to keep canonical URLs clean.
export function Pagination({
  page,
  pageCount,
  basePath,
  params = {},
}: {
  page: number;
  pageCount: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) return null;

  const href = (p: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
    if (p > 1) search.set("page", String(p));
    const qs = search.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const linkCls =
    "inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary";
  const disabledCls =
    "inline-flex items-center gap-1 rounded-md border border-border/50 px-3 py-1.5 text-sm font-medium text-muted-foreground/50";

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-4">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={linkCls}>
          <ChevronLeft className="size-4" aria-hidden /> Previous
        </Link>
      ) : (
        <span aria-hidden className={disabledCls}>
          <ChevronLeft className="size-4" /> Previous
        </span>
      )}
      <span className="text-sm tabular-nums text-muted-foreground">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={href(page + 1)} rel="next" className={linkCls}>
          Next <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span aria-hidden className={disabledCls}>
          Next <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}

// Shared helpers for paged lists.
export function parsePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function pageCountFor(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
