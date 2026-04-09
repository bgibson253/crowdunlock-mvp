import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <main className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-end justify-between">
          <div>
            <Skeleton className="h-9 w-40 bg-muted/50" />
            <Skeleton className="h-4 w-56 mt-2 bg-muted/50" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-28 rounded-lg bg-muted/50" />
            <Skeleton className="h-9 w-28 rounded-lg bg-muted/50" />
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <Skeleton className="h-5 w-48 bg-muted/50" />
                  <Skeleton className="h-5 w-16 rounded-full bg-muted/50" />
                </div>
                <Skeleton className="h-4 w-32 bg-muted/50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
