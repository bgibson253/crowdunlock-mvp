import Link from "next/link";

import { supabaseServer } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThreadListItem } from "@/components/forum/thread-list-item";

export const dynamic = "force-dynamic";

export default async function ForumIndexPage() {
  const supabase = await supabaseServer();

  const { data: threads, error } = await supabase
    .from("forum_threads")
    .select("id,title,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Forum</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Could not load threads: {error.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-background to-background" />
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        <div className="rounded-2xl border bg-white/60 p-6 backdrop-blur supports-[backdrop-filter]:bg-white/40">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Forum</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Public can read. Sign in to start threads and reply.
              </p>
            </div>
            <Button asChild>
              <Link href="/forum/new">New thread</Link>
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {(threads ?? []).map((t) => (
            <ThreadListItem
              key={t.id}
              id={t.id}
              title={t.title}
              createdAt={t.created_at}
            />
          ))}

          {(threads?.length ?? 0) === 0 && (
            <Card className="rounded-2xl">
              <CardContent className="py-10 text-sm text-muted-foreground">
                No threads yet.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
