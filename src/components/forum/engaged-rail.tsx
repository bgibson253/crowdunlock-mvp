import Link from "next/link";
import { MessageSquare, History, Star, HandCoins } from "lucide-react";
import { supabaseServer } from "@/lib/supabase/server";

type EngagedThread = {
  id: string;
  title: string;
  kind: "authored" | "replied" | "favorited" | "pledged";
  when: string;
};

const KIND_META: Record<EngagedThread["kind"], { label: string; icon: any; cls: string }> = {
  authored: { label: "Your thread", icon: MessageSquare, cls: "text-primary" },
  replied: { label: "You replied", icon: MessageSquare, cls: "text-sky-400" },
  favorited: { label: "Favorited", icon: Star, cls: "text-amber-400" },
  pledged: { label: "You'd fund it", icon: HandCoins, cls: "text-emerald-400" },
};

/** Left rail: threads this user has actually touched — their re-entry points. */
export async function EngagedRail({ userId }: { userId: string }) {
  const supabase = await supabaseServer();

  const [authored, replied, favorited, pledged] = await Promise.all([
    supabase
      .from("forum_threads")
      .select("id,title,created_at")
      .eq("author_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("forum_replies")
      .select("thread_id,created_at")
      .eq("author_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("forum_favorites")
      .select("thread_id,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("thread_interest")
      .select("thread_id,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  // Merge with precedence: authored > pledged > favorited > replied
  const map = new Map<string, EngagedThread>();

  for (const r of (replied.data ?? []) as any[]) {
    if (r.thread_id && !map.has(r.thread_id)) {
      map.set(r.thread_id, { id: r.thread_id, title: "", kind: "replied", when: r.created_at });
    }
  }
  for (const f of (favorited.data ?? []) as any[]) {
    if (f.thread_id) {
      map.set(f.thread_id, { id: f.thread_id, title: "", kind: "favorited", when: f.created_at });
    }
  }
  for (const p of (pledged.data ?? []) as any[]) {
    if (p.thread_id) {
      map.set(p.thread_id, { id: p.thread_id, title: "", kind: "pledged", when: p.created_at });
    }
  }
  for (const t of (authored.data ?? []) as any[]) {
    map.set(t.id, { id: t.id, title: t.title, kind: "authored", when: t.created_at });
  }

  // Fetch titles for threads we only know by id
  const needTitles = [...map.values()].filter((t) => !t.title).map((t) => t.id);
  if (needTitles.length > 0) {
    const { data: titleRows } = await supabase
      .from("forum_threads")
      .select("id,title,deleted_at")
      .in("id", needTitles);
    for (const row of (titleRows ?? []) as any[]) {
      const entry = map.get(row.id);
      if (entry) {
        if (row.deleted_at) map.delete(row.id);
        else entry.title = row.title;
      }
    }
  }

  const items = [...map.values()]
    .filter((t) => t.title)
    .sort((a, b) => (a.when < b.when ? 1 : -1))
    .slice(0, 8);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border/30 bg-card/50 p-4 backdrop-blur-sm">
        <h3 className="text-xs font-bold flex items-center gap-1.5">
          <History className="h-3.5 w-3.5 text-primary" /> Your Activity
        </h3>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          Threads you post in, favorite, or pledge to fund will show up here.
        </p>
        <Link
          href="/forum/new"
          className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
        >
          Start your first thread →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/30 bg-card/50 p-4 backdrop-blur-sm">
      <h3 className="text-xs font-bold flex items-center gap-1.5">
        <History className="h-3.5 w-3.5 text-primary" /> Your Activity
      </h3>
      <div className="mt-3 space-y-2">
        {items.map((t) => {
          const meta = KIND_META[t.kind];
          return (
            <Link
              key={t.id}
              href={`/forum/${t.id}`}
              className="block rounded-lg border border-border/20 bg-background/30 p-2.5 transition-colors hover:border-primary/30"
            >
              <div className="truncate text-xs font-medium">{t.title}</div>
              <div className={`mt-1 flex items-center gap-1 text-[10px] ${meta.cls}`}>
                <meta.icon className="h-3 w-3" />
                {meta.label}
              </div>
            </Link>
          );
        })}
      </div>
      <Link
        href="/forum/favorites"
        className="mt-3 inline-block text-[11px] text-muted-foreground hover:text-primary transition-colors"
      >
        All favorites →
      </Link>
    </div>
  );
}
