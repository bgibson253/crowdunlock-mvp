import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative isolate min-h-[80vh] flex items-center justify-center">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      </div>
      <div className="mx-auto max-w-lg px-4 text-center space-y-6">
        <div className="text-7xl">🔍</div>
        <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild variant="outline" className="border-border/50">
            <Link href="/forum">Forum</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
