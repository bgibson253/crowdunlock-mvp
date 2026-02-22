import Link from "next/link";

import { supabaseServer } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Forum</h1>
        <Button asChild>
          <Link href="/forum/new">New thread</Link>
        </Button>
      </div>

      <div className="space-y-3">
        {(threads ?? []).map((t) => (
          <Card key={t.id}>
            <CardContent className="py-4">
              <Link className="font-medium hover:underline" href={`/forum/${t.id}`}>
                {t.title}
              </Link>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(t.created_at).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}

        {(threads?.length ?? 0) === 0 && (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              No threads yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
