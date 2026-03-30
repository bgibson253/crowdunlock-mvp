import { Skeleton } from "@/components/ui/skeleton";

export default function ThreadLoading() {
  return (
    <div className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      </div>
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-4">
        {/* Breadcrumbs */}
        <Skeleton className="h-4 w-64 bg-muted/50" />

        {/* Thread card */}
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="p-6">
            <Skeleton className="h-7 w-3/4 bg-muted/50" />
          </div>
          <div className="px-6 pb-6 grid gap-3 md:grid-cols-[90px_1fr]">
            <div className="hidden md:flex md:flex-col md:items-center gap-2">
              <Skeleton className="h-12 w-12 rounded-full bg-muted/50" />
              <Skeleton className="h-3 w-16 bg-muted/50" />
              <Skeleton className="h-3 w-12 bg-muted/50" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full bg-muted/50" />
              <Skeleton className="h-4 w-5/6 bg-muted/50" />
              <Skeleton className="h-4 w-3/4 bg-muted/50" />
              <Skeleton className="h-4 w-2/3 bg-muted/50" />
            </div>
          </div>
        </div>

        {/* Replies header */}
        <Skeleton className="h-5 w-24 bg-muted/50" />

        {/* Reply skeletons */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 grid gap-3 md:grid-cols-[90px_1fr]">
            <div className="hidden md:flex md:flex-col md:items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-full bg-muted/50" />
              <Skeleton className="h-3 w-14 bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full bg-muted/50" />
              <Skeleton className="h-4 w-4/5 bg-muted/50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
