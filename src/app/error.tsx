"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="relative isolate min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-destructive/5 via-background to-background" />

      <div className="mx-auto max-w-md px-6 py-16 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            An unexpected error occurred. This has been logged and we&apos;ll
            look into it.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={reset}
            variant="outline"
            className="border-border/50 gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 gap-2">
            <Link href="/browse">
              <Home className="h-4 w-4" />
              Go home
            </Link>
          </Button>
        </div>

        {error.digest && (
          <p className="text-[10px] text-muted-foreground/50 font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
