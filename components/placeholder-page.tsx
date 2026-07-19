import Link from "next/link";

// Temporary stand-in for routes scheduled in docs/DEVELOPMENT_PLAN.md.
export function PlaceholderPage({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4 px-6 py-24">
      <p className="text-sm font-medium uppercase tracking-widest text-emerald-600">
        Coming in {phase}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
      <Link href="/" className="text-sm font-medium underline underline-offset-4">
        ← Back to home
      </Link>
    </main>
  );
}
