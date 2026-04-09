import { redirect } from "next/navigation";
import Link from "next/link";

import { supabaseServer } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/forum/breadcrumbs";
import { ReportActions } from "@/components/forum/report-actions";
import { UploadReportActions } from "@/components/uploads/upload-report-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
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

  // Fetch forum reports
  const { data: forumReports } = await supabase
    .from("forum_reports")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch upload reports
  const { data: uploadReports } = await supabase
    .from("upload_reports")
    .select("*")
    .order("created_at", { ascending: false });

  // Get reporter names for both
  const allReporterIds = Array.from(new Set([
    ...((forumReports ?? []).map((r: any) => r.reporter_id)),
    ...((uploadReports ?? []).map((r: any) => r.reporter_id)),
  ]));
  const { data: reporters } = allReporterIds.length
    ? await supabase.from("profiles").select("id,username,display_name").in("id", allReporterIds)
    : { data: [] as any[] };
  const reporterMap: Record<string, string> = {};
  for (const r of (reporters ?? []) as any[]) {
    reporterMap[r.id] = r.display_name || r.username || "Unknown";
  }

  // Get upload titles for upload reports
  const uploadIds = Array.from(new Set((uploadReports ?? []).map((r: any) => r.upload_id)));
  const { data: uploads } = uploadIds.length
    ? await supabase.from("uploads").select("id,title").in("id", uploadIds)
    : { data: [] as any[] };
  const uploadMap: Record<string, string> = {};
  for (const u of (uploads ?? []) as any[]) {
    uploadMap[u.id] = u.title;
  }

  const statusColor: Record<string, string> = {
    open: "bg-yellow-100 text-yellow-800",
    pending: "bg-yellow-100 text-yellow-800",
    resolved: "bg-green-100 text-green-800",
    dismissed: "bg-gray-100 text-gray-600",
  };

  const openForumCount = (forumReports ?? []).filter((r: any) => r.status === "open").length;
  const openUploadCount = (uploadReports ?? []).filter((r: any) => r.status === "pending").length;

  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-4">
        <Breadcrumbs items={[{ label: "Forum", href: "/forum" }, { label: "Reports" }]} />

        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          {openForumCount + openUploadCount} open report(s)
        </p>

        <Tabs defaultValue="forum" className="w-full">
          <TabsList>
            <TabsTrigger value="forum">
              Forum Reports {openForumCount > 0 && <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5 py-0">{openForumCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="uploads">
              Upload Reports {openUploadCount > 0 && <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5 py-0">{openUploadCount}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forum" className="space-y-2 mt-4">
            {(forumReports ?? []).length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No forum reports yet.
                </CardContent>
              </Card>
            ) : (
              (forumReports as any[]).map((report) => (
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
                        className="text-xs text-primary hover:underline"
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
          </TabsContent>

          <TabsContent value="uploads" className="space-y-2 mt-4">
            {(uploadReports ?? []).length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No upload reports yet.
                </CardContent>
              </Card>
            ) : (
              (uploadReports as any[]).map((report) => (
                <Card key={report.id}>
                  <CardContent className="py-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className={statusColor[report.status] || ""}>
                          {report.status}
                        </Badge>
                        <Badge variant="outline">{report.reason}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(report.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-sm">
                      <span className="text-muted-foreground">Upload: </span>
                      <span className="font-medium">{uploadMap[report.upload_id] ?? "Unknown"}</span>
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
                        href={`/uploads/${report.upload_id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        View upload →
                      </Link>
                      {report.status === "pending" && (
                        <UploadReportActions reportId={report.id} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
