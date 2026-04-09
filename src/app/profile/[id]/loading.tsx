import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <main className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        {/* Profile Card */}
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          {/* Banner */}
          <Skeleton className="h-32 w-full bg-muted/50" />
          <div className="-mt-10 px-6 pb-6">
            <div className="flex items-end gap-4">
              <Skeleton className="h-20 w-20 rounded-full bg-muted/50 border-4 border-background" />
              <div className="flex-1 pb-1 space-y-2">
                <Skeleton className="h-6 w-40 bg-muted/50" />
                <Skeleton className="h-4 w-24 bg-muted/50" />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-4 w-16 bg-muted/50" />
              ))}
            </div>
            <Skeleton className="mt-3 h-16 w-full bg-muted/50" />
          </div>
        </div>

        {/* Tabs */}
        <Skeleton className="h-10 w-full rounded-lg bg-muted/50" />

        {/* Tab content */}
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <Skeleton className="h-4 w-48 bg-muted/50" />
              <Skeleton className="h-4 w-20 bg-muted/50" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
