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
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My uploads</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your uploads and funding progress.</p>
        </div>
        <Button asChild>
          <Link href="/upload">New upload</Link>
        </Button>
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
            <Button asChild>
              <Link href="/upload">Create your first upload</Link>
            </Button>
          </div>
        ) : null}
        {(uploads ?? []).map((u) => {
          const funded = Math.floor((u.current_funded ?? 0) / 100);
          const goal = Math.floor((u.funding_goal ?? 50000) / 100);
          return (
            <Link key={u.id} href={`/uploads/${u.id}`}>
              <Card className="transition hover:border-indigo-200 hover:bg-indigo-50/20">
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <CardTitle className="text-base">{u.title}</CardTitle>
                  <Badge variant="secondary">{u.status}</Badge>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <div>Funding: ${funded} / ${goal}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
