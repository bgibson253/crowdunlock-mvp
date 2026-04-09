import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardsLoading() {
  return (
    <div className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <div>
          <Skeleton className="h-8 w-48 bg-muted/50" />
          <Skeleton className="h-4 w-64 mt-2 bg-muted/50" />
        </div>

        {/* Tabs skeleton */}
        <Skeleton className="h-10 w-72 rounded-lg bg-muted/50" />

        {/* Table skeleton */}
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="border-b border-border/30 bg-muted/20 px-4 py-3 flex gap-6">
            <Skeleton className="h-4 w-8 bg-muted/50" />
            <Skeleton className="h-4 w-32 bg-muted/50" />
            <Skeleton className="h-4 w-16 bg-muted/50 ml-auto" />
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-4 py-3 border-b border-border/20 last:border-0"
            >
              <Skeleton className="h-5 w-6 bg-muted/50" />
              <Skeleton className="h-9 w-9 rounded-full bg-muted/50" />
              <Skeleton className="h-4 w-32 bg-muted/50 flex-1" />
              <Skeleton className="h-4 w-16 bg-muted/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
