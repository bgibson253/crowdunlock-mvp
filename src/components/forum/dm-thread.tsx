"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, AlertTriangle } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
  getOrCreateKeyPair,
  encryptMessage,
  decryptMessage,
} from "@/lib/e2e-crypto";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type DmMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  encrypted_body?: string | null;
  nonce?: string | null;
  encrypted?: boolean;
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
  const [decryptedBodies, setDecryptedBodies] = useState<Record<string, string>>({});
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [e2eReady, setE2eReady] = useState(false);
  const [e2eError, setE2eError] = useState<string | null>(null);
  const [recipientHasKey, setRecipientHasKey] = useState(false);
  const privateKeyRef = useRef<CryptoKey | null>(null);
  const recipientPubKeyRef = useRef<string | null>(null);
  const myPubKeyRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize E2E encryption
  useEffect(() => {
    async function initE2E() {
      try {
        const supabase = supabaseBrowser();

        // Get or create our key pair
        const { privateKey, publicKeyBase64 } = await getOrCreateKeyPair();
        privateKeyRef.current = privateKey;
        myPubKeyRef.current = publicKeyBase64;

        // Upsert our public key to DB
        const { error: upsertErr } = await supabase
          .from("user_public_keys")
          .upsert(
            { user_id: currentUserId, public_key: publicKeyBase64, updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          );
        if (upsertErr) console.warn("Failed to store public key:", upsertErr.message);

        // Fetch recipient's public key
        const { data: recipientKey } = await supabase
          .from("user_public_keys")
          .select("public_key")
          .eq("user_id", recipientId)
          .maybeSingle();

        if (recipientKey?.public_key) {
          recipientPubKeyRef.current = recipientKey.public_key;
          setRecipientHasKey(true);
        }

        setE2eReady(true);
      } catch (err: any) {
        console.error("E2E init failed:", err);
        setE2eError("Encryption setup failed. Messages will be sent unencrypted.");
        setE2eReady(true); // still allow unencrypted fallback
      }
    }

    initE2E();
  }, [currentUserId, recipientId]);

  // Decrypt messages once keys are ready
  useEffect(() => {
    if (!privateKeyRef.current || !e2eReady) return;

    async function decryptAll() {
      const results: Record<string, string> = {};
      for (const m of messages) {
        if (m.encrypted && m.encrypted_body && m.nonce) {
          try {
            // Determine which public key to use for shared secret:
            // If we sent it, we need recipient's public key
            // If they sent it, we need their public key
            // In ECDH, both sides derive the same shared secret
            const otherPubKey =
              m.sender_id === currentUserId
                ? recipientPubKeyRef.current
                : recipientPubKeyRef.current; // same key either way - it's the other person's

            // But if WE sent it, we encrypted with recipient's pub key
            // If THEY sent it, we need sender's (their) pub key
            // Actually for ECDH: sender uses (sender_priv, recipient_pub) → same as recipient uses (recipient_priv, sender_pub)
            // So we always use the OTHER person's public key + our private key
            if (!otherPubKey) {
              results[m.id] = "[Cannot decrypt. Recipient key unavailable.]";
              continue;
            }

            const plaintext = await decryptMessage(
              m.encrypted_body,
              m.nonce,
              privateKeyRef.current!,
              otherPubKey
            );
            results[m.id] = plaintext;
          } catch {
            results[m.id] = "[Decryption failed]";
          }
        }
      }
      setDecryptedBodies(results);
    }

    decryptAll();
  }, [messages, e2eReady, currentUserId]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription for new DMs
  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`dm-${currentUserId}-${recipientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "forum_dms",
          filter: `recipient_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const newMsg = payload.new as DmMessage;
          // Only add messages from this conversation
          if (newMsg.sender_id !== recipientId) return;

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Decrypt if needed
          if (newMsg.encrypted && newMsg.encrypted_body && newMsg.nonce && privateKeyRef.current && recipientPubKeyRef.current) {
            try {
              const plaintext = await decryptMessage(
                newMsg.encrypted_body,
                newMsg.nonce,
                privateKeyRef.current,
                recipientPubKeyRef.current
              );
              setDecryptedBodies((prev) => ({ ...prev, [newMsg.id]: plaintext }));
            } catch {
              setDecryptedBodies((prev) => ({ ...prev, [newMsg.id]: "[Decryption failed]" }));
            }
          }

          // Mark as read
          await supabase
            .from("forum_dms")
            .update({ read: true })
            .eq("id", newMsg.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, recipientId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      const supabase = supabaseBrowser();
      const plaintext = body.trim();

      let insertPayload: any = {
        sender_id: currentUserId,
        recipient_id: recipientId,
        body: plaintext,
        encrypted: false,
      };

      // Encrypt if recipient has a public key
      if (recipientHasKey && privateKeyRef.current && recipientPubKeyRef.current) {
        const { encryptedBody, nonce } = await encryptMessage(
          plaintext,
          privateKeyRef.current,
          recipientPubKeyRef.current
        );
        insertPayload = {
          sender_id: currentUserId,
          recipient_id: recipientId,
          body: "🔒", // placeholder for DB (body has non-empty constraint)
          encrypted_body: encryptedBody,
          nonce,
          encrypted: true,
        };
      }

      const { data, error } = await supabase
        .from("forum_dms")
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setMessages((prev) => [...prev, data as DmMessage]);
        // Pre-fill decrypted body for our own message
        if ((data as any).encrypted) {
          setDecryptedBodies((prev) => ({ ...prev, [(data as any).id]: plaintext }));
        }
      }
      setBody("");
    } catch (err: any) {
      console.error("Send failed:", err?.message);
    } finally {
      setSending(false);
    }
  }

  function getDisplayBody(m: DmMessage): string {
    if (m.encrypted) {
      return decryptedBodies[m.id] ?? "🔒 Decrypting…";
    }
    return m.body;
  }

  return (
    <div className="space-y-3">
      {/* E2E status banner */}
      <div className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-md bg-muted/50">
        {recipientHasKey ? (
          <>
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-green-700 dark:text-green-400 font-medium">
              End-to-end encrypted
            </span>
            <span className="text-muted-foreground">
              Messages are encrypted on your device. Only you and {recipientName} can read them.
            </span>
          </>
        ) : (
          <>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              Not encrypted
            </span>
            <span className="text-muted-foreground">
              {recipientName} hasn&apos;t set up encryption yet. Messages are stored in plaintext.
            </span>
          </>
        )}
      </div>

      {e2eError && (
        <div className="text-xs text-amber-600 px-2">{e2eError}</div>
      )}

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
          const displayBody = getDisplayBody(m);
          return (
            <div
              key={m.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  isMine
                    ? "bg-primary text-white"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">{displayBody}</p>
                <div
                  className={`flex items-center gap-1 text-[10px] mt-1 ${
                    isMine ? "text-indigo-200" : "text-muted-foreground"
                  }`}
                >
                  {m.encrypted && <Lock className="h-2.5 w-2.5" />}
                  {new Date(m.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Reply form */}
      <form onSubmit={handleSend} className="flex gap-2">
        <div className="relative flex-1">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              recipientHasKey
                ? `🔒 Encrypted message to ${recipientName}…`
                : `Message ${recipientName}…`
            }
            rows={2}
            className="resize-none pr-8"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          {recipientHasKey && (
            <Lock className="absolute right-3 top-3 h-3.5 w-3.5 text-green-500 opacity-60" />
          )}
        </div>
        <Button type="submit" disabled={!body.trim() || sending} className="self-end">
          {sending ? "…" : "Send"}
        </Button>
      </form>
    </div>
  );
}
