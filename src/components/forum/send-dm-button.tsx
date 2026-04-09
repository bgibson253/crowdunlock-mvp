"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

export function SendDmButton({
  recipientId,
  recipientName,
}: {
  recipientId: string;
  recipientName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!body.trim() || sending) return;
    setError(null);
    setSending(true);
    try {
      const supabase = supabaseBrowser();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setError("You must be signed in.");
        return;
      }
      const { error: insertErr } = await supabase.from("forum_dms").insert({
        sender_id: auth.user.id,
        recipient_id: recipientId,
        body: body.trim(),
      });
      if (insertErr) {
        if (insertErr.message?.includes("blocked")) {
          throw new Error("Cannot send messages to or from blocked users");
        }
        throw insertErr;
      }
      setSent(true);
      setBody("");
      setTimeout(() => {
        setOpen(false);
        setSent(false);
        router.push("/messages");
      }, 1200);
    } catch (err: any) {
      setError(err?.message ?? "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" aria-label={`Send message to ${recipientName}`}>
          <MessageSquare className="h-3.5 w-3.5" />
          Message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Message {recipientName}</DialogTitle>
        </DialogHeader>
        {sent ? (
          <div className="py-4 text-center text-sm text-emerald-400">Message sent ✓</div>
        ) : (
          <div className="space-y-3">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`Write a message to ${recipientName}…`}
              rows={4}
            />
            {error && <div className="text-sm text-destructive">{error}</div>}
            <Button onClick={handleSend} disabled={!body.trim() || sending} className="w-full">
              {sending ? "Sending…" : "Send message"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
