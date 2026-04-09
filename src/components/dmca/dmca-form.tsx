"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

export function DmcaForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      claimant_name: data.get("claimant_name") as string,
      claimant_email: data.get("claimant_email") as string,
      copyrighted_work: data.get("copyrighted_work") as string,
      infringing_url: data.get("infringing_url") as string,
      statement: data.get("statement") as string,
      signature: data.get("signature") as string,
    };

    // Validate
    if (!payload.claimant_name || !payload.claimant_email || !payload.copyrighted_work ||
        !payload.infringing_url || !payload.statement || !payload.signature) {
      toast.error("All fields are required");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/dmca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to submit" }));
        throw new Error(err.error || "Failed to submit");
      }

      setSubmitted(true);
      toast.success("DMCA notice submitted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit DMCA notice");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <h2 className="text-lg font-semibold">Notice Submitted</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Your DMCA takedown notice has been received. We will review it and respond within
            48 hours. A confirmation email has been sent to the address you provided.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Submit Takedown Notice</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="claimant_name">Full legal name *</Label>
              <Input
                id="claimant_name"
                name="claimant_name"
                placeholder="Jane Smith"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="claimant_email">Email address *</Label>
              <Input
                id="claimant_email"
                name="claimant_email"
                type="email"
                placeholder="jane@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="copyrighted_work">Description of copyrighted work *</Label>
            <Textarea
              id="copyrighted_work"
              name="copyrighted_work"
              placeholder="Describe the copyrighted work that you believe has been infringed (title, registration number if available, where the original can be found, etc.)"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="infringing_url">URL of infringing content on Unmaskr *</Label>
            <Input
              id="infringing_url"
              name="infringing_url"
              type="url"
              placeholder="https://crowdunlock-mvp.vercel.app/uploads/..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="statement">Statement *</Label>
            <Textarea
              id="statement"
              name="statement"
              rows={4}
              required
              defaultValue="I have a good faith belief that the use of the described material in the manner complained of is not authorized by the copyright owner, its agent, or the law. I swear, under penalty of perjury, that the information in the notification is accurate and that I am the copyright owner or am authorized to act on behalf of the owner of an exclusive right that is allegedly infringed."
            />
            <p className="text-xs text-muted-foreground">
              This is a legal declaration made under penalty of perjury.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signature">Electronic signature (typed full name) *</Label>
            <Input
              id="signature"
              name="signature"
              placeholder="Jane Smith"
              required
            />
            <p className="text-xs text-muted-foreground">
              Typing your name here constitutes your electronic signature.
            </p>
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit DMCA Notice
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
