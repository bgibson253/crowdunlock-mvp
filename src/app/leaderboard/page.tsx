import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";
import { Trophy, Flame, Medal, Crown, Star, Award } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Leaderboard" };

async function getLeaderboard() {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, total_points, current_streak, post_count")
    .order("total_points", { ascending: false })
    .limit(25);
  return data ?? [];
}

async function getTrending() {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("trending_threads")
    .select("*")
    .limit(5);
  return data ?? [];
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-5 w-5 text-amber-400" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-muted-foreground" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm text-muted-foreground font-mono w-5 text-center">{rank}</span>;
}

export default async function LeaderboardPage() {
  const [leaders, trending] = await Promise.all([getLeaderboard(), getTrending()]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
          <Trophy className="h-7 w-7 text-primary" />
          Leaderboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Top community members by points earned
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main leaderboard */}
        <div className="md:col-span-2 space-y-3">
          {leaders.map((user, i) => (
            <Link
              key={user.id}
              href={`/profile/${user.id}`}
              className="flex items-center gap-4 rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm px-4 py-3 hover:border-primary/30 transition-colors"
            >
              <RankIcon rank={i + 1} />

              <div className="h-10 w-10 rounded-lg bg-primary/10 overflow-hidden shrink-0">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-primary font-bold">
                    {(user.username || "?").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">@{user.username}</div>
                <div className="text-[11px] text-muted-foreground">
                  {user.post_count ?? 0} posts
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-bold text-sm text-primary">
                  {user.total_points.toLocaleString()} pts
                </div>
                {user.current_streak >= 2 && (
                  <div className="flex items-center gap-0.5 justify-end text-[11px] text-amber-400">
                    <Flame className="h-3 w-3" /> {user.current_streak}d
                  </div>
                )}
              </div>
            </Link>
          ))}

          {leaders.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No activity yet. Be the first to earn points!
            </div>
          )}
        </div>

        {/* Sidebar: Trending */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold flex items-center gap-1.5">
            <Star className="h-4 w-4 text-amber-400" />
            Trending this week
          </h2>

          {trending.length > 0 ? (
            <div className="space-y-2">
              {trending.map((t: any, i: number) => (
                <Link
                  key={t.id}
                  href={`/forum/${t.id}`}
                  className="block rounded-lg border border-border/30 bg-card/50 p-3 hover:border-primary/30 transition-colors"
                >
                  <div className="text-xs font-semibold truncate">{t.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {t.recent_replies} replies · {t.recent_reactions} reactions
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              No trending threads yet.
            </div>
          )}

          {/* Point system explainer */}
          <div className="rounded-xl border border-border/30 bg-card/50 p-4 space-y-3 mt-6">
            <h3 className="text-xs font-bold flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-primary" />
              How points work
            </h3>
            <ul className="text-[11px] text-muted-foreground space-y-1.5">
              <li className="flex justify-between"><span>Daily login</span><span className="text-foreground font-mono">+2</span></li>
              <li className="flex justify-between"><span>Create thread</span><span className="text-foreground font-mono">+5</span></li>
              <li className="flex justify-between"><span>Post reply</span><span className="text-foreground font-mono">+3</span></li>
              <li className="flex justify-between"><span>Receive reaction</span><span className="text-foreground font-mono">+1</span></li>
              <li className="flex justify-between"><span>7-day streak bonus</span><span className="text-foreground font-mono">+10</span></li>
              <li className="flex justify-between"><span>$1 contributed</span><span className="text-foreground font-mono">+1</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
