import type { Metadata } from "next";
import Link from "next/link";
import { signUp } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  if (sent) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight text-petroleum dark:text-foreground">
          Check your email
        </h1>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to your address. Click it to activate
          your account, then sign in.
        </p>
        <Link href="/login" className="text-sm font-medium underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-petroleum dark:text-foreground">
          Create account
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Register to follow organizations, join events, and claim your
          organization&apos;s verified profile.
        </p>
      </div>
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <form action={signUp} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Full name
          <input
            name="display_name"
            type="text"
            required
            autoComplete="name"
            className="rounded-lg border border-border px-3 py-2 text-base font-normal "
          />
        </label>
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
            minLength={8}
            autoComplete="new-password"
            className="rounded-lg border border-border px-3 py-2 text-base font-normal "
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-gradient-to-r from-emerald-dark to-emerald-deeper shadow-[0_6px_20px_-6px_rgba(16,185,129,0.45)] px-6 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5"
        >
          Create account
        </button>
      </form>
      <p className="text-sm text-muted-foreground">
        Already registered?{" "}
        <Link href="/login" className="font-medium underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
