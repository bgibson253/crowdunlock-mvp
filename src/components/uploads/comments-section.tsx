"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { supabaseBrowser } from "@/lib/supabase/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const schema = z.object({
  body: z.string().min(1).max(2000),
});

type Values = z.infer<typeof schema>;

type CommentRow = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
};

export function CommentsSection({ uploadId }: { uploadId: string }) {
  const [comments, setComments] = React.useState<CommentRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { body: "" },
  });

  async function reload() {
    setLoading(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { data, error } = await supabase
      .from("comments")
      .select("id,body,created_at,user_id")
      .eq("upload_id", uploadId)
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    setComments((data ?? []) as CommentRow[]);
    setLoading(false);
  }

  React.useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadId]);

  async function onSubmit(values: Values) {
    setError(null);
    const supabase = supabaseBrowser();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please sign in to comment.");
      return;
    }

    const { error } = await supabase.from("comments").insert({
      upload_id: uploadId,
      user_id: user.id,
      body: values.body,
    });

    if (error) {
      setError(error.message);
      return;
    }

    form.reset({ body: "" });
    await reload();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Add a comment</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Be useful. Be kind." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Post
            </Button>
          </form>
        </Form>

        <div className="space-y-3">
          {loading ? <div className="text-sm text-muted-foreground">Loading…</div> : null}
          {!loading && comments.length === 0 ? (
            <div className="text-sm text-muted-foreground">No comments yet.</div>
          ) : null}
          {comments.map((c) => (
            <div key={c.id} className="rounded-md border p-3">
              <div className="text-sm">{c.body}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {new Date(c.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
