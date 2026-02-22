import Link from "next/link";

import { supabaseServer } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThreadListItem } from "@/components/forum/thread-list-item";

export const dynamic = "force-dynamic";

type SectionRow = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  threads_count: number;
  replies_count: number;
};

export default async function ForumIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section } = await searchParams;
  const active = section ?? "general";

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

  // Counts per section (cheap enough for MVP)
  const { data: threadCounts } = await supabase
    .from("forum_threads")
    .select("section_id", { count: "exact", head: false });

  // We need grouped counts; Supabase doesn't group in client easily without RPC.
  // MVP approach: fetch ids+section_id and count in memory.
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

  const { data: threads, error: threadsErr } = await supabase
    .from("forum_threads")
    .select("id,title,created_at")
    .eq("section_id", active)
    .order("created_at", { ascending: false })
    .limit(50);

  if (threadsErr) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Could not load threads: {threadsErr.message}
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeSection = sectionsWithCounts.find((s) => s.id === active);

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
            <Link href={`/forum/new?section=${encodeURIComponent(active)}`}>New thread</Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Categories */}
          <Card className="rounded-2xl h-fit">
            <CardContent className="py-4">
              <div className="text-sm font-semibold mb-3">Categories</div>
              <div className="space-y-1">
                {sectionsWithCounts
                  .filter((s) =>
                    [
                      "general",
                      "request_story",
                      "request_data",
                      "request_video",
                      "listed_stories",
                      "listed_data",
                      "listed_videos",
                    ].includes(s.id)
                  )
                  .map((s) => {
                    const isActive = s.id === active;
                    return (
                      <Link
                        key={s.id}
                        href={`/forum?section=${encodeURIComponent(s.id)}`}
                        className={
                          "flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition " +
                          (isActive
                            ? "bg-indigo-600 text-white"
                            : "hover:bg-indigo-50/50")
                        }
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate">{s.name}</div>
                          {s.description && (
                            <div
                              className={
                                "text-xs truncate " +
                                (isActive ? "text-white/80" : "text-muted-foreground")
                              }
                            >
                              {s.description}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <div
                            className={
                              "rounded-full px-2 py-0.5 " +
                              (isActive
                                ? "bg-white/15 text-white"
                                : "bg-muted text-muted-foreground")
                            }
                            title="Threads"
                          >
                            {s.threads_count}
                          </div>
                          <div
                            className={
                              "rounded-full px-2 py-0.5 " +
                              (isActive
                                ? "bg-white/15 text-white"
                                : "bg-muted text-muted-foreground")
                            }
                            title="Replies"
                          >
                            {s.replies_count}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Thread list */}
          <div className="space-y-4">
            <Card className="rounded-2xl">
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">
                      {activeSection?.name ?? "Threads"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(activeSection?.threads_count ?? 0).toLocaleString()} threads •{" "}
                      {(activeSection?.replies_count ?? 0).toLocaleString()} replies
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/forum/new?section=${encodeURIComponent(active)}`}>
                      Post
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

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
                  <CardContent className="py-10">
                    <div className="text-sm font-medium">No threads yet</div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Be the first to post in {activeSection?.name ?? "this category"}.
                    </p>
                    <div className="mt-4">
                      <Button asChild>
                        <Link href={`/forum/new?section=${encodeURIComponent(active)}`}>
                          Create a thread
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
