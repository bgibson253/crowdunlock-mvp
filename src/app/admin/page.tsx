import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { supabaseServer } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Upload,
  DollarSign,
  Activity,
  UserPlus,
  Flag,
  ShieldAlert,
  BookOpen,
  ListChecks,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?redirect=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) redirect("/");

  // Stats queries in parallel
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalUsers },
    { count: totalUploads },
    { count: activeUsers7d },
    { count: newSignups7d },
    { count: openForumReports },
    { count: pendingUploadReports },
    { count: pendingDmca },
    { data: contributionsData },
    { data: recentSignups },
    { data: recentUploads },
    { data: recentForumReports },
    { data: recentDmca },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("uploads").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("last_seen_at", sevenDaysAgo),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("forum_reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("upload_reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("dmca_claims")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("contributions").select("amount_cents"),
    supabase
      .from("profiles")
      .select("id,username,display_name,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("uploads")
      .select("id,title,status,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("forum_reports")
      .select("id,target_type,category,status,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("dmca_claims")
      .select("id,claimant_name,status,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalContributions =
    ((contributionsData as any[]) ?? []).reduce(
      (sum: number, c: any) => sum + (c.amount_cents ?? 0),
      0
    ) / 100;

  const openReportsTotal =
    (openForumReports ?? 0) + (pendingUploadReports ?? 0) + (pendingDmca ?? 0);

  const stats = [
    {
      label: "Total Users",
      value: (totalUsers ?? 0).toLocaleString(),
      icon: Users,
      color: "text-blue-400",
    },
    {
      label: "Total Uploads",
      value: (totalUploads ?? 0).toLocaleString(),
      icon: Upload,
      color: "text-indigo-400",
    },
    {
      label: "Total Contributions",
      value: `$${totalContributions.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: DollarSign,
      color: "text-emerald-400",
    },
    {
      label: "Active Users (7d)",
      value: (activeUsers7d ?? 0).toLocaleString(),
      icon: Activity,
      color: "text-amber-400",
    },
    {
      label: "New Signups (7d)",
      value: (newSignups7d ?? 0).toLocaleString(),
      icon: UserPlus,
      color: "text-purple-400",
    },
    {
      label: "Open Reports",
      value: openReportsTotal.toLocaleString(),
      icon: Flag,
      color: openReportsTotal > 0 ? "text-red-400" : "text-green-400",
    },
  ];

  const quickLinks = [
    {
      label: "Reports & DMCA",
      href: "/admin/reports",
      icon: Flag,
      badge: openReportsTotal > 0 ? openReportsTotal : undefined,
    },
    {
      label: "User Management",
      href: "/admin/users",
      icon: Users,
    },
    {
      label: "Blog Management",
      href: "/blog/new",
      icon: BookOpen,
    },
    {
      label: "Moderation Queue",
      href: "/agent",
      icon: ListChecks,
    },
  ];

  return (
    <div className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform overview and management tools.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label} className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="py-5 px-5 flex items-center gap-4">
                <div className={`shrink-0 rounded-lg bg-muted/50 p-2.5 ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold tabular-nums">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((l) => (
            <Link key={l.href} href={l.href}>
              <Card className="card-hover border-border/50 bg-card/50 backdrop-blur-sm h-full">
                <CardContent className="py-4 px-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <l.icon className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{l.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {l.badge !== undefined && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        {l.badge}
                      </Badge>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Signups */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />
                Recent Signups
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {((recentSignups as any[]) ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent signups.</p>
              ) : (
                ((recentSignups as any[]) ?? []).map((u: any) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                  >
                    <Link
                      href={`/profile/${u.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {u.display_name || u.username || "Anonymous"}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Uploads */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                Recent Uploads
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {((recentUploads as any[]) ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No uploads yet.</p>
              ) : (
                ((recentUploads as any[]) ?? []).map((u: any) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                  >
                    <Link
                      href={`/uploads/${u.id}`}
                      className="text-sm font-medium hover:underline line-clamp-1"
                    >
                      {u.title}
                    </Link>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {u.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Flag className="h-4 w-4 text-amber-400" />
                Recent Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {((recentForumReports as any[]) ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No reports yet.</p>
              ) : (
                ((recentForumReports as any[]) ?? []).map((r: any) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {r.target_type}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {r.category}
                      </Badge>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        r.status === "open"
                          ? "bg-yellow-500/15 text-yellow-400 text-[10px]"
                          : "text-[10px]"
                      }
                    >
                      {r.status}
                    </Badge>
                  </div>
                ))
              )}
              <Button asChild variant="link" size="sm" className="text-xs px-0">
                <Link href="/admin/reports">View all reports →</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent DMCA Claims */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-400" />
                Recent DMCA Claims
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {((recentDmca as any[]) ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No DMCA claims yet.</p>
              ) : (
                ((recentDmca as any[]) ?? []).map((c: any) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                  >
                    <span className="text-sm">{c.claimant_name}</span>
                    <Badge
                      variant="secondary"
                      className={
                        c.status === "pending"
                          ? "bg-yellow-500/15 text-yellow-400 text-[10px]"
                          : "text-[10px]"
                      }
                    >
                      {c.status}
                    </Badge>
                  </div>
                ))
              )}
              <Button asChild variant="link" size="sm" className="text-xs px-0">
                <Link href="/admin/reports">View all →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
