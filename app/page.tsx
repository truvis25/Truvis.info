import Link from "next/link";

const pillars = [
  {
    href: "/directory",
    title: "Verified Directory",
    description:
      "Every organization listed here is vetted and continuously monitored through the Truvis compliance platform.",
  },
  {
    href: "/events",
    title: "Business Events",
    description:
      "Discover and register for events hosted by verified organizations — with organizer-approved attendance.",
  },
  {
    href: "/marketplace",
    title: "Business Marketplace",
    description:
      "Explore fundraising, equity and acquisition opportunities from compliance-verified businesses.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-6 py-24">
      <section className="flex flex-col gap-6">
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-600">
          Trust by construction
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          The directory where every business is verified.
        </h1>
        <p className="max-w-2xl text-lg text-gray-600 dark:text-gray-300">
          Truvis.info publishes only organizations that maintain good standing
          on the Truvis compliance platform — so the businesses you find, meet,
          and deal with are exactly who they say they are.
        </p>
        <div className="flex gap-4">
          <Link
            href="/directory"
            className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:opacity-85"
          >
            Browse the directory
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-black/10 px-6 py-3 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            For organizations
          </Link>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {pillars.map((pillar) => (
          <Link
            key={pillar.href}
            href={pillar.href}
            className="rounded-2xl border border-black/10 p-6 transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
          >
            <h2 className="mb-2 font-semibold">{pillar.title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {pillar.description}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
