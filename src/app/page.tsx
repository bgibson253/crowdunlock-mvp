import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Unlock documents together.
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            Post a document with a refundable $2 fee. Folks fund it. When it hits the goal, it unlocks for everyone.
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/browse">Browse</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/upload">Upload</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
            <CardDescription>Fast, simple, and (eventually) fully automated.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <ol className="list-decimal space-y-2 pl-4">
              <li>Sign in with email magic link.</li>
              <li>Pay $2 to post (refundable).</li>
              <li>AI generates a teaser + quality screen.</li>
              <li>Community funds to the goal.</li>
              <li>When funded, it unlocks + fee refunded.</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
