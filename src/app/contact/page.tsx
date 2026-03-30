import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, Twitter } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Unmaskr team.",
};

export default function ContactPage() {
  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="mx-auto max-w-lg px-4 py-10 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Have a question, issue, or suggestion? We&apos;d love to hear from you.
            </p>

            <div className="space-y-3">
              <a
                href="mailto:hello@unmaskr.org"
                className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm hover:bg-muted transition"
              >
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">Email</div>
                  <div className="text-muted-foreground">hello@unmaskr.org</div>
                </div>
              </a>

              <Link
                href="/forum/s/general"
                className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm hover:bg-muted transition"
              >
                <MessageSquare className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">Forum</div>
                  <div className="text-muted-foreground">Post in General Discussion</div>
                </div>
              </Link>

              <a
                href="https://x.com/Unmaskr_org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm hover:bg-muted transition"
              >
                <Twitter className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">X (Twitter)</div>
                  <div className="text-muted-foreground">@Unmaskr_org</div>
                </div>
              </a>
            </div>

            <p className="text-xs text-muted-foreground pt-2">
              We typically respond within 24–48 hours.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
