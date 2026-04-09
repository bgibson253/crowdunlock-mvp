import { Skeleton } from "@/components/ui/skeleton";

export default function WatchlistLoading() {
  return (
    <main className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded bg-muted/50" />
          <Skeleton className="h-7 w-28 bg-muted/50" />
          <Skeleton className="h-4 w-8 bg-muted/50" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden"
            >
              <div className="h-1 w-full bg-muted/30" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-5 w-3/4 bg-muted/50" />
                <Skeleton className="h-3 w-full bg-muted/50" />
                <Skeleton className="h-3 w-2/3 bg-muted/50" />
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20 bg-muted/50" />
                    <Skeleton className="h-3 w-8 bg-muted/50" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full bg-muted/50" />
                </div>
                <Skeleton className="h-3 w-24 bg-muted/50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
