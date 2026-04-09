import { Skeleton } from "@/components/ui/skeleton";

export default function SectionLoading() {
  return (
    <div className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <Skeleton className="h-7 w-40 bg-muted/50" />
            <Skeleton className="h-4 w-56 mt-2 bg-muted/50" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg bg-muted/50" />
        </div>

        <div className="space-y-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/30 bg-card/30 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-64 bg-muted/50" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded-full bg-muted/50" />
                    <Skeleton className="h-3 w-20 bg-muted/50" />
                    <Skeleton className="h-3 w-16 bg-muted/50" />
                  </div>
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
    </div>
  );
}
