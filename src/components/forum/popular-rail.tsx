import Link from "next/link";
import { TrendingUp, Eye, MessageSquare, Share2 } from "lucide-react";
import { supabaseServer } from "@/lib/supabase/server";

/** Right rail: most popular threads (views + replies + shares, all-time). */
export async function PopularRail() {
  const supabase = await supabaseServer();

  const { data: threads } = await supabase
    .from("forum_threads")
    .select("id,title,view_count,share_count")
    .is("deleted_at", null)
    .order("view_count", { ascending: false })
    .limit(12);

  const ids = (threads ?? []).map((t: any) => t.id);
  const replyCounts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: replies } = await supabase
      .from("forum_replies")
      .select("thread_id")
      .in("thread_id", ids)
      .is("deleted_at", null);
    for (const r of (replies ?? []) as any[]) {
      replyCounts.set(r.thread_id, (replyCounts.get(r.thread_id) ?? 0) + 1);
    }
  }

  const scored = (threads ?? [])
    .map((t: any) => ({
      ...t,
      replies: replyCounts.get(t.id) ?? 0,
      score:
        (t.view_count ?? 0) +
        (replyCounts.get(t.id) ?? 0) * 5 +
        (t.share_count ?? 0) * 10,
    }))
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 6);

  if (scored.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/30 bg-card/50 p-4 backdrop-blur-sm">
      <h3 className="text-xs font-bold flex items-center gap-1.5">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Most Popular
      </h3>
      <div className="mt-3 space-y-2">
        {scored.map((t: any, i: number) => (
          <Link
            key={t.id}
            href={`/forum/${t.id}`}
            className="flex items-start gap-2.5 rounded-lg border border-border/20 bg-background/30 p-2.5 transition-colors hover:border-emerald-500/30"
          >
            <span className="mt-0.5 text-xs font-bold tabular-nums text-muted-foreground/50">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{t.title}</div>
              <div className="mt-1 flex items-center gap-2.5 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-0.5">
                  <Eye className="h-2.5 w-2.5" />
                  {t.view_count ?? 0}
                </span>
                <span className="inline-flex items-center gap-0.5">
                  <MessageSquare className="h-2.5 w-2.5" />
                  {t.replies}
                </span>
                {(t.share_count ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-0.5">
                    <Share2 className="h-2.5 w-2.5" />
                    {t.share_count}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
