"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarkdownEditor } from "@/components/forum/markdown-editor";

export function InlineThreadEditor({
  threadId,
  initialTitle,
  initialBody,
  onDone,
  onCancel,
}: {
  threadId: string;
  initialTitle: string;
  initialBody: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = supabaseBrowser();
      const { error: updateErr } = await supabase
        .from("forum_threads")
        .update({ title: title.trim(), body: body.trim() })
        .eq("id", threadId);
      if (updateErr) throw updateErr;
      onDone();
    } catch (err: any) {
      setError(err?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 w-full">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Thread title"
        className="font-medium"
      />
      <MarkdownEditor
        value={body}
        onChange={setBody}
        placeholder="Thread body..."
        rows={6}
      />
      {error && <div className="text-xs text-red-600">{error}</div>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving || !title.trim() || !body.trim()}>
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
