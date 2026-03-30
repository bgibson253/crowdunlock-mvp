"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

export function DeleteAccountForm({ userId, email }: { userId: string; email: string }) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  const confirmed = confirmation === "DELETE";

  async function handleDelete() {
    if (!confirmed || deleting) return;
    setDeleting(true);

    try {
      const supabase = supabaseBrowser();

      // Soft-delete: anonymize profile data
      await supabase
        .from("profiles")
        .update({
          username: `deleted_${userId.slice(0, 8)}`,
          display_name: "Deleted User",
          bio: null,
          website: null,
          location: null,
          twitter: null,
          github: null,
          linkedin: null,
          avatar_url: null,
          banner_url: null,
        })
        .eq("id", userId);

      // Delete notification preferences
      await supabase.from("notification_preferences").delete().eq("user_id", userId);

      // Delete blocks
      await supabase.from("user_blocks").delete().eq("blocker_id", userId);

      // Delete public keys (E2E encryption)
      await supabase.from("user_public_keys").delete().eq("user_id", userId);

      // Sign out
      await supabase.auth.signOut();

      toast.success("Account deleted. Goodbye.");
      router.push("/");
    } catch {
      toast.error("Something went wrong. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div className="space-y-2">
            <h3 className="font-semibold text-destructive">Danger zone</h3>
            <p className="text-sm text-muted-foreground">
              This will permanently anonymize your profile and sign you out. Your posts will remain
              but will show as "Deleted User". This action cannot be undone.
            </p>
            <p className="text-sm text-muted-foreground">
              Account: <span className="font-mono text-foreground">{email}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium">
          Type <span className="font-mono text-destructive">DELETE</span> to confirm
        </label>
        <input
          type="text"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder="DELETE"
          className="w-full rounded-lg border border-border/50 bg-card/50 px-3 py-2 text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-destructive/40"
        />
      </div>

      <Button
        variant="destructive"
        disabled={!confirmed || deleting}
        onClick={handleDelete}
        className="w-full shadow-lg shadow-destructive/20"
      >
        {deleting ? "Deleting account…" : "Delete my account permanently"}
      </Button>
    </div>
  );
}
