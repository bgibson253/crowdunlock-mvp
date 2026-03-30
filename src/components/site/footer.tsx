import Link from "next/link";
import { Twitter } from "lucide-react";

function GradientText({ children, className = "", as: Tag = "span" }: { children: React.ReactNode; className?: string; as?: "span" | "div" }) {
  return (
    <Tag
      className={className}
      style={{
        background: "linear-gradient(135deg, #9b7af5, #c470d4)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        color: "transparent",
        display: Tag === "span" ? "inline-block" : "block",
      }}
    >
      {children}
    </Tag>
  );
}

export function Footer() {
  return (
    <footer className="relative border-t border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <GradientText className="text-xl font-bold tracking-tight">Unmaskr</GradientText>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              You decide what gets uncovered. Crowdfund, unlock, and share the stories that matter.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://x.com/Unmaskr_org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-card/50 text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-150"
                aria-label="X (Twitter)"
              >
                <Twitter className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <GradientText as="div" className="text-xs font-bold uppercase tracking-widest mb-4">Platform</GradientText>
            <div className="space-y-2.5 text-sm">
              <Link href="/browse" className="block text-muted-foreground hover:text-foreground transition-colors">Browse</Link>
              <Link href="/forum" className="block text-muted-foreground hover:text-foreground transition-colors">Forum</Link>
              <Link href="/forum/perks" className="block text-muted-foreground hover:text-foreground transition-colors">Unlock Perks</Link>
              <Link href="/upload" className="block text-muted-foreground hover:text-foreground transition-colors">Upload</Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <GradientText as="div" className="text-xs font-bold uppercase tracking-widest mb-4">Company</GradientText>
            <div className="space-y-2.5 text-sm">
              <Link href="/faq" className="block text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
              <Link href="/guidelines" className="block text-muted-foreground hover:text-foreground transition-colors">Community Guidelines</Link>
              <Link href="/privacy" className="block text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="block text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
              <Link href="/contact" className="block text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground/60">
          <div>© {new Date().getFullYear()} Unmaskr. All rights reserved.</div>
          <div>Crowdfunded truth.</div>
        </div>
      </div>
    </footer>
  );
}
