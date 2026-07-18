import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatusTone = "neutral" | "success" | "info" | "warning" | "cloud";

const TONES: Record<StatusTone, string> = {
  neutral: "border-line/40 bg-panel text-muted",
  success: "border-success-line/40 bg-success-bg text-success",
  info: "border-info-line/40 bg-info-bg text-info",
  warning: "border-warning-line/40 bg-warning-bg text-warning",
  cloud: "border-cloud-line/40 bg-cloud-bg text-cloud",
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
