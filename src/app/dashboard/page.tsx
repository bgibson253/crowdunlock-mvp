import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: uploads, error } = await supabase
    .from("uploads")
    .select("id,title,status,current_funded,funding_goal,created_at,posting_fee_payment_intent_id")
    .eq("uploader_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
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
        {(uploads ?? []).map((u) => (
          <Card key={u.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <CardTitle className="text-base">{u.title}</CardTitle>
              <Badge variant="secondary">{u.status}</Badge>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div>
                Funding: ${u.current_funded ?? 0} / ${u.funding_goal ?? 500}
              </div>
              <div className="mt-2 text-xs">
                Posting fee PI: {u.posting_fee_payment_intent_id ?? "(not set yet)"}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
