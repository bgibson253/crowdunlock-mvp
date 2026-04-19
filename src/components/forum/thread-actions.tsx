"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Lock,
  Unlock,
  Pin,
  PinOff,
  Flag,
  Share2,
} from "lucide-react";

import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReportModal } from "@/components/forum/report-modal";
import { InlineThreadEditor } from "@/components/forum/inline-thread-editor";

export function ThreadActions({
  threadId,
  authorId,
  userId,
  isAdmin,
  isLocked,
  isPinned,
  threadTitle,
  threadBody,
}: {
  threadId: string;
  authorId: string;
  userId: string | null;
  isAdmin: boolean;
  isLocked: boolean;
  isPinned: boolean;
  threadTitle: string;
  threadBody: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const isAuthor = userId === authorId;

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this thread?")) return;
    const supabase = supabaseBrowser();
    const { error } = await supabase
      .from("forum_threads")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", threadId);
    if (!error) router.refresh();
  }

  async function toggleLock() {
    const supabase = supabaseBrowser();
    await supabase
      .from("forum_threads")
      .update({ locked: !isLocked })
      .eq("id", threadId);
    router.refresh();
  }

  async function buyPin() {
    try {
      const res = await fetch(`/api/forum/threads/${threadId}/pin`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to pin");
      toast.success("Pinned for 7 days (stackable)");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to pin");
    }
  }

  if (!userId) return null;

  if (editing) {
    return (
      <InlineThreadEditor
        threadId={threadId}
        initialTitle={threadTitle}
        initialBody={threadBody}
        onDone={() => {
          setEditing(false);
          router.refresh();
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isAuthor && (
            <>
              <DropdownMenuItem onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={buyPin}>
            <Pin className="h-3.5 w-3.5 mr-2" />
            Pin thread (500 pts / 7 days)
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          {isAdmin && (
            <>
              <DropdownMenuItem onClick={toggleLock}>
                {isLocked ? (
                  <>
                    <Unlock className="h-3.5 w-3.5 mr-2" />
                    Unlock Thread
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5 mr-2" />
                    Lock Thread
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <PinOff className="h-3.5 w-3.5 mr-2" />
                Admin pin toggle disabled (use points pin)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={() => setShowReport(true)}>
            <Flag className="h-3.5 w-3.5 mr-2" />
            Report
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied!");
            }}
          >
            <Share2 className="h-3.5 w-3.5 mr-2" />
            Share
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showReport && (
        <ReportModal
          targetType="thread"
          targetId={threadId}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  );
}
