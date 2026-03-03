"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Quote,
  Image as ImageIcon,
  Eye,
  EyeOff,
} from "lucide-react";

import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownBody } from "@/components/forum/markdown-body";

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-muted transition"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 6,
  minHeight,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  minHeight?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wrapSelection = useCallback(
    (before: string, after: string) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = value.substring(start, end);
      const newText =
        value.substring(0, start) +
        before +
        (selected || "text") +
        after +
        value.substring(end);
      onChange(newText);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(
          start + before.length,
          start + before.length + (selected || "text").length
        );
      }, 0);
    },
    [value, onChange]
  );

  const insertAtCursor = useCallback(
    (text: string) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const newText = value.substring(0, start) + text + value.substring(start);
      onChange(newText);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(start + text.length, start + text.length);
      }, 0);
    },
    [value, onChange]
  );

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      const supabase = supabaseBrowser();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;

      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${auth.user.id}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from("forum-uploads")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("forum-uploads")
        .getPublicUrl(path);

      insertAtCursor(`\n![image](${urlData.publicUrl})\n`);
    } catch (err: any) {
      console.error("Upload failed:", err?.message);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const img = files.find((f) => f.type.startsWith("image/"));
    if (img) handleImageUpload(img);
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = Array.from(e.clipboardData.items);
    const imgItem = items.find((i) => i.type.startsWith("image/"));
    if (imgItem) {
      e.preventDefault();
      const file = imgItem.getAsFile();
      if (file) handleImageUpload(file);
    }
  }

  return (
    <div className="space-y-1">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border rounded-md px-1 py-0.5 bg-muted/30">
        <ToolbarButton
          icon={Bold}
          label="Bold"
          onClick={() => wrapSelection("**", "**")}
        />
        <ToolbarButton
          icon={Italic}
          label="Italic"
          onClick={() => wrapSelection("*", "*")}
        />
        <ToolbarButton
          icon={Code}
          label="Code"
          onClick={() => wrapSelection("`", "`")}
        />
        <ToolbarButton
          icon={Quote}
          label="Blockquote"
          onClick={() => insertAtCursor("\n> ")}
        />
        <ToolbarButton
          icon={List}
          label="Bullet list"
          onClick={() => insertAtCursor("\n- ")}
        />
        <ToolbarButton
          icon={ListOrdered}
          label="Numbered list"
          onClick={() => insertAtCursor("\n1. ")}
        />
        <div className="w-px h-4 bg-border mx-0.5" />
        <ToolbarButton
          icon={ImageIcon}
          label="Upload image"
          onClick={() => fileInputRef.current?.click()}
        />
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setPreview(!preview)}
          title={preview ? "Edit" : "Preview"}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted transition"
        >
          {preview ? (
            <>
              <EyeOff className="h-3 w-3" /> Edit
            </>
          ) : (
            <>
              <Eye className="h-3 w-3" /> Preview
            </>
          )}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
          e.target.value = "";
        }}
      />

      {/* Editor / Preview */}
      {preview ? (
        <Card>
          <CardContent className="py-3 min-h-[120px]">
            {value ? (
              <MarkdownBody content={value} />
            ) : (
              <span className="text-sm text-muted-foreground">
                Nothing to preview
              </span>
            )}
          </CardContent>
        </Card>
      ) : (
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          style={minHeight ? { minHeight } : undefined}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onPaste={handlePaste}
          className="font-mono text-sm"
        />
      )}

      {uploading && (
        <div className="text-xs text-muted-foreground">Uploading image…</div>
      )}
    </div>
  );
}
