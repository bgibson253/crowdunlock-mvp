import Link from "next/link";

import { supabaseServer } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type SectionRow = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  threads_count: number;
  replies_count: number;
};

export default async function ForumIndexPage() {
  const supabase = await supabaseServer();

  const { data: sectionsRaw, error: sectionsErr } = await supabase
    .from("forum_sections")
    .select("id,name,description,sort_order")
    .order("sort_order", { ascending: true });

  if (sectionsErr) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Could not load sections: {sectionsErr.message}
          </CardContent>
        </Card>
      </div>
    );
  }

  const sections = (sectionsRaw ?? []) as Array<
    Omit<SectionRow, "threads_count" | "replies_count">
  >;

  // MVP counts: fetch small projections and count in memory.
  const { data: threadsMini } = await supabase
    .from("forum_threads")
    .select("id,section_id")
    .limit(5000);

  const { data: repliesMini } = await supabase
    .from("forum_replies")
    .select("thread_id")
    .limit(20000);

  const threadIdToSection = new Map<string, string>();
  for (const t of (threadsMini ?? []) as any[]) {
    if (t.id && t.section_id) threadIdToSection.set(t.id, t.section_id);
  }

  const threadsPerSection = new Map<string, number>();
  for (const t of (threadsMini ?? []) as any[]) {
    const sid = t.section_id ?? "general";
    threadsPerSection.set(sid, (threadsPerSection.get(sid) ?? 0) + 1);
  }

  const repliesPerSection = new Map<string, number>();
  for (const r of (repliesMini ?? []) as any[]) {
    const sid = threadIdToSection.get(r.thread_id);
    if (!sid) continue;
    repliesPerSection.set(sid, (repliesPerSection.get(sid) ?? 0) + 1);
  }

  const sectionsWithCounts: SectionRow[] = sections.map((s) => ({
    ...s,
    threads_count: threadsPerSection.get(s.id) ?? 0,
    replies_count: repliesPerSection.get(s.id) ?? 0,
  }));

  const visibleIds = [
    "general",
    "request_story",
    "request_data",
    "request_video",
    "listed_stories",
    "listed_data",
    "listed_videos",
  ];

  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-background to-background" />
      <div className="mx-auto max-w-6xl px-4 py-10">
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

        <div className="mt-6 space-y-3">
          {sectionsWithCounts
            .filter((s) => visibleIds.includes(s.id))
            .map((s) => (
              <Card key={s.id} className="rounded-2xl">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        href={`/forum/s/${encodeURIComponent(s.id)}`}
                        className="font-semibold tracking-tight hover:underline"
                      >
                        {s.name}
                      </Link>
                      {s.description && (
                        <div className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {s.description}
                        </div>
                      )}
                    </div>

                    <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="rounded-full bg-muted px-2 py-1">
                        {s.threads_count} threads
                      </div>
                      <div className="rounded-full bg-muted px-2 py-1">
                        {s.replies_count} replies
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/forum/new?section=${encodeURIComponent(s.id)}`}>
                          Post
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
