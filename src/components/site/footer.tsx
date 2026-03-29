import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm">
            © {new Date().getFullYear()} Unmaskr. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/privacy" className="hover:text-white transition">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-white transition">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
