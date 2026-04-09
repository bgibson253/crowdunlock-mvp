"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const REASONS = ["Inappropriate", "Copyright", "Spam", "Misleading", "Other"] as const;

export function ReportUploadButton({ uploadId }: { uploadId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!reason) {
      toast.error("Please select a reason");
      return;
    }
    setSubmitting(true);
    try {
      const supabase = supabaseBrowser();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        toast.error("You must be signed in");
        return;
      }
      const { error } = await supabase.from("upload_reports").insert({
        upload_id: uploadId,
        reporter_id: auth.user.id,
        reason,
        details: details.trim() || null,
      });
      if (error) {
        if (error.code === "23505") {
          toast.error("You have already reported this upload");
        } else {
          toast.error(error.message);
        }
        return;
      }
      toast.success("Report submitted — thank you");
      setOpen(false);
      setReason("");
      setDetails("");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-destructive" aria-label="Report upload">
          <Flag className="h-4 w-4" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report Upload</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason…" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Details <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide additional context…"
              rows={3}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!reason || submitting}
            className="w-full"
          >
            {submitting ? "Submitting…" : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
