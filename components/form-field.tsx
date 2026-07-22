// Shared styling for dashboard forms — token-based (TruVis design system).
export const inputCls =
  "rounded-md border border-border bg-input px-3 py-2 text-sm font-normal placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-emerald-brand focus-visible:ring-2 focus-visible:ring-emerald-brand/25";
export const buttonCls =
  "inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-emerald-dark to-emerald-deeper px-5 py-2 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(16,185,129,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-6px_rgba(16,185,129,0.55)] active:translate-y-0 cursor-pointer";
export const buttonGhostCls =
  "inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-secondary cursor-pointer";

export function Notice({
  error,
  saved,
  savedMessage,
}: {
  error?: string;
  saved?: string;
  savedMessage?: string;
}) {
  if (error) {
    return (
      <p
        role="alert"
        className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
      >
        {error}
      </p>
    );
  }
  if (saved) {
    return (
      <p
        role="status"
        className="rounded-md border border-emerald-brand/30 bg-emerald-brand/5 px-4 py-3 text-sm text-emerald-deeper dark:text-emerald-brand"
      >
        {savedMessage ?? "Saved."}
      </p>
    );
  }
  return null;
}
