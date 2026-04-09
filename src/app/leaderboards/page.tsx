import { Suspense } from "react";
import type { Metadata } from "next";

import { supabaseServer } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Medal, Trophy, DollarSign, Users, TrendingUp } from "lucide-react";
import Link from "next/link";

export const revalidate = 120; // ISR: refresh every 2 minutes
export const metadata: Metadata = {
  title: "Leaderboards",
  description: "See the top contributors, creators, and most active members on Unmaskr.",
};

type LeaderEntry = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  total_amount?: number;
  total_funded?: number;
  activity_count?: number;
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/20">
        <Crown className="h-4 w-4 text-amber-400" />
      </div>
    );
  if (rank === 2)
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-300/20">
        <Medal className="h-4 w-4 text-slate-400" />
      </div>
    );
  if (rank === 3)
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600/20">
        <Medal className="h-4 w-4 text-amber-600" />
      </div>
    );
  return (
    <div className="flex h-8 w-8 items-center justify-center">
      <span className="text-sm font-mono text-muted-foreground">{rank}</span>
    </div>
  );
}

function LeaderRow({
  entry,
  rank,
  statLabel,
  statValue,
}: {
  entry: LeaderEntry;
  rank: number;
  statLabel: string;
  statValue: string;
}) {
  const name = entry.display_name ?? entry.username ?? "User";
  return (
    <Link
      href={`/profile/${entry.user_id}`}
      className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm px-4 py-3 hover:border-primary/30 transition-colors"
    >
      <RankBadge rank={rank} />

      <Avatar className="h-10 w-10 shrink-0">
        {entry.avatar_url ? (
          <AvatarImage src={entry.avatar_url} alt={name} />
        ) : null}
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
          {name.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{name}</div>
        {entry.username && entry.username !== name && (
          <div className="text-[11px] text-muted-foreground truncate">@{entry.username}</div>
        )}
      </div>

      <div className="text-right shrink-0">
        <div className="font-bold text-sm text-primary">{statValue}</div>
        <div className="text-[10px] text-muted-foreground">{statLabel}</div>
      </div>
    </Link>
  );
}

function PeriodTabs({
  tab,
  searchParams,
}: {
  tab: string;
  searchParams: Record<string, string>;
}) {
  const periods = [
    { key: "all", label: "All Time" },
    { key: "month", label: "Monthly" },
    { key: "week", label: "Weekly" },
  ];

  return (
    <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
      {periods.map((p) => {
        const isActive = (searchParams.period ?? "all") === p.key;
        const params = new URLSearchParams();
        if (tab !== "contributors") params.set("tab", tab);
        if (p.key !== "all") params.set("period", p.key);
        const href = params.toString() ? `/leaderboards?${params}` : "/leaderboards";

        return (
          <Link
            key={p.key}
            href={href}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.label}
          </Link>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Trophy className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
      <p className="text-sm">No activity yet for this period.</p>
      <p className="text-xs mt-1">Be the first to claim a spot!</p>
    </div>
  );
}

export default async function LeaderboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; period?: string }>;
}) {
  const sp = await searchParams;
  const activeTab = sp.tab ?? "contributors";
  const period = sp.period ?? "all";

  const supabase = await supabaseServer();

  // Fetch all three leaderboards in parallel
  const [contributors, creators, active] = await Promise.all([
    supabase.rpc("leaderboard_top_contributors", { p_period: period, p_limit: 25 }),
    supabase.rpc("leaderboard_top_creators", { p_period: period, p_limit: 25 }),
    supabase.rpc("leaderboard_most_active", { p_period: period, p_limit: 25 }),
  ]);

  const contributorData = (contributors.data ?? []) as LeaderEntry[];
  const creatorData = (creators.data ?? []) as LeaderEntry[];
  const activeData = (active.data ?? []) as LeaderEntry[];

  function tabHref(tab: string) {
    const params = new URLSearchParams();
    if (tab !== "contributors") params.set("tab", tab);
    if (period !== "all") params.set("period", period);
    return params.toString() ? `/leaderboards?${params}` : "/leaderboards";
  }

  const tabs = [
    { key: "contributors", label: "Top Contributors", icon: DollarSign },
    { key: "creators", label: "Top Creators", icon: TrendingUp },
    { key: "active", label: "Most Active", icon: Users },
  ];

  return (
    <main className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
            <Trophy className="h-7 w-7 text-primary" />
            Leaderboards
          </h1>
          <p className="text-sm text-muted-foreground">
            The top community members on Unmaskr
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
            {tabs.map((t) => {
              const isActive = activeTab === t.key;
              const Icon = t.icon;
              return (
                <Link
                  key={t.key}
                  href={tabHref(t.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </Link>
              );
            })}
          </div>
          <PeriodTabs tab={activeTab} searchParams={sp as Record<string, string>} />
        </div>

        {/* Content */}
        <div className="space-y-3">
          {activeTab === "contributors" && (
            contributorData.length > 0 ? (
              contributorData.map((entry, i) => (
                <LeaderRow
                  key={entry.user_id}
                  entry={entry}
                  rank={i + 1}
                  statLabel="contributed"
                  statValue={`$${Math.floor((entry.total_amount ?? 0) / 100).toLocaleString()}`}
                />
              ))
            ) : (
              <EmptyState />
            )
          )}

          {activeTab === "creators" && (
            creatorData.length > 0 ? (
              creatorData.map((entry, i) => (
                <LeaderRow
                  key={entry.user_id}
                  entry={entry}
                  rank={i + 1}
                  statLabel="funded"
                  statValue={`$${Math.floor((entry.total_funded ?? 0) / 100).toLocaleString()}`}
                />
              ))
            ) : (
              <EmptyState />
            )
          )}

          {activeTab === "active" && (
            activeData.length > 0 ? (
              activeData.map((entry, i) => (
                <LeaderRow
                  key={entry.user_id}
                  entry={entry}
                  rank={i + 1}
                  statLabel="posts"
                  statValue={`${(entry.activity_count ?? 0).toLocaleString()}`}
                />
              ))
            ) : (
              <EmptyState />
            )
          )}
        </div>
      </div>
    </main>
  );
}
