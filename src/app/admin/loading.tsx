import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <div>
          <Skeleton className="h-8 w-56 bg-muted/50" />
          <Skeleton className="h-4 w-72 mt-2 bg-muted/50" />
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg bg-muted/50" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-20 bg-muted/50" />
                <Skeleton className="h-3 w-28 bg-muted/50" />
              </div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4">
              <Skeleton className="h-5 w-32 bg-muted/50" />
            </div>
          ))}
        </div>

        {/* Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 space-y-3">
              <Skeleton className="h-5 w-40 bg-muted/50" />
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full bg-muted/50" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
