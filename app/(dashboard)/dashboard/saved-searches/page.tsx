import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookmarkPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deleteSavedSearch, toggleSearchAlerts } from "@/lib/search/actions";
import { searchToHref, type SearchKind, type SearchParams } from "@/lib/search/saved";
import { buttonGhostCls } from "@/components/form-field";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Saved searches" };

type Row = {
  id: string;
  kind: SearchKind;
  label: string;
  params: SearchParams;
  alerts_enabled: boolean;
  created_at: string;
};

export default async function SavedSearchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/saved-searches");

  const { data: searches } = await supabase
    .from("saved_searches")
    .select("id, kind, label, params, alerts_enabled, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (searches ?? []) as Row[];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <Link href="/dashboard" className="text-sm text-muted-foreground underline underline-offset-4">
          ← Dashboard
        </Link>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-petroleum dark:text-foreground">
          Saved searches
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We check your saved searches daily and email you when new matches
          appear. Toggle alerts off to keep a search without notifications.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border py-20 text-center">
          <BookmarkPlus className="size-10 text-muted-foreground/50" aria-hidden />
          <p className="font-medium">No saved searches yet.</p>
          <p className="text-sm text-muted-foreground">
            Run a search on the{" "}
            <Link href="/directory" className="underline underline-offset-4">directory</Link>{" "}
            or{" "}
            <Link href="/marketplace" className="underline underline-offset-4">marketplace</Link>{" "}
            and choose “Save this search”.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-5 py-4"
            >
              <div className="min-w-0">
                <Link
                  href={searchToHref(row.kind, row.params)}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {row.label}
                </Link>
                <p className="text-xs text-muted-foreground">
                  Saved {formatDate(row.created_at)} ·{" "}
                  {row.alerts_enabled ? "alerts on" : "alerts off"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <form action={toggleSearchAlerts}>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="enabled" value={row.alerts_enabled ? "0" : "1"} />
                  <button className={buttonGhostCls}>
                    {row.alerts_enabled ? "Mute alerts" : "Enable alerts"}
                  </button>
                </form>
                <form action={deleteSavedSearch}>
                  <input type="hidden" name="id" value={row.id} />
                  <ConfirmSubmitButton
                    confirmMessage={`Delete the saved search "${row.label}"?`}
                    className={`${buttonGhostCls} text-destructive`}
                  >
                    Delete
                  </ConfirmSubmitButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
