"use client";

import { useState } from "react";
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
}) {
  const [quoteBody, setQuoteBody] = useState<string | undefined>(undefined);

  return (
    <>
      <ThreadedReplies
        replies={replies}
        userId={userId}
        threadId={threadId}
        authorNames={authorNames}
        authorTrustLevels={authorTrustLevels}
        authorProfiles={authorProfiles}
        isLocked={isLocked}
        isAdmin={isAdmin}
        onQuoteToMain={(text) => setQuoteBody(text)}
      />

      {!isLocked && (
        isAuthenticated ? (
          <ReplyForm threadId={threadId} initialBody={quoteBody} />
        ) : (
          <ReplyFormGate threadId={threadId} />
        )
      )}
    </>
  );
}
