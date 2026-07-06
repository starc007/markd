import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type Side = "top" | "bottom" | "left" | "right";

const GAP = 6;
const DELAY_MS = 450;

export function Tooltip({
  label,
  side = "bottom",
  children,
}: {
  label: string;
  side?: Side;
  children: React.ReactElement;
}) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchor = useRef<HTMLElement | null>(null);

  const show = () => {
    const el = anchor.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const point = {
      top: { x: rect.left + rect.width / 2, y: rect.top - GAP },
      bottom: { x: rect.left + rect.width / 2, y: rect.bottom + GAP },
      left: { x: rect.left - GAP, y: rect.top + rect.height / 2 },
      right: { x: rect.right + GAP, y: rect.top + rect.height / 2 },
    }[side];
    setPosition(point);
  };

  const onEnter = (event: React.MouseEvent<HTMLElement>) => {
    anchor.current = event.currentTarget;
    timer.current = setTimeout(show, DELAY_MS);
  };

  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setPosition(null);
  };

  useEffect(() => hide, []);

  if (!isValidElement(children)) return children;

  const childProps = children.props as Record<string, unknown>;
  const trigger = cloneElement(children, {
    onMouseEnter: (event: React.MouseEvent<HTMLElement>) => {
      (childProps.onMouseEnter as ((e: unknown) => void) | undefined)?.(event);
      onEnter(event);
    },
    onMouseLeave: (event: React.MouseEvent<HTMLElement>) => {
      (childProps.onMouseLeave as ((e: unknown) => void) | undefined)?.(event);
      hide();
    },
    onMouseDown: (event: React.MouseEvent<HTMLElement>) => {
      (childProps.onMouseDown as ((e: unknown) => void) | undefined)?.(event);
      hide();
    },
    "aria-label": (childProps["aria-label"] as string) ?? label,
  } as never);

  const transform = {
    top: "translate(-50%, -100%)",
    bottom: "translate(-50%, 0)",
    left: "translate(-100%, -50%)",
    right: "translate(0, -50%)",
  }[side];

  return (
    <>
      {trigger}
      {position &&
        createPortal(
          <div
            role="tooltip"
            className="tooltip-pop pointer-events-none fixed z-110 whitespace-nowrap rounded-md bg-invert px-2 py-1 text-[11px] font-medium text-invert-ink shadow-md shadow-black/15"
            style={{ left: position.x, top: position.y, transform }}
          >
            {label}
          </div>,
          document.body,
        )}
    </>
  );
}
