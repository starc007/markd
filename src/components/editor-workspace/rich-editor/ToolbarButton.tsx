import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import { Tooltip } from "@/components/ui";
import { cx } from "@/components/ui/utils";

export function ToolbarButton({
  active,
  disabled,
  icon,
  label,
  onClick,
}: {
  active?: boolean;
  disabled?: boolean;
  icon: IconSvgElement;
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip label={label} place="bottom">
      <button
        aria-label={label}
        disabled={disabled}
        className={cx(
          "grid h-8 w-8 place-items-center rounded-lg text-muted transition-[background-color,color,transform] duration-150 hover:scale-[1.04] hover:bg-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-line disabled:pointer-events-none disabled:opacity-40 dark:text-muted-dark dark:hover:bg-hover-dark dark:hover:text-ink-dark dark:focus-visible:ring-focus-line-dark",
          active &&
            "bg-hover text-ink dark:bg-tooltip-ink/10 dark:text-tooltip-ink",
        )}
        type="button"
        onClick={onClick}
        onMouseDown={(event) => event.preventDefault()}
      >
        <HugeiconsIcon icon={icon} size={16} color="currentColor" />
      </button>
    </Tooltip>
  );
}
