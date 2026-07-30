/* Custom vector badges for unlock tiers — replaces emoji.
 * Coin-style medallions: gradient ring + dark face + unique glyph per tier.
 * Pure SVG: crisp at any size, no image assets to load.
 */

export type BadgeVariant =
  | "first_bill"
  | "benjamin"
  | "benjamins"
  | "stacking_hundreds"
  | "money_printer"
  | "cash_vault"
  | "midas"
  | "whale"
  | "legend";

export const VARIANT_BY_LABEL: Record<string, BadgeVariant> = {
  "First Bill": "first_bill",
  "It's All About the Benjamin": "benjamin",
  "It's All About the Benjamins": "benjamins",
  "Stacking Hundreds": "stacking_hundreds",
  "Money Printer": "money_printer",
  "Cash Vault": "cash_vault",
  "Midas Touch": "midas",
  "The Whale": "whale",
  "Unmaskr Legend": "legend",
};

/** ring gradient stops per tier (escalating prestige) */
const RING: Record<BadgeVariant, [string, string]> = {
  first_bill: ["#a1a1aa", "#52525b"], // zinc
  benjamin: ["#34d399", "#059669"], // emerald
  benjamins: ["#34d399", "#0d9488"], // emerald→teal
  stacking_hundreds: ["#2dd4bf", "#0891b2"], // teal→cyan
  money_printer: ["#38bdf8", "#6366f1"], // sky→indigo
  cash_vault: ["#818cf8", "#7c3aed"], // indigo→violet
  midas: ["#fbbf24", "#d97706"], // gold
  whale: ["#22d3ee", "#3b82f6"], // cyan→blue
  legend: ["#fde047", "#f59e0b"], // bright gold
};

const GLYPH_COLOR: Record<BadgeVariant, string> = {
  first_bill: "#d4d4d8",
  benjamin: "#6ee7b7",
  benjamins: "#6ee7b7",
  stacking_hundreds: "#5eead4",
  money_printer: "#93c5fd",
  cash_vault: "#c4b5fd",
  midas: "#fde68a",
  whale: "#a5f3fc",
  legend: "#fef08a",
};

function Glyph({ variant, c }: { variant: BadgeVariant; c: string }) {
  switch (variant) {
    case "first_bill":
      return (
        <g stroke={c} strokeWidth="1.6" fill="none" strokeLinecap="round">
          <rect x="9" y="13" width="18" height="10" rx="1.5" />
          <circle cx="18" cy="18" r="3" />
          <path d="M12 18h.01M24 18h.01" strokeWidth="2" />
        </g>
      );
    case "benjamin":
      return (
        <g>
          <g stroke={c} strokeWidth="1.6" fill="none" strokeLinecap="round">
            <rect x="8.5" y="12.5" width="19" height="11" rx="1.5" />
            <circle cx="18" cy="18" r="3.4" />
          </g>
          <text x="18" y="19.6" textAnchor="middle" fontSize="4.2" fontWeight="800" fill={c} fontFamily="ui-sans-serif,system-ui">100</text>
        </g>
      );
    case "benjamins":
      return (
        <g stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round">
          <rect x="10.5" y="10.5" width="17" height="9.5" rx="1.4" opacity="0.55" />
          <rect x="8.5" y="15" width="19" height="10.5" rx="1.4" fill="rgba(0,0,0,0.35)" />
          <circle cx="18" cy="20.2" r="3" />
          <text x="18" y="21.6" textAnchor="middle" fontSize="3.6" fontWeight="800" fill={c} stroke="none" fontFamily="ui-sans-serif,system-ui">100</text>
        </g>
      );
    case "stacking_hundreds":
      return (
        <g stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round">
          <rect x="10" y="9.5" width="16" height="6" rx="1.2" opacity="0.4" />
          <rect x="9" y="14" width="18" height="6" rx="1.2" opacity="0.7" />
          <rect x="8" y="18.5" width="20" height="7" rx="1.2" fill="rgba(0,0,0,0.35)" />
          <circle cx="18" cy="22" r="2.2" />
        </g>
      );
    case "money_printer":
      return (
        <g stroke={c} strokeWidth="1.6" fill="none" strokeLinecap="round">
          <rect x="9" y="12" width="18" height="8" rx="1.5" />
          <path d="M12 12v-2.5h12V12" />
          <rect x="12.5" y="20" width="11" height="6.5" rx="1" />
          <path d="M15 23h6" strokeWidth="1.3" />
          <circle cx="23.5" cy="15.5" r="0.9" fill={c} stroke="none" />
        </g>
      );
    case "cash_vault":
      return (
        <g stroke={c} strokeWidth="1.6" fill="none" strokeLinecap="round">
          <circle cx="18" cy="18" r="9" />
          <circle cx="18" cy="18" r="3.2" />
          <path d="M18 9v3M18 24v3M9 18h3M24 18h3M11.6 11.6l2.2 2.2M22.2 22.2l2.2 2.2M24.4 11.6l-2.2 2.2M13.8 22.2l-2.2 2.2" strokeWidth="1.3" />
        </g>
      );
    case "midas":
      return (
        <g stroke={c} strokeWidth="1.6" fill="none" strokeLinejoin="round" strokeLinecap="round">
          <path d="M10 23.5 8.8 13.5l5 3.6L18 10l4.2 7.1 5-3.6-1.2 10z" />
          <path d="M10.5 26h15" strokeWidth="1.8" />
          <circle cx="18" cy="20.4" r="1.2" fill={c} stroke="none" />
        </g>
      );
    case "whale":
      return (
        <g stroke={c} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 20.5c2-5 6.5-7.5 11-7.5 3.5 0 6 1.5 8 4-1 3.5-4.5 5.5-9 5.5-2 0-3.5-.4-5-1.2-1 1.2-2.6 2-4.5 2 .8-1 .9-2 .5-2.8z" />
          <path d="M25 13.5c.3-1.5 1.3-2.7 3-3-.4 1.2-.3 2.3.2 3.4" />
          <circle cx="13.4" cy="18.6" r="0.9" fill={c} stroke="none" />
        </g>
      );
    case "legend":
      return (
        <g stroke={c} strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M8.5 18c2.6-4.2 5.8-6.3 9.5-6.3s6.9 2.1 9.5 6.3c-2.6 4.2-5.8 6.3-9.5 6.3S11.1 22.2 8.5 18z" />
          <circle cx="18" cy="18" r="3" fill="rgba(0,0,0,0.4)" />
          <circle cx="18" cy="18" r="1.2" fill={c} stroke="none" />
          <path d="M18 7.5v2M18 26.5v2M6.2 12l1.8 1M28 23l1.8 1M6.2 24l1.8-1M28 13l1.8-1" strokeWidth="1.3" />
        </g>
      );
  }
}

export function UnlockBadge({
  variant,
  size = 36,
  glow = false,
  className,
  title,
}: {
  variant: BadgeVariant;
  size?: number;
  glow?: boolean;
  className?: string;
  title?: string;
}) {
  const [g1, g2] = RING[variant];
  const c = GLYPH_COLOR[variant];
  const gid = `ring-${variant}`;
  const fid = `face-${variant}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      className={className}
      role="img"
      aria-label={title ?? variant}
      style={glow ? { filter: `drop-shadow(0 0 ${Math.max(4, size / 6)}px ${g1}66)` } : undefined}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={g1} />
          <stop offset="100%" stopColor={g2} />
        </linearGradient>
        <radialGradient id={fid} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#26263a" />
          <stop offset="100%" stopColor="#101018" />
        </radialGradient>
      </defs>

      {/* outer ring */}
      <circle cx="18" cy="18" r="17" fill={`url(#${gid})`} />
      {/* coin edge notches */}
      <circle cx="18" cy="18" r="15.6" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="0.8" strokeDasharray="1.6 2.2" />
      {/* face */}
      <circle cx="18" cy="18" r="14" fill={`url(#${fid})`} />
      {/* inner rim highlight */}
      <circle cx="18" cy="18" r="14" fill="none" stroke={`url(#${gid})`} strokeWidth="0.7" opacity="0.6" />

      <Glyph variant={variant} c={c} />
    </svg>
  );
}

/** Badge for a tier label; falls back to nothing for unknown labels. */
export function UnlockBadgeForLabel({
  label,
  size = 36,
  glow = false,
  className,
}: {
  label: string | null | undefined;
  size?: number;
  glow?: boolean;
  className?: string;
}) {
  if (!label) return null;
  const variant = VARIANT_BY_LABEL[label];
  if (!variant) return null;
  return <UnlockBadge variant={variant} size={size} glow={glow} className={className} title={label} />;
}
