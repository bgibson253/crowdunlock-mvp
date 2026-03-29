import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ThreadLoading() {
  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-background to-background" />
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-4">
        {/* Breadcrumbs */}
        <Skeleton className="h-4 w-64" />

        {/* Thread card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-[90px_1fr]">
            <div className="hidden md:flex md:flex-col md:items-center gap-2">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>

        {/* Replies header */}
        <Skeleton className="h-5 w-24" />

        {/* Reply skeletons */}
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="py-3 grid gap-2 md:grid-cols-[90px_1fr]">
              <div className="hidden md:flex md:flex-col md:items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-3 w-14" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
