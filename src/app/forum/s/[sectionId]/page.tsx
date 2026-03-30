import Link from "next/link";
import { notFound } from "next/navigation";

import { supabaseServer } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThreadListItem } from "@/components/forum/thread-list-item";
import { Breadcrumbs } from "@/components/forum/breadcrumbs";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function ForumSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sectionId: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}) {
  const { sectionId } = await params;
  const { page: pageStr, sort } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1", 10));
  const offset = (page - 1) * PAGE_SIZE;
  const sortMode = sort === "replied" || sort === "viewed" ? sort : "latest";

  const supabase = await supabaseServer();

  const { data: section, error: sectionErr } = await supabase
    .from("forum_sections")
    .select("id,name,description")
    .eq("id", sectionId)
    .maybeSingle();

  if (sectionErr) throw new Error(sectionErr.message);
  if (!section) return notFound();

  // Fetch threads sorted by pinned first, then by sort mode
  let query = supabase
    .from("forum_threads")
    .select("id,title,created_at,view_count,locked,pinned,deleted_at,last_activity_at", { count: "exact" })
    .eq("section_id", sectionId)
    .order("pinned", { ascending: false });

  if (sortMode === "viewed") {
    query = query.order("view_count", { ascending: false });
  } else {
    query = query.order("last_activity_at", { ascending: false, nullsFirst: false });
  }

  const { data: threads, error: threadsErr, count } = await query.range(offset, offset + PAGE_SIZE - 1);

  if (threadsErr) throw new Error(threadsErr.message);

  // Fetch reply counts for these threads
  const threadIds = (threads ?? []).map((t: any) => t.id);
  let replyCounts: Record<string, number> = {};
  if (threadIds.length > 0) {
    const { data: replyData } = await supabase
      .from("forum_replies")
      .select("thread_id")
      .in("thread_id", threadIds)
      .is("deleted_at", null);

    if (replyData) {
      for (const r of replyData as any[]) {
        replyCounts[r.thread_id] = (replyCounts[r.thread_id] || 0) + 1;
      }
    }
  }

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // If sorting by most replied, sort client-side
  let sortedThreads = (threads ?? []) as any[];
  if (sortMode === "replied") {
    sortedThreads = [...sortedThreads].sort((a, b) => {
      const ca = replyCounts[a.id] ?? 0;
      const cb = replyCounts[b.id] ?? 0;
      // Keep pinned at top
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return cb - ca;
    });
  }

  const LISTED_IDS = ["listed_stories", "listed_data", "listed_videos"];
  const isListed = LISTED_IDS.includes(sectionId);

  return (
    <div className="relative isolate min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Breadcrumbs
          items={[
            { label: "Forum", href: "/forum" },
            { label: section.name },
          ]}
        />

        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{section.name}</h1>
            {section.description && (
              <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
            )}
          </div>
          {!isListed && (
            <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Link href={`/forum/new?section=${encodeURIComponent(sectionId)}`}>
                New thread
              </Link>
            </Button>
          )}
        </div>

        {/* Sort pills */}
        <div className="mt-4 flex items-center gap-2">
          {(["latest", "replied", "viewed"] as const).map((s) => {
            const label = s === "latest" ? "Latest" : s === "replied" ? "Most replied" : "Most viewed";
            const isActive = sortMode === s;
            const href = s === "latest"
              ? `/forum/s/${encodeURIComponent(sectionId)}`
              : `/forum/s/${encodeURIComponent(sectionId)}?sort=${s}`;
            return (
              <Link
                key={s}
                href={href}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                    : "bg-card/50 text-muted-foreground border-border/50 hover:bg-card hover:text-foreground hover:border-primary/30"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="mt-6 space-y-2">
          {sortedThreads.map((t: any) => (
            <ThreadListItem
              key={t.id}
              id={t.id}
              title={t.title}
              createdAt={t.last_activity_at || t.created_at}
              viewCount={t.view_count ?? 0}
              replyCount={replyCounts[t.id] ?? 0}
              locked={t.locked ?? false}
              pinned={t.pinned ?? false}
              deleted={!!t.deleted_at}
            />
          ))}

          {(threads?.length ?? 0) === 0 && (
            <div className="rounded-xl border border-border/50 bg-card/50 p-10 backdrop-blur-sm">
              <div className="text-sm font-medium">No threads yet</div>
              <p className="mt-2 text-sm text-muted-foreground">
                {isListed
                  ? `Threads here are auto-created from listings.`
                  : `Be the first to post in ${section.name}.`}
              </p>
              {!isListed && (
                <div className="mt-4">
                  <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                    <Link href={`/forum/new?section=${encodeURIComponent(sectionId)}`}>
                      Create a thread
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/forum/s/${encodeURIComponent(sectionId)}?page=${page - 1}`}
                >
                  ← Previous
                </Link>
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/forum/s/${encodeURIComponent(sectionId)}?page=${page + 1}`}
                >
                  Next →
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
