import { ButtonLink, type ButtonSize } from "./button";
import { DMG } from "@/lib/config";

function AppleLogo() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.42 2.2-1.12 2.98-.75.85-2 1.5-3.02 1.42-.13-1.1.42-2.27 1.08-3 .74-.82 2.05-1.42 3.06-1.4zM20.5 17.02c-.55 1.27-.81 1.83-1.52 2.95-.99 1.56-2.38 3.5-4.1 3.51-1.53.02-1.92-1-4-.99-2.07.01-2.5 1.01-4.03.99-1.72-.02-3.04-1.77-4.03-3.33-2.77-4.37-3.06-9.5-1.35-12.22 1.21-1.94 3.13-3.08 4.93-3.08 1.84 0 3 1.01 4.51 1.01 1.47 0 2.37-1.01 4.5-1.01 1.61 0 3.32.88 4.53 2.4-3.98 2.18-3.33 7.86.09 9.79z" />
    </svg>
  );
}

export function DownloadButton({
  label = "Download for macOS",
  size = "lg",
  className,
}: {
  label?: string;
  size?: ButtonSize;
  className?: string;
}) {
  return (
    <ButtonLink href={DMG} size={size} className={className}>
      <AppleLogo />
      {label}
    </ButtonLink>
  );
}
