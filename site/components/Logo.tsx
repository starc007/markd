// Markd wordmark glyph — a rounded tile with a stylized "M" + downward arrow,
// the markdown motif. Gradient fill by default; `plain` renders it in ink.

export function LogoMark({
  size = 28,
  plain = false,
  id = "lg",
}: {
  size?: number;
  plain?: boolean;
  id?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="32" y2="32">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
      <rect
        width="32"
        height="32"
        rx="8.5"
        fill={plain ? "var(--invert)" : `url(#${id}-fill)`}
      />
      <g
        stroke={plain ? "var(--invert-ink)" : "#fff"}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {/* M */}
        <path d="M7 22V11l4 5 4-5v11" />
        {/* down arrow */}
        <path d="M21.5 11v9M18 16.5l3.5 3.5 3.5-3.5" />
      </g>
    </svg>
  );
}

export function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="text-[16px] font-semibold tracking-tight text-ink">
        Markd
      </span>
    </span>
  );
}
