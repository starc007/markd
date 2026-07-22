import { motion } from "motion/react";
import { useRef, useState } from "react";
import { SPRING_PANEL } from "@/lib/ease";
import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  sidebarWidthFromKey,
  sidebarWidthFromPointer,
} from "@/lib/sidebarResize";
import { cx } from "@/lib/utils";

interface ResizableSidebarProps {
  hidden: boolean;
  width: number;
  onWidthChange: (width: number) => void;
  children: React.ReactNode;
}

interface ResizeStart {
  pointerX: number;
  width: number;
}

export function ResizableSidebar({
  hidden,
  width,
  onWidthChange,
  children,
}: ResizableSidebarProps) {
  const resizeStart = useRef<ResizeStart | null>(null);
  const [resizing, setResizing] = useState(false);

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    resizeStart.current = { pointerX: event.clientX, width };
    event.currentTarget.setPointerCapture(event.pointerId);
    setResizing(true);
    event.preventDefault();
  };

  const resize = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = resizeStart.current;
    if (!start) return;
    onWidthChange(
      sidebarWidthFromPointer(start.width, start.pointerX, event.clientX),
    );
  };

  const finishResize = (event: React.PointerEvent<HTMLDivElement>) => {
    resizeStart.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setResizing(false);
  };

  const resizeWithKeyboard = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const nextWidth = sidebarWidthFromKey(width, event.key);
    if (nextWidth === null) return;
    event.preventDefault();
    event.stopPropagation();
    onWidthChange(nextWidth);
  };

  return (
    <motion.div
      animate={{ width: hidden ? 0 : width }}
      initial={false}
      transition={resizing ? { duration: 0 } : SPRING_PANEL}
      className={cx(
        "relative h-full shrink-0 overflow-hidden",
        resizing && "select-none",
      )}
    >
      <div style={{ width }} className="h-full">
        {children}
      </div>

      {!hidden && (
        <div
          role="separator"
          aria-label="Resize sidebar"
          aria-controls="markd-sidebar"
          aria-orientation="vertical"
          aria-valuemin={SIDEBAR_MIN_WIDTH}
          aria-valuemax={SIDEBAR_MAX_WIDTH}
          aria-valuenow={width}
          aria-valuetext={`${width} pixels`}
          tabIndex={0}
          title="Drag to resize. Double-click to reset."
          data-sidebar-resize-handle
          onPointerDown={startResize}
          onPointerMove={resize}
          onPointerUp={finishResize}
          onPointerCancel={finishResize}
          onLostPointerCapture={() => {
            resizeStart.current = null;
            setResizing(false);
          }}
          onKeyDown={resizeWithKeyboard}
          onDoubleClick={() => onWidthChange(SIDEBAR_DEFAULT_WIDTH)}
          className="group absolute inset-y-0 right-0 z-20 w-2 cursor-col-resize touch-none outline-none"
        >
          <span
            className={cx(
              "absolute inset-y-0 right-0 w-px transition-colors duration-100",
              resizing
                ? "bg-ink"
                : "bg-transparent group-hover:bg-line group-focus-visible:bg-ink",
            )}
          />
        </div>
      )}
    </motion.div>
  );
}
