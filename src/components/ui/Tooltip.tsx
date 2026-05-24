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
        offset={7}
        delayShow={120}
        delayHide={40}
        opacity={1}
        className="!z-90 !rounded-lg !border-0 !bg-panel/90 !px-2 !py-1 !text-[11px] !font-medium !leading-none !text-ink !shadow-overlay !backdrop-blur-[18px] !transition !duration-150 dark:!bg-panel-dark/90 dark:!text-ink-dark"
        classNameArrow="!hidden"
      />
    </span>
  );
}
