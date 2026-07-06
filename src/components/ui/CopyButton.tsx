import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ActionSwapIcon } from "@/components/motion/action-swap";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

type Side = "top" | "bottom" | "left" | "right";

/** Icon button that copies `value` and rolls Copy → Check as feedback. */
export function CopyButton({
  value,
  label = "Copy",
  side = "top",
  className,
}: {
  value: string;
  label?: string;
  side?: Side;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = (event: React.MouseEvent) => {
    event.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1400);
  };

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
      </button>
    </Tooltip>
  );
}
