import { createClient } from "@supabase/supabase-js";
import { envClient } from "@/lib/env";
import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommentsSection } from "@/components/uploads/comments-section";
import { RatingSection } from "@/components/uploads/rating-section";

export const dynamic = "force-dynamic";

type UploadRow = {
  id: string;
  title: string;
  status: "private" | "funding" | "unlocked" | "rejected";
  ai_teaser: string | null;
  current_funded: number | null;
  funding_goal: number | null;
  created_at: string;
};

export default async function UploadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const env = envClient();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const { data: upload, error } = await supabase
    .from("uploads")
    .select("id,title,status,ai_teaser,current_funded,funding_goal,created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!upload) return notFound();

  const u = upload as UploadRow;

  if (u.status !== "unlocked") return notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{u.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Unlocked community document</p>
        </div>
        <Badge variant="secondary">{u.status}</Badge>
      </div>

      <div className="mt-8 grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Teaser</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {u.ai_teaser ?? "(No teaser)"}
          </CardContent>
        </Card>

        <RatingSection uploadId={u.id} />
        <CommentsSection uploadId={u.id} />
      </div>
    </main>
  );
}
