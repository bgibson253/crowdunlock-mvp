"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate", label: "Inappropriate" },
  { value: "other", label: "Other" },
] as const;

export function ReportModal({
  targetType,
  targetId,
  onClose,
}: {
  targetType: "thread" | "reply";
  targetId: string;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<string>("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!category) return;
    setSubmitting(true);
    try {
      const supabase = supabaseBrowser();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        toast.error("You must be signed in to report.");
        return;
      }

      const { error } = await supabase.from("forum_reports").insert({
        reporter_id: auth.user.id,
        target_type: targetType,
        target_id: targetId,
        category,
        details: details.trim() || null,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("You've already reported this.");
          setTimeout(() => onClose(), 1500);
          return;
        } else {
          throw error;
        }
      } else {
        toast.success("Report submitted. Thank you.");
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-label={`Report ${targetType}`}>
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-md mx-4 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Report {targetType}</h3>
          <button onClick={onClose} aria-label="Close report dialog" className="p-1 hover:bg-muted rounded">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Reason</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Details (optional)
            </label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Any additional context..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!category || submitting}
          >
            {submitting ? "Submitting…" : "Submit Report"}
          </Button>
        </div>
      </div>
    </div>
  );
}
