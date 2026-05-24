import { useId } from "react";
import { Tooltip as ReactTooltip, type PlacesType } from "react-tooltip";
import type { ReactNode } from "react";

export function Tooltip({
  label,
  children,
  place = "top",
}: {
  label: string;
  children: ReactNode;
  place?: PlacesType;
}) {
  const id = useId().replace(/:/g, "-");

  return (
    <span className="inline-flex" data-tooltip-id={id} data-tooltip-content={label}>
      {children}
      <ReactTooltip
        id={id}
        place={place}
        offset={8}
        delayShow={260}
        delayHide={60}
        opacity={1}
        className="!z-90 !rounded-lg !border !border-line !bg-panel/95 !px-2.5 !py-1.5 !text-xs !font-medium !text-ink !shadow-overlay !backdrop-blur-[22px] !transition !duration-150 dark:!border-line-dark dark:!bg-panel-dark/95 dark:!text-ink-dark"
        classNameArrow="!border-line dark:!border-line-dark"
      />
    </span>
  );
}
