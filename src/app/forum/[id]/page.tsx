import { notFound } from "next/navigation";

import { supabaseServer } from "@/lib/supabase/server";
import { ReplyForm } from "@/components/forum/reply-form";
import { AuthorCard } from "@/components/forum/author-card";
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
    .select(
      "id,title,body,created_at,author_id,profiles:author_id(id,username,avatar_url,post_count)",
    )
    .eq("id", id)
    .maybeSingle();

  if (threadErr) throw new Error(threadErr.message);
  if (!thread) return notFound();

  const { data: replies, error: repliesErr } = await supabase
    .from("forum_replies")
    .select("id,body,created_at,author_id,profiles:author_id(id,username,avatar_url,post_count)")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });

  if (repliesErr) throw new Error(repliesErr.message);

  const { data: authData } = await supabase.auth.getUser();

  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-background to-background" />
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{thread.title}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="md:border-r md:pr-4">
              <AuthorCard author={(thread as any).profiles ?? null} />
              <div className="mt-3 text-xs text-muted-foreground">
                {new Date(thread.created_at).toLocaleString()}
              </div>
            </div>
            <div>
              <p className="whitespace-pre-wrap text-sm leading-6">{thread.body}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {(replies ?? []).map((r) => (
            <Card key={r.id}>
              <CardContent className="py-4 grid gap-4 md:grid-cols-[220px_1fr]">
                <div className="md:border-r md:pr-4">
                  <AuthorCard author={(r as any).profiles ?? null} />
                  <div className="mt-3 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  <p className="whitespace-pre-wrap text-sm leading-6">{r.body}</p>
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
          <Card className="rounded-2xl">
            <CardContent className="py-6 text-sm">
              <a className="underline" href="/auth">
                Sign in
              </a>{" "}
              to reply.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
