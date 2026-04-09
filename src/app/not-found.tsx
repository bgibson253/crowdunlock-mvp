import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative isolate min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />

      <div className="mx-auto max-w-md px-6 py-16 text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-7xl font-extrabold tracking-tighter gradient-text">
            404
          </h1>
          <p className="text-lg font-semibold">Page not found</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>

        <Button
          asChild
          className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2"
        >
          <Link href="/browse">
            <Home className="h-4 w-4" />
            Back to Unmaskr
          </Link>
        </Button>
      </div>
    </div>
  );
}
