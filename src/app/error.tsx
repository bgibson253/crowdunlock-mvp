"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <main className="relative isolate min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-destructive/5 via-background to-background" />
      </div>
      <div className="mx-auto max-w-lg px-4 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          An unexpected error occurred. This has been logged and we&apos;ll look into it.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button onClick={reset}>Try Again</Button>
          <Button asChild variant="outline">
            <Link href="/">Go Home</Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          If this keeps happening, email{" "}
          <a href="mailto:support@unmaskr.org" className="underline hover:text-primary">
            support@unmaskr.org
          </a>
        </p>
      </div>
    </main>
  );
}
