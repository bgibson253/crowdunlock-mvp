/** The Oracle — the pitch in one diagram.
 * Uploader (has the goods) ⇄ Oracle (sees all, reveals nothing) ⇄ Funder (has the money).
 * Self-contained: Tailwind + inline SVG, no deps.
 */
export function OracleDiagram() {
  return (
    <div className="relative">
      {/* halo behind the oracle */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/15 blur-3xl" />

      <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[1fr_auto_1fr] sm:gap-0">
        {/* ── Uploader ── */}
        <div className="rounded-2xl border border-blue-500/20 bg-white/[0.03] p-5 text-center backdrop-blur-sm sm:text-right">
          <div className="mb-2 text-3xl">🕵️</div>
          <div className="text-sm font-semibold text-blue-300">The Uploader</div>
          <p className="mt-1 text-xs leading-relaxed text-white/60">
            Has the goods — documents, data, footage. Locked until funded.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-medium text-blue-300">
            &ldquo;Trust me, it&rsquo;s real&rdquo;
          </div>
        </div>

        {/* ── connectors + oracle ── */}
        <div className="flex flex-col items-center px-2 sm:px-6">
          {/* left flow (content in) */}
          <div className="hidden sm:block absolute" />
          <div className="relative flex items-center justify-center">
            {/* the oracle */}
            <div className="relative flex h-36 w-36 flex-col items-center justify-center rounded-full border border-purple-400/40 bg-black/60 shadow-[0_0_60px_rgba(168,85,247,0.25)]">
              <div className="absolute inset-0 animate-pulse rounded-full border border-purple-400/20" />
              {/* eye */}
              <svg width="52" height="52" viewBox="0 0 36 36" aria-hidden>
                <defs>
                  <linearGradient id="oracle-ring" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
                <path
                  d="M4 18c3.5-6 8.2-9 14-9s10.5 3 14 9c-3.5 6-8.2 9-14 9S7.5 24 4 18z"
                  fill="none"
                  stroke="url(#oracle-ring)"
                  strokeWidth="1.8"
                />
                <circle cx="18" cy="18" r="4.5" fill="rgba(0,0,0,0.6)" stroke="url(#oracle-ring)" strokeWidth="1.4" />
                <circle cx="18" cy="18" r="1.8" fill="#c084fc" />
              </svg>
              <div className="mt-1.5 text-[11px] font-bold uppercase tracking-widest text-purple-300">
                The Oracle
              </div>
              <div className="text-[9px] text-white/50">impartial AI examiner</div>
            </div>
          </div>

          <p className="mt-4 max-w-[180px] text-center text-[11px] leading-relaxed text-purple-200/70">
            Sees everything.
            <br />
            Reveals nothing.
            <br />
            Can&rsquo;t be bought.
          </p>
        </div>

        {/* ── Funder ── */}
        <div className="rounded-2xl border border-emerald-500/20 bg-white/[0.03] p-5 text-center backdrop-blur-sm sm:text-left">
          <div className="mb-2 text-3xl">💰</div>
          <div className="text-sm font-semibold text-emerald-300">The Funders</div>
          <p className="mt-1 text-xs leading-relaxed text-white/60">
            Have the money. Won&rsquo;t pay for a mystery box.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
            &ldquo;Prove it first&rdquo;
          </div>
        </div>
      </div>

      {/* the attestation strip */}
      <div className="mx-auto mt-8 max-w-xl rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 backdrop-blur-sm">
        <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-purple-300/70">
          The Oracle&rsquo;s Attestation
        </div>
        <div className="space-y-1.5 font-mono text-[11px]">
          <div className="flex items-center justify-between gap-2 text-white/70">
            <span>&ldquo;47-page internal PDF, covers ~3 years&rdquo;</span>
            <span className="text-emerald-400">✓ confirmed</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-white/70">
            <span>&ldquo;Names the responsible department&rdquo;</span>
            <span className="text-emerald-400">✓ confirmed</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-white/70">
            <span>&ldquo;Includes 2026 figures&rdquo;</span>
            <span className="text-amber-400">◐ partial</span>
          </div>
        </div>
        <p className="mt-3 text-center text-[10px] text-white/40">
          Claims verified against the actual content — without revealing a word of it.
        </p>
      </div>
    </div>
  );
}
