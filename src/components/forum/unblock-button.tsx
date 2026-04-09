"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { UserX } from "lucide-react";
import { toast } from "sonner";

export function UnblockButton({
  blockId,
  userName,
}: {
  blockId: string;
  userName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleUnblock() {
    setLoading(true);
    const supabase = supabaseBrowser();
    const { error } = await supabase
      .from("user_blocks")
      .delete()
      .eq("id", blockId);
    if (error) {
      toast.error("Failed to unblock user");
    } else {
      toast.success(`Unblocked ${userName}`);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleUnblock}
      disabled={loading}
      className="gap-1.5 text-xs"
    >
      <UserX className="h-3.5 w-3.5" />
      Unblock
    </Button>
  );
}
