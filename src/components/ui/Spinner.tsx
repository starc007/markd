import { cn } from "@/lib/utils";

export function Spinner({
  size = 14,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "box-border block shrink-0 animate-[spin_700ms_linear_infinite] rounded-full border-[1.5px] will-change-transform [backface-visibility:hidden] [transform-origin:50%_50%] motion-reduce:animate-[spin_1400ms_linear_infinite]",
        className,
      )}
      style={{
        width: size,
        height: size,
        borderColor: "currentColor",
        borderRightColor: "transparent",
      }}
    />
  );
}
