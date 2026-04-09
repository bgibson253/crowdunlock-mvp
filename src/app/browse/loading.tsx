import { Skeleton } from "@/components/ui/skeleton";

export default function BrowseLoading() {
  return (
    <main className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-32 bg-muted/50" />
            <Skeleton className="h-4 w-64 mt-2 bg-muted/50" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-lg bg-muted/50" />
          </div>
        </div>

        {/* Search placeholder */}
        <Skeleton className="mt-6 h-10 w-full rounded-lg bg-muted/50" />

        {/* Filter bar */}
        <div className="mt-4 flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full bg-muted/50" />
          ))}
        </div>

        {/* Grid skeleton */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden"
            >
              <div className="h-1 w-full bg-muted/30" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-5 w-3/4 bg-muted/50" />
                <Skeleton className="h-4 w-full bg-muted/50" />
                <Skeleton className="h-4 w-5/6 bg-muted/50" />
                <Skeleton className="h-4 w-2/3 bg-muted/50" />
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full bg-muted/50" />
                    <Skeleton className="h-3 w-20 bg-muted/50" />
                  </div>
                  <Skeleton className="h-8 w-16 rounded-lg bg-muted/50" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
