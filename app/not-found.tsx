import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <SearchX className="size-10 text-muted-foreground/60" aria-hidden />
      <h1 className="font-display text-2xl font-bold text-petroleum dark:text-foreground">
        Page not found
      </h1>
      <p className="text-muted-foreground">
        This page doesn&apos;t exist — or belongs to an organization that is
        currently not visible on the network.
      </p>
      <div className="mt-2 flex gap-3">
        <Button asChild>
          <Link href="/directory">Browse the directory</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}
