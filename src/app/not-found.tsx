import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative isolate min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary/8 rounded-full blur-3xl" />
      </div>
      <div className="mx-auto max-w-lg px-4 text-center space-y-6">
        <div className="text-7xl font-black bg-gradient-to-br from-primary/80 to-primary/30 bg-clip-text text-transparent">
          404
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or may have been removed.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild>
            <Link href="/browse">Browse Uploads</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/forum">Visit Forum</Link>
          </Button>
        </div>

        <div className="pt-4">
          <Link
            href="/browse?q="
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Search className="h-4 w-4" />
            Search for something
          </Link>
        </div>
      </div>
    </main>
  );
}
