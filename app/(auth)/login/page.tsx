import type { Metadata } from "next";
import Link from "next/link";
import { signIn } from "@/lib/auth/actions";
import { Notice, inputCls, buttonCls } from "@/components/form-field";

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
      <Notice error={error} />
      <form action={signIn} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next ?? ""} />
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
            autoComplete="current-password"
            className={inputCls}
          />
        </label>
        <button type="submit" className={buttonCls}>
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
