import { Skeleton } from "@/components/ui/skeleton";

export default function MessagesLoading() {
  return (
    <div className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Skeleton className="h-8 w-32 bg-muted/50 mb-6" />

        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm py-3 px-4 flex items-center gap-3"
            >
              <Skeleton className="h-10 w-10 rounded-full bg-muted/50" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24 bg-muted/50" />
                  <Skeleton className="h-3 w-16 bg-muted/50" />
                </div>
                <Skeleton className="h-3 w-48 bg-muted/50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
