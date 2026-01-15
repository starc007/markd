import { ReactNode, useId } from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { cn } from "../../lib/utils";

interface TooltipProps {
  id: string;
  content: string;
  children: ReactNode;
  place?: "top" | "bottom" | "left" | "right";
  delayShow?: number;
  className?: string;
}

/**
 * Tooltip component that wraps react-tooltip with consistent styling
 */
export function Tooltip({
  id,
  content,
  children,
  place = "top",
  delayShow = 300,
  className,
}: TooltipProps) {
  return (
    <>
      <div data-tooltip-id={id} className={cn("inline-flex", className)}>
        {children}
      </div>
      <ReactTooltip
        id={id}
        place={place}
        content={content}
        delayShow={delayShow}
        className="!bg-popover !text-popover-foreground !border !border-border !rounded-lg !px-2 !py-1.5 !text-xs !shadow-lg !z-[100] !max-w-xs"
        style={{
          backgroundColor: "var(--popover)",
          color: "var(--popover-foreground)",
          border: "1px solid var(--border)",
        }}
      />
    </>
  );
}

/**
 * Simple tooltip wrapper for buttons and interactive elements
 * Automatically generates a unique ID for the tooltip
 */
interface SimpleTooltipProps {
  content: string;
  children: ReactNode;
  place?: "top" | "bottom" | "left" | "right";
  delayShow?: number;
  className?: string;
}

export function SimpleTooltip({
  content,
  children,
  place = "top",
  delayShow = 300,
  className,
}: SimpleTooltipProps) {
  // Use React's useId for stable, unique IDs
  const id = useId();

  return (
    <Tooltip
      id={id}
      content={content}
      place={place}
      delayShow={delayShow}
      className={className}
    >
      {children}
    </Tooltip>
  );
}
