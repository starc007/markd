import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  ActionSwapIcon,
  ActionSwapText,
} from "@/components/motion/action-swap";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

type Side = "top" | "bottom" | "left" | "right";

/**
 * Copies `value` and rolls Copy → Check as feedback. Icon-only by default;
 * pass `text` to render a labeled pill (label cascades to `copiedText`).
 */
export function CopyButton({
  value,
  label = "Copy",
  side = "top",
  className,
  text,
  copiedText = "Copied",
}: {
  value: string;
  label?: string;
  side?: Side;
  className?: string;
  /** render a labeled button with this text beside the icon */
  text?: string;
  /** label shown briefly after copy (only with `text`) */
  copiedText?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = (event: React.MouseEvent) => {
    event.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1400);
  };

  const icon = (
    <ActionSwapIcon
      value={copied ? "done" : "copy"}
      animation="roll"
      className="h-[13px] w-[13px]"
    >
      {copied ? (
        <Check size={13} strokeWidth={2} />
      ) : (
        <Copy size={13} strokeWidth={2} />
      )}
    </ActionSwapIcon>
  );

  if (text) {
    return (
      <button
        type="button"
        onClick={copy}
        className={cn(
          "inline-flex h-7 select-none items-center gap-1.5 rounded-md border border-line bg-hover px-2.5 text-[12.5px] font-medium text-ink transition-colors duration-100 hover:bg-hover",
          className,
        )}
      >
        {icon}
        <ActionSwapText value={copied ? "done" : "idle"} animation="cascade">
          {copied ? copiedText : text}
        </ActionSwapText>
      </button>
    );
  }

  return (
    <Tooltip label={copied ? "Copied" : label} side={side}>
      <button
        type="button"
        onClick={copy}
        className={cn(
          "grid h-7 w-7 place-items-center rounded-md text-faint transition-colors duration-100 hover:bg-active hover:text-ink",
          className,
        )}
      >
        {icon}
      </button>
    </Tooltip>
  );
}
