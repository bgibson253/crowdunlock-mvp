import { Skeleton } from "@/components/ui/skeleton";

export default function InviteLoading() {
  return (
    <main className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8">
          <Skeleton className="h-8 w-40 bg-muted/50" />
          <Skeleton className="h-4 w-72 mt-2 bg-muted/50" />
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 space-y-6">
          {/* Referral link */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 bg-muted/50" />
            <Skeleton className="h-10 w-full rounded-lg bg-muted/50" />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border/30 p-4 space-y-2 text-center">
                <Skeleton className="h-3 w-16 mx-auto bg-muted/50" />
                <Skeleton className="h-7 w-10 mx-auto bg-muted/50" />
              </div>
            ))}
          </div>

          {/* Badge ladder */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-32 bg-muted/50" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full bg-muted/50" />
                <Skeleton className="h-4 w-40 bg-muted/50" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
