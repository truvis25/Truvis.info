import type { Metadata } from "next";
import Link from "next/link";
import { signUp } from "@/lib/auth/actions";
import { Notice, inputCls, buttonCls } from "@/components/form-field";

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
      <Notice error={error} />
      <form action={signUp} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Full name
          <input
            name="display_name"
            type="text"
            required
            autoComplete="name"
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputCls}
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
            className={inputCls}
          />
        </label>
        <button type="submit" className={buttonCls}>
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
