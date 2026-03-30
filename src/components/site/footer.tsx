import Link from "next/link";
import { Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="text-lg font-semibold text-white">Unmaskr</div>
            <p className="mt-2 text-sm leading-relaxed">
              You decide what gets uncovered. Crowdfund, unlock, and share the stories that matter.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <a
                href="https://x.com/Unmaskr_org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition"
                aria-label="X (Twitter)"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Platform</div>
            <div className="space-y-2 text-sm">
              <Link href="/browse" className="block hover:text-white transition">Browse</Link>
              <Link href="/forum" className="block hover:text-white transition">Forum</Link>
              <Link href="/forum/perks" className="block hover:text-white transition">Unlock Perks</Link>
              <Link href="/upload" className="block hover:text-white transition">Upload</Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Company</div>
            <div className="space-y-2 text-sm">
              <Link href="/faq" className="block hover:text-white transition">FAQ</Link>
              <Link href="/guidelines" className="block hover:text-white transition">Community Guidelines</Link>
              <Link href="/privacy" className="block hover:text-white transition">Privacy Policy</Link>
              <Link href="/terms" className="block hover:text-white transition">Terms of Service</Link>
              <Link href="/contact" className="block hover:text-white transition">Contact</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div>© {new Date().getFullYear()} Unmaskr. All rights reserved.</div>
          <div className="text-slate-500">Crowdfunded truth.</div>
        </div>
      </div>
    </footer>
  );
}
