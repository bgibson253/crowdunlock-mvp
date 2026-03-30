"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Flame } from "lucide-react";

interface TrendingThread {
  id: string;
  title: string;
  recent_replies: number;
  recent_reactions: number;
  hot_score: number;
}

export function TrendingSidebar() {
  const [threads, setThreads] = useState<TrendingThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("trending_threads")
        .select("id, title, recent_replies, recent_reactions, hot_score")
        .limit(5);
      if (data) setThreads(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm p-4 space-y-3">
        <h3 className="text-xs font-bold flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-amber-400" /> Trending
        </h3>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 rounded-lg bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (threads.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm p-4 space-y-3">
      <h3 className="text-xs font-bold flex items-center gap-1.5">
        <Flame className="h-3.5 w-3.5 text-amber-400" /> Trending
      </h3>
      <div className="space-y-2">
        {threads.map((t, i) => (
          <Link
            key={t.id}
            href={`/forum/${t.id}`}
            className="block rounded-lg border border-border/20 bg-background/30 p-2.5 hover:border-primary/30 transition-colors"
          >
            <div className="text-xs font-medium truncate">{t.title}</div>
            <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
              <span>{t.recent_replies} replies</span>
              <span>{t.recent_reactions} reactions</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
