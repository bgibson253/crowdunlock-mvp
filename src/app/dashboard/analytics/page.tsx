import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { supabaseServer } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Eye, DollarSign, TrendingUp, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Creator Analytics",
  description: "View analytics for your uploads on Unmaskr.",
};

type UploadStat = {
  id: string;
  title: string;
  status: string;
  view_count: number;
  funding_goal: number;
  current_funded: number;
  created_at: string;
  contribution_count: number;
  total_contributed: number;
};

export default async function AnalyticsPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth?redirect=%2Fdashboard%2Fanalytics");

  // Fetch user's uploads
  const { data: uploads } = await supabase
    .from("uploads")
    .select("id,title,status,view_count,funding_goal,current_funded,created_at")
    .eq("uploader_id", user.id)
    .order("created_at", { ascending: false });

  const uploadList = uploads ?? [];

  // Fetch contributions for those uploads
  const uploadIds = uploadList.map((u) => u.id);
  let contributionMap: Record<string, { count: number; total: number }> = {};
  
  if (uploadIds.length > 0) {
    const { data: contributions } = await supabase
      .from("contributions")
      .select("upload_id,amount")
      .in("upload_id", uploadIds);

    for (const c of contributions ?? []) {
      if (!contributionMap[c.upload_id]) {
        contributionMap[c.upload_id] = { count: 0, total: 0 };
      }
      contributionMap[c.upload_id].count += 1;
      contributionMap[c.upload_id].total += c.amount;
    }
  }

  const stats: UploadStat[] = uploadList.map((u) => ({
    ...u,
    view_count: u.view_count ?? 0,
    funding_goal: u.funding_goal ?? 500,
    current_funded: u.current_funded ?? 0,
    contribution_count: contributionMap[u.id]?.count ?? 0,
    total_contributed: contributionMap[u.id]?.total ?? 0,
  }));

  // Summary stats
  const totalViews = stats.reduce((s, u) => s + u.view_count, 0);
  const totalEarned = stats.reduce((s, u) => s + u.total_contributed, 0);
  const totalContributions = stats.reduce((s, u) => s + u.contribution_count, 0);
  const avgConversion = totalViews > 0 ? ((totalContributions / totalViews) * 100) : 0;
  const bestPerforming = stats.length > 0
    ? stats.reduce((best, u) => u.total_contributed > best.total_contributed ? u : best, stats[0])
    : null;

  return (
    <main className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Creator Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Track views, contributions, and conversion rates for your uploads.
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">Total Views</p>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-1 tabular-nums">{totalViews.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">Total Earned</p>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-1 tabular-nums">${(totalEarned / 100).toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">Avg Conversion</p>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-1 tabular-nums">{avgConversion.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">Best Performer</p>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold mt-1 line-clamp-1">
                {bestPerforming?.title ?? "—"}
              </p>
              {bestPerforming && (
                <p className="text-xs text-muted-foreground">
                  ${(bestPerforming.total_contributed / 100).toFixed(2)} earned
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Per-upload table */}
        {stats.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-card/50 p-10 text-center backdrop-blur-sm">
            <div className="text-3xl mb-2">📊</div>
            <p className="font-medium">No uploads yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create an upload to start tracking analytics.</p>
            <Button asChild className="mt-4 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Link href="/upload">Create your first upload</Link>
            </Button>
          </div>
        ) : (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Per-Upload Stats</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Upload</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Views</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Contributions</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Funded</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Conversion</th>
                      <th className="px-4 py-2.5 font-medium text-muted-foreground text-center">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((u) => {
                      const conv = u.view_count > 0 ? ((u.contribution_count / u.view_count) * 100) : 0;
                      const pct = Math.min(100, Math.round((u.current_funded / u.funding_goal) * 100));
                      return (
                        <tr key={u.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <Link href={`/uploads/${u.id}`} className="font-medium hover:text-primary transition-colors line-clamp-1">
                              {u.title}
                            </Link>
                            <Badge variant="secondary" className="ml-2 text-[10px] bg-muted/50">{u.status}</Badge>
                          </td>
                          <td className="text-right px-4 py-3 tabular-nums">{u.view_count.toLocaleString()}</td>
                          <td className="text-right px-4 py-3 tabular-nums">{u.contribution_count}</td>
                          <td className="text-right px-4 py-3 tabular-nums">${(u.total_contributed / 100).toFixed(2)}</td>
                          <td className="text-right px-4 py-3 tabular-nums">{conv.toFixed(1)}%</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 justify-center">
                              <Progress value={pct} className="h-2 w-20" />
                              <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Funding progress over time (CSS bar charts) */}
        {stats.length > 0 && (
          <Card className="mt-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Funding Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.slice(0, 10).map((u) => {
                  const pct = Math.min(100, Math.round((u.current_funded / u.funding_goal) * 100));
                  return (
                    <div key={u.id}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium line-clamp-1 max-w-[60%]">{u.title}</span>
                        <span className="text-muted-foreground tabular-nums">
                          ${Math.floor(u.current_funded / 100)} / ${Math.floor(u.funding_goal / 100)}
                        </span>
                      </div>
                      <div className="h-4 rounded-full bg-muted/30 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
