"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function ManualUnlockButton({ uploadId }: { uploadId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUnlock() {
    setLoading(true);
    setError(null);
    try {
      const supabase = supabaseBrowser();
      const { error: rpcError } = await supabase.rpc("manual_unlock_upload", {
        p_upload_id: uploadId,
      });
      if (rpcError) {
        setError(rpcError.message);
      } else {
        router.refresh();
      }
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleUnlock}
        disabled={loading}
        className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
      >
        {loading ? "Unlocking…" : "🔓 Unlock Now"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
