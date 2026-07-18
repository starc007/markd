import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatusTone = "neutral" | "success" | "info" | "warning" | "cloud";

const TONES: Record<StatusTone, string> = {
  neutral: "border-line bg-panel text-muted [&>i]:bg-faint",
  success: "border-success-line bg-success-bg text-success [&>i]:bg-success",
  info: "border-info-line bg-info-bg text-info [&>i]:bg-info",
  warning: "border-warning-line bg-warning-bg text-warning [&>i]:bg-warning",
  cloud: "border-cloud-line bg-cloud-bg text-cloud [&>i]:bg-cloud",
};

export function StatusBadge({
  tone = "neutral",
  children,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: StatusTone;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1.5 rounded-full border px-2 text-[9.5px] font-semibold leading-none",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
