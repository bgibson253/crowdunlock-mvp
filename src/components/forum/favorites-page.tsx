"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";

import { supabaseBrowser } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

type FavoriteThread = {
  thread_id: string;
  title: string;
  created_at: string;
};

export function FavoritesPage({ userId }: { userId: string }) {
  const [favorites, setFavorites] = useState<FavoriteThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = supabaseBrowser();
      const { data: favs } = await supabase
        .from("forum_favorites")
        .select("thread_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      const threadIds = (favs ?? []).map((f: any) => f.thread_id);
      if (threadIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: threads } = await supabase
        .from("forum_threads")
        .select("id, title")
        .in("id", threadIds);

      const titleMap: Record<string, string> = {};
      for (const t of (threads ?? []) as any[]) {
        titleMap[t.id] = t.title;
      }

      setFavorites(
        (favs ?? []).map((f: any) => ({
          thread_id: f.thread_id,
          title: titleMap[f.thread_id] || "Unknown Thread",
          created_at: f.created_at,
        }))
      );
      setLoading(false);
    })();
  }, [userId]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Favorites</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Threads you&apos;ve saved
        </p>
      </div>

      {loading && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">Loading…</CardContent>
        </Card>
      )}

      {!loading && favorites.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Heart className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium">No favorites yet</p>
            <p className="text-xs text-muted-foreground">
              Click the ♡ icon on any thread to save it here.
            </p>
            <Link href="/forum" className="inline-block">
              <span className="text-xs text-primary hover:underline">Browse the forum →</span>
            </Link>
          </CardContent>
        </Card>
      )}

      {!loading && favorites.length > 0 && (
        <div className="space-y-2">
          {favorites.map((f) => (
            <Card
              key={f.thread_id}
              className="transition hover:border-primary/25 hover:bg-primary/5"
            >
              <CardContent className="py-3">
                <Link
                  href={`/forum/${f.thread_id}`}
                  className="font-medium text-sm hover:underline"
                >
                  {f.title}
                </Link>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Saved {new Date(f.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
