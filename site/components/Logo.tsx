// Markd app icon: the hash "#" mark, matching src-tauri/icons/icon-source.svg
// exactly (dark rounded tile, rounded white strokes).

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      fill="none"
      aria-hidden="true"
    >
      <rect x="0" y="0" width="1024" height="1024" rx="224" ry="224" fill="#191919" />
      <g stroke="#fbfbfa" strokeWidth="84" strokeLinecap="round">
        <line x1="390" y1="280" x2="390" y2="744" />
        <line x1="634" y1="280" x2="634" y2="744" />
        <line x1="280" y1="390" x2="744" y2="390" />
        <line x1="280" y1="634" x2="744" y2="634" />
      </g>
    </svg>
  );
}

export function Wordmark({ size = 24 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="text-[16px] font-semibold tracking-tight text-foreground">
        Markd
      </span>
    </span>
  );
}
