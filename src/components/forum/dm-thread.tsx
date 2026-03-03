"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type DmMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read: boolean;
  created_at: string;
};

export function DmThread({
  messages: initialMessages,
  currentUserId,
  recipientId,
  recipientName,
}: {
  messages: DmMessage[];
  currentUserId: string;
  recipientId: string;
  recipientName: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from("forum_dms")
        .insert({
          sender_id: currentUserId,
          recipient_id: recipientId,
          body: body.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setMessages((prev) => [...prev, data as DmMessage]);
      }
      setBody("");
    } catch (err: any) {
      console.error("Send failed:", err?.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Messages */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {messages.length === 0 && (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              No messages yet. Start the conversation!
            </CardContent>
          </Card>
        )}
        {messages.map((m) => {
          const isMine = m.sender_id === currentUserId;
          return (
            <div
              key={m.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  isMine
                    ? "bg-indigo-600 text-white"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <div
                  className={`text-[10px] mt-1 ${
                    isMine ? "text-indigo-200" : "text-muted-foreground"
                  }`}
                >
                  {new Date(m.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply form */}
      <form onSubmit={handleSend} className="flex gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`Message ${recipientName}…`}
          rows={2}
          className="flex-1 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
        />
        <Button type="submit" disabled={!body.trim() || sending} className="self-end">
          {sending ? "…" : "Send"}
        </Button>
      </form>
    </div>
  );
}
