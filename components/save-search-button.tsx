import { BookmarkPlus, Check } from "lucide-react";
import { saveSearch } from "@/lib/search/actions";
import { buttonGhostCls } from "@/components/form-field";
import type { SearchKind, SearchParams } from "@/lib/search/saved";

// "Save this search" — posts the active filters to saveSearch so the daily
// digest can alert on new matches. Rendered only for signed-in users with an
// active search. `saved` shows the just-saved confirmation.
export function SaveSearchButton({
  kind,
  params,
  saved,
}: {
  kind: SearchKind;
  params: SearchParams;
  saved?: boolean;
}) {
  if (saved) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-deeper dark:text-emerald-brand">
        <Check className="size-4" aria-hidden /> Saved — we&apos;ll alert you to new matches
      </span>
    );
  }
  return (
    <form action={saveSearch}>
      <input type="hidden" name="kind" value={kind} />
      {Object.entries(params).map(([k, v]) =>
        v ? <input key={k} type="hidden" name={k} value={v} /> : null,
      )}
      <button className={`${buttonGhostCls} text-sm`}>
        <BookmarkPlus className="size-4" aria-hidden /> Save this search
      </button>
    </form>
  );
}
