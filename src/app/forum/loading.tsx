import { Skeleton } from "@/components/ui/skeleton";

export default function ForumLoading() {
  return (
    <div className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-24 bg-muted/50" />
            <Skeleton className="h-4 w-56 mt-2 bg-muted/50" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-lg bg-muted/50" />
            <Skeleton className="h-9 w-28 rounded-lg bg-muted/50" />
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-10 w-full rounded-lg bg-muted/50" />
              <div className="space-y-1.5">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="rounded-xl border border-border/30 bg-card/30 p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-48 bg-muted/50" />
                        <Skeleton className="h-3 w-72 bg-muted/50" />
                      </div>
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-12 bg-muted/50" />
                        <Skeleton className="h-4 w-12 bg-muted/50" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
