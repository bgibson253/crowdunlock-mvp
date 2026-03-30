"use client";

import { useRef, useState } from "react";
import { ThreadedReplies } from "@/components/forum/threaded-replies";
import { ReplyForm } from "@/components/forum/reply-form";
import { ReplyFormGate } from "@/components/forum/reply-form-gate";

export function ThreadContent({
  replies,
  userId,
  threadId,
  authorNames,
  authorTrustLevels,
  authorProfiles,
  isLocked,
  isAdmin,
  isAuthenticated,
  threadAuthorId,
  solutionReplyId,
}: {
  replies: any[];
  userId: string | null;
  threadId: string;
  authorNames: Record<string, string>;
  authorTrustLevels: Record<string, number>;
  authorProfiles: Record<string, any>;
  isLocked: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  threadAuthorId?: string | null;
  solutionReplyId?: string | null;
}) {
  const [quoteBody, setQuoteBody] = useState<string | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
  const repliesEndRef = useRef<HTMLDivElement>(null);

  function handleReplyPosted() {
    setRefreshKey((k) => k + 1);
    setTimeout(() => {
      repliesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 500);
  }

  return (
    <>
      <ThreadedReplies
        key={refreshKey}
        replies={replies}
        userId={userId}
        threadId={threadId}
        authorNames={authorNames}
        authorTrustLevels={authorTrustLevels}
        authorProfiles={authorProfiles}
        isLocked={isLocked}
        isAdmin={isAdmin}
        onQuoteToMain={(text) => setQuoteBody(text)}
        onExternalRefresh={refreshKey}
        threadAuthorId={threadAuthorId ?? null}
        solutionReplyId={solutionReplyId ?? null}
      />

      <div ref={repliesEndRef} />

      {!isLocked && (
        isAuthenticated ? (
          <ReplyForm threadId={threadId} initialBody={quoteBody} onReplyPosted={handleReplyPosted} />
        ) : (
          <ReplyFormGate threadId={threadId} />
        )
      )}
    </>
  );
}
