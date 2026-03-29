"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function ReportActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: "resolved" | "dismissed") {
    setLoading(true);
    const supabase = supabaseBrowser();
    await supabase
      .from("forum_reports")
      .update({ status })
      .eq("id", reportId);
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant="outline"
        className="h-6 text-[10px] text-green-700"
        disabled={loading}
        onClick={() => updateStatus("resolved")}
      >
        Resolve
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-6 text-[10px] text-muted-foreground"
        disabled={loading}
        onClick={() => updateStatus("dismissed")}
      >
        Dismiss
      </Button>
    </div>
  );
}
