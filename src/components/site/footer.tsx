import Link from "next/link";
import { Twitter } from "lucide-react";

const footerLinks = {
  Platform: [
    { label: "Browse", href: "/browse" },
    { label: "Forum", href: "/forum" },
    { label: "Leaderboards", href: "/leaderboards" },
    { label: "Blog", href: "/blog" },
  ],
  Legal: [
    { label: "Terms", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
    { label: "DMCA", href: "/dmca" },
    { label: "Guidelines", href: "/guidelines" },
  ],
  Support: [
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Unlock Perks", href: "/forum/perks" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">
                {heading}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">
              Social
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://x.com/Unmaskr_org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Twitter className="h-3.5 w-3.5" />
                  @Unmaskr_org
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border/30 pt-6 text-center">
          <p className="text-xs text-muted-foreground/50">
            © {new Date().getFullYear()} Unmaskr. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
