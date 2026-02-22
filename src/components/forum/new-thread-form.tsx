"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestSections = useMemo(
    () =>
      sections.filter((s) =>
        ["general", "request_story", "request_data", "request_video"].includes(s.id)
      ),
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
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder={`Include:\n- What you want\n- Why it matters\n- Links/sources\n- Budget/interest level`}
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
