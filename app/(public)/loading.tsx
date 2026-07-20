import { Skeleton } from "@/components/ui/skeleton";

export default function PublicLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-14 lg:px-12" aria-busy>
      <Skeleton className="mb-3 h-9 w-64" />
      <Skeleton className="mb-10 h-5 w-96 max-w-full" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    </main>
  );
}
