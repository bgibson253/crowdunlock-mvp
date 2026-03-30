import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  MessageSquare,
  Shield,
  Star,
  Lock,
  DollarSign,
  Users,
  Flag,
} from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Unmaskr.",
};

const faqs = [
  {
    icon: HelpCircle,
    q: "What is Unmaskr?",
    a: "Unmaskr is a platform where the community crowdfunds content — investigations, data, documents, stories. Once the funding goal is met, the content is unlocked for everyone who contributed.",
  },
  {
    icon: DollarSign,
    q: "How does crowdfunding work?",
    a: "Content creators set a funding goal. Anyone can contribute. Once the goal is reached, the content unlocks for all contributors. If the goal isn't met within the timeframe, contributions are returned.",
  },
  {
    icon: Shield,
    q: "Is my data safe?",
    a: "We use HTTPS encryption, row-level security on our database, and end-to-end encryption for direct messages. We don't sell your data. Read our privacy policy for full details.",
  },
  {
    icon: Lock,
    q: "Are DMs really private?",
    a: "Yes. Direct messages are end-to-end encrypted using ECDH P-256 + AES-256-GCM. Your private key never leaves your browser. We cannot read your messages, even if we wanted to.",
  },
  {
    icon: Star,
    q: "What are trust levels?",
    a: "Trust levels (Newbie through Leader) reflect your community participation. Higher levels unlock features like image uploads, video embeds, and more. Trust is earned through consistent, constructive posting.",
  },
  {
    icon: Users,
    q: "How does moderation work?",
    a: "Posts are reviewed by an AI moderation system. Clear violations may be auto-hidden. If your post is flagged, you can dispute it for re-review. Human admins handle escalated cases. We always explain why a decision was made.",
  },
  {
    icon: Flag,
    q: "How do I report a problem?",
    a: "Use the Report button on any post or reply. You can also contact us directly via email or the forum.",
  },
  {
    icon: MessageSquare,
    q: "Can I post anonymously?",
    a: "You need an account to post, but your real identity is never required. Choose any username and display name you like.",
  },
];

export default function FAQPage() {
  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Frequently Asked Questions</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Everything you need to know about Unmaskr.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <faq.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-sm">{faq.q}</div>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="py-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Still have questions?</p>
            <div className="flex items-center justify-center gap-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/contact">Contact us</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/forum/s/general">Ask the community</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
