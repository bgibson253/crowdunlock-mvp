"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

type MentionUser = {
  id: string;
  username: string | null;
  display_name: string | null;
};

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 6,
  minHeight,
  authorTrustLevel = 0,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  minHeight?: string;
  authorTrustLevel?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([]);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const mentionDebounce = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Mention: detect @query at cursor
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value;
    onChange(newValue);

    const ta = e.target;
    const cursor = ta.selectionStart;
    const textBefore = newValue.substring(0, cursor);

    // Find the last @ before cursor that starts a mention
    const match = textBefore.match(/@([a-zA-Z0-9_.-]{0,30})$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionStart(cursor - match[0].length);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
      setMentionResults([]);
    }
  }

  // Debounced search for mentions
  useEffect(() => {
    if (mentionQuery === null || mentionQuery.length < 1) {
      setMentionResults([]);
      return;
    }
    if (mentionDebounce.current) clearTimeout(mentionDebounce.current);
    mentionDebounce.current = setTimeout(async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .or(`username.ilike.%${mentionQuery}%,display_name.ilike.%${mentionQuery}%`)
        .limit(6);
      setMentionResults((data ?? []) as MentionUser[]);
    }, 200);
    return () => {
      if (mentionDebounce.current) clearTimeout(mentionDebounce.current);
    };
  }, [mentionQuery]);

  function insertMention(user: MentionUser) {
    const name = user.username || user.display_name || "user";
    const ta = textareaRef.current;
    if (!ta) return;
    const cursor = ta.selectionStart;
    const before = value.substring(0, mentionStart);
    const after = value.substring(cursor);
    const newText = before + `@${name} ` + after;
    onChange(newText);
    setMentionQuery(null);
    setMentionResults([]);
    setTimeout(() => {
      ta.focus();
      const pos = mentionStart + name.length + 2;
      ta.setSelectionRange(pos, pos);
    }, 0);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (mentionResults.length > 0 && mentionQuery !== null) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => Math.min(i + 1, mentionResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(mentionResults[mentionIndex]);
      } else if (e.key === "Escape") {
        setMentionQuery(null);
        setMentionResults([]);
      }
    }
  }

  async function handleImageUpload(file: File) {
    if (authorTrustLevel < 2) {
      console.warn("Image uploads require trust level 2+");
      return;
    }
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
    if (authorTrustLevel < 2) return;
    const files = Array.from(e.dataTransfer.files);
    const img = files.find((f) => f.type.startsWith("image/"));
    if (img) handleImageUpload(img);
  }

  function handlePaste(e: React.ClipboardEvent) {
    if (authorTrustLevel < 2) return;
    const items = Array.from(e.clipboardData.items);
    const hasText = items.some((i) => i.type === "text/plain");
    const imgItem = items.find((i) => i.type.startsWith("image/"));
    if (imgItem && !hasText) {
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
        {authorTrustLevel >= 2 && (
          <ToolbarButton
            icon={ImageIcon}
            label="Upload image"
            onClick={() => fileInputRef.current?.click()}
          />
        )}
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
      {authorTrustLevel >= 2 && (
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
      )}

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
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={rows}
            style={minHeight ? { minHeight } : undefined}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onPaste={handlePaste}
            className="font-mono text-sm"
          />
          {/* Mention dropdown */}
          {mentionQuery !== null && mentionResults.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-50 left-0 mt-1 w-64 bg-popover border rounded-md shadow-lg overflow-hidden"
            >
              {mentionResults.map((user, i) => (
                <button
                  key={user.id}
                  type="button"
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition ${
                    i === mentionIndex ? "bg-muted" : ""
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(user);
                  }}
                >
                  <span className="font-medium">{user.display_name || user.username}</span>
                  {user.username && user.display_name && (
                    <span className="text-muted-foreground ml-1 text-xs">@{user.username}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {uploading && (
        <div className="text-xs text-muted-foreground">Uploading image…</div>
      )}
    </div>
  );
}
