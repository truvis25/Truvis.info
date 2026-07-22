"use client";

import Link from "next/link";
import { buttonCls } from "@/components/form-field";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start gap-4 px-6 py-24">
      <h1 className="font-display text-2xl font-bold tracking-tight text-petroleum dark:text-foreground">
        Admin console failed to load
      </h1>
      <p className="text-sm text-muted-foreground">
        A query behind the admin dashboard errored. Try again — if this
        persists, check the compliance sync and database health.
      </p>
      <div className="flex items-center gap-3">
        <button type="button" onClick={reset} className={buttonCls}>
          Try again
        </button>
        <Link href="/dashboard" className="text-sm underline underline-offset-4">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
