import { notFound } from "next/navigation";

import { supabaseServer } from "@/lib/supabase/server";
import { ReplyForm } from "@/components/forum/reply-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ForumThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await supabaseServer();

  const { data: thread, error: threadErr } = await supabase
    .from("forum_threads")
    .select("id,title,body,created_at,author_id")
    .eq("id", id)
    .maybeSingle();

  if (threadErr) throw new Error(threadErr.message);
  if (!thread) return notFound();

  const { data: replies, error: repliesErr } = await supabase
    .from("forum_replies")
    .select("id,body,created_at,author_id")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });

  if (repliesErr) throw new Error(repliesErr.message);

  const { data: authData } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{thread.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-6">{thread.body}</p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {(replies ?? []).map((r) => (
          <Card key={r.id}>
            <CardContent className="py-4">
              <p className="whitespace-pre-wrap text-sm leading-6">{r.body}</p>
              <div className="text-xs text-muted-foreground mt-2">
                {new Date(r.created_at).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}

        {(replies?.length ?? 0) === 0 && (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              No replies yet.
            </CardContent>
          </Card>
        )}
      </div>

      {authData.user ? (
        <ReplyForm threadId={id} />
      ) : (
        <Card>
          <CardContent className="py-6 text-sm">
            <a className="underline" href="/auth">
              Sign in
            </a>{" "}
            to reply.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
