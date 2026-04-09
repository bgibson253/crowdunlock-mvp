"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function DmcaClaimActions({ claimId, status }: { claimId: string; status: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function resolve(newStatus: string) {
    setLoading(true);
    const supabase = supabaseBrowser();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("dmca_claims")
      .update({
        status: newStatus,
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id,
      })
      .eq("id", claimId);

    if (error) {
      toast.error("Failed to update claim");
    } else {
      toast.success(`Claim marked as ${newStatus}`);
      router.refresh();
    }
    setLoading(false);
  }

  if (status !== "pending") return null;

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="default"
        onClick={() => resolve("approved")}
        disabled={loading}
      >
        Approve & Remove
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => resolve("dismissed")}
        disabled={loading}
      >
        Dismiss
      </Button>
    </div>
  );
}
