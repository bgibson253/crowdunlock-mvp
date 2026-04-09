import { Skeleton } from "@/components/ui/skeleton";

export default function BlogLoading() {
  return (
    <div className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <div>
          <Skeleton className="h-8 w-24 bg-muted/50" />
          <Skeleton className="h-4 w-56 mt-2 bg-muted/50" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden"
            >
              <Skeleton className="h-40 w-full bg-muted/50" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-5 w-3/4 bg-muted/50" />
                <Skeleton className="h-3 w-full bg-muted/50" />
                <Skeleton className="h-3 w-2/3 bg-muted/50" />
                <div className="flex items-center gap-2 pt-2">
                  <Skeleton className="h-3 w-20 bg-muted/50" />
                  <Skeleton className="h-3 w-24 bg-muted/50" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
