import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-background to-background" />
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-6 rounded-2xl border bg-white/60 p-6 backdrop-blur supports-[backdrop-filter]:bg-white/40">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white">
            MVP
            <span className="opacity-80">•</span>
            Public browse + forum
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            CrowdUnlock
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Upload content, set a funding goal, and unlock it for everyone once the
            crowd hits the target.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild>
              <Link href="/browse">Browse</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/forum">Forum</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/upload">Create an upload</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Browse unlocks</CardTitle>
              <CardDescription>
                See whats funding now and whats already unlocked.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Classic forum</CardTitle>
              <CardDescription>
                Public can read. Sign in to start threads and reply.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Creator dashboard</CardTitle>
              <CardDescription>
                Track your uploads and iterate on what the crowd wants.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
