"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarkdownEditor } from "@/components/forum/markdown-editor";

type Section = { id: string; name: string; sort_order?: number };

export function NewThreadForm({
  defaultSectionId,
}: {
  defaultSectionId?: string | null;
}) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sectionId, setSectionId] = useState<string | null>(defaultSectionId ?? null);
  const [sections, setSections] = useState<Section[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trustLevel, setTrustLevel] = useState(0);

  useEffect(() => {
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("forum_sections")
        .select("id,name,sort_order")
        .order("sort_order", { ascending: true });

      const list = (data ?? []) as Section[];
      setSections(list);

      if (!sectionId && list.length > 0) {
        setSectionId(list[0].id);
      }

      // Fetch trust level
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("trust_level")
          .eq("id", auth.user.id)
          .maybeSingle();
        if (profile) setTrustLevel(profile.trust_level ?? 0);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const LISTED_IDS = ["listed_stories", "listed_data", "listed_videos"];

  const requestSections = useMemo(
    () => sections.filter((s) => !LISTED_IDS.includes(s.id)),
    [sections]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const supabase = supabaseBrowser();

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setError("You must be signed in.");
        return;
      }

      const { data, error: insertErr } = await supabase
        .from("forum_threads")
        .insert({
          title,
          body,
          section_id: sectionId,
          author_id: auth.user.id,
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;

      // Award points for creating a thread
      try {
        await supabase.rpc("award_points", {
          p_user_id: auth.user.id,
          p_points: 5,
          p_reason: "thread_created",
          p_ref_id: data.id,
        });
      } catch {}

      router.push(`/forum/${data.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Failed to create thread");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardContent className="py-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-1">Category</div>
            <Select value={sectionId ?? undefined} onValueChange={setSectionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {requestSections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-sm font-medium mb-1">Title</div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Be specific (who/what/where)"
            />
          </div>
          <div>
            <div className="text-sm font-medium mb-1">Body</div>
            <MarkdownEditor
              value={body}
              onChange={setBody}
              placeholder={`Include:\n- What you want\n- Why it matters\n- Links/sources\n- Budget/interest level`}
              rows={8}
              authorTrustLevel={trustLevel}
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <Button type="submit" disabled={submitting || !title || !body || !sectionId}>
            {submitting ? "Creating…" : "Create"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
