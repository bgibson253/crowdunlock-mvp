import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Uploads" };

export default async function DashboardPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Show uploads where the user is the uploader, OR uploads they created via the upload form
  // (test-mode uploads have null uploader_id, so also show all uploads for now in test mode)
  const { data: uploads, error } = await supabase
    .from("uploads")
    .select("id,title,status,current_funded,funding_goal,created_at")
    .or(`uploader_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  return (
    <main className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My uploads</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your uploads and funding progress.</p>
        </div>
        <div className="flex items-center gap-3">
            <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Link href="/upload">New upload</Link>
            </Button>
            <Button asChild variant="outline" className="border-border/50">
              <Link href="/dashboard/analytics">📊 Analytics</Link>
            </Button>
          </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-md border p-4 text-sm text-destructive">{error.message}</div>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {(uploads ?? []).length === 0 && !error ? (
          <div className="col-span-full py-16 text-center space-y-3">
            <div className="text-5xl">📦</div>
            <p className="text-base font-medium">No uploads yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first upload and start crowdfunding.
            </p>
            <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Link href="/upload">Create your first upload</Link>
            </Button>
          </div>
        ) : null}
        {(uploads ?? []).map((u) => {
          const funded = Math.floor((u.current_funded ?? 0) / 100);
          const goal = Math.floor((u.funding_goal ?? 50000) / 100);
          return (
            <Link key={u.id} href={`/uploads/${u.id}`}>
              <div className="card-hover rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="p-5 flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold">{u.title}</h3>
                  <Badge variant="secondary" className="bg-muted/50">{u.status}</Badge>
                </div>
                <div className="px-5 pb-5 text-sm text-muted-foreground">
                  <div>Funding: ${funded} / ${goal}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      </div>
    </main>
  );
}
