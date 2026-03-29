import { redirect } from "next/navigation";
import Link from "next/link";

import { supabaseServer } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/forum/breadcrumbs";
import { ReportActions } from "@/components/forum/report-actions";

export const dynamic = "force-dynamic";

export default async function ForumReportsPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?redirect=/forum/reports");

  // Check admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) redirect("/forum");

  // Fetch all reports
  const { data: reports } = await supabase
    .from("forum_reports")
    .select("*")
    .order("created_at", { ascending: false });

  // Get reporter names
  const reporterIds = Array.from(new Set((reports ?? []).map((r: any) => r.reporter_id)));
  const { data: reporters } = reporterIds.length
    ? await supabase.from("profiles").select("id,username,display_name").in("id", reporterIds)
    : { data: [] as any[] };
  const reporterMap: Record<string, string> = {};
  for (const r of (reporters ?? []) as any[]) {
    reporterMap[r.id] = r.display_name || r.username || "Unknown";
  }

  const statusColor: Record<string, string> = {
    open: "bg-yellow-100 text-yellow-800",
    resolved: "bg-green-100 text-green-800",
    dismissed: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-background to-background" />
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-4">
        <Breadcrumbs items={[{ label: "Forum", href: "/forum" }, { label: "Reports" }]} />

        <h1 className="text-2xl font-semibold tracking-tight">Forum Reports</h1>
        <p className="text-sm text-muted-foreground">
          {(reports ?? []).filter((r: any) => r.status === "open").length} open report(s)
        </p>

        <div className="space-y-2">
          {(reports ?? []).length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No reports yet.
              </CardContent>
            </Card>
          ) : (
            (reports as any[]).map((report) => (
              <Card key={report.id}>
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className={statusColor[report.status] || ""}>
                        {report.status}
                      </Badge>
                      <Badge variant="outline">{report.category}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {report.target_type} report
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(report.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-sm">
                    <span className="text-muted-foreground">Reported by: </span>
                    <span className="font-medium">{reporterMap[report.reporter_id] ?? "Unknown"}</span>
                  </div>

                  {report.details && (
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                      {report.details}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <Link
                      href={report.target_type === "thread" ? `/forum/${report.target_id}` : "#"}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      View {report.target_type} →
                    </Link>
                    {report.status === "open" && (
                      <ReportActions reportId={report.id} />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
