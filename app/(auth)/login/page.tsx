import type { Metadata } from "next";
import Link from "next/link";
import { signIn } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-petroleum dark:text-foreground">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Access your organization dashboard.
        </p>
      </div>
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <form action={signIn} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next ?? ""} />
        <label className="flex flex-col gap-1 text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-lg border border-border px-3 py-2 text-base font-normal "
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-lg border border-border px-3 py-2 text-base font-normal "
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-gradient-to-r from-emerald-dark to-emerald-deeper shadow-[0_6px_20px_-6px_rgba(16,185,129,0.45)] px-6 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5"
        >
          Sign in
        </button>
      </form>
      <p className="text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/signup" className="font-medium underline underline-offset-4">
          Create one
        </Link>
      </p>
    </div>
  );
}
