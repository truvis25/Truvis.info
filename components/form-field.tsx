// Shared minimal form styling for dashboard forms.
export const inputCls =
  "rounded-lg border border-black/15 px-3 py-2 text-sm font-normal dark:border-white/20 dark:bg-transparent";
export const buttonCls =
  "rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-85";
export const buttonGhostCls =
  "rounded-full border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10";

export function Notice({
  error,
  saved,
}: {
  error?: string;
  saved?: string;
}) {
  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
        {error}
      </p>
    );
  }
  if (saved) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
        Saved.
      </p>
    );
  }
  return null;
}
