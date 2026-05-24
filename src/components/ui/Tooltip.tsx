import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { createPortal } from "react-dom";
import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

type TooltipSide = "top" | "right" | "bottom" | "left";

const origin: Record<TooltipSide, string> = {
  top: "center bottom",
  right: "left center",
  bottom: "center top",
  left: "right center",
};

const offset: Record<TooltipSide, { x?: number; y?: number }> = {
  top: { y: 8 },
  right: { x: -8 },
  bottom: { y: -8 },
  left: { x: 8 },
};

function variantsFor(side: TooltipSide): Variants {
  const move = offset[side];
  return {
    hidden: {
      opacity: 0,
      scale: 0.88,
      filter: "blur(8px)",
      x: move.x ?? 0,
      y: move.y ?? 0,
    },
    visible: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      x: 0,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 440,
        damping: 30,
        mass: 0.7,
        opacity: { duration: 0.16 },
        filter: { duration: 0.2 },
      },
    },
    exit: {
      opacity: 0,
      scale: 0.94,
      filter: "blur(5px)",
      x: (move.x ?? 0) * 0.5,
      y: (move.y ?? 0) * 0.5,
      transition: { duration: 0.12, ease: [0.16, 1, 0.3, 1] },
    },
  };
}

const reducedVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.12 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

function getPosition(rect: DOMRect, side: TooltipSide) {
  const gap = 8;
  if (side === "right") {
    return {
      left: rect.right + gap,
      top: rect.top + rect.height / 2,
      transform: "translateY(-50%)",
    };
  }
  if (side === "left") {
    return {
      left: rect.left - gap,
      top: rect.top + rect.height / 2,
      transform: "translate(-100%, -50%)",
    };
  }
  if (side === "bottom") {
    return {
      left: rect.left + rect.width / 2,
      top: rect.bottom + gap,
      transform: "translateX(-50%)",
    };
  }
  return {
    left: rect.left + rect.width / 2,
    top: rect.top - gap,
    transform: "translate(-50%, -100%)",
  };
}

export function Tooltip({
  label,
  children,
  place = "top",
}: {
  label: ReactNode;
  children: ReactNode;
  place?: TooltipSide;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<ReturnType<typeof getPosition> | null>(null);
  const id = useId();
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();

  const updatePosition = () => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (rect) setPosition(getPosition(rect, place));
  };

  const show = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    updatePosition();
    timerRef.current = window.setTimeout(() => {
      updatePosition();
      setOpen(true);
    }, 120);
  };

  const hide = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, place]);

  if (!isValidElement(children)) return children;

  const trigger = cloneElement(children as ReactElement<Record<string, unknown>>, {
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
    "aria-describedby": id,
  });

  return (
    <span ref={wrapperRef} className="relative inline-flex align-middle">
      {trigger}
      {createPortal(
        <AnimatePresence>
          {open && position && (
            <span className="pointer-events-none fixed z-90" style={position}>
              <motion.span
                id={id}
                role="tooltip"
                variants={reduceMotion ? reducedVariants : variantsFor(place)}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{
                  transformOrigin: origin[place],
                  willChange: "transform, opacity, filter",
                }}
                className="block whitespace-nowrap rounded-lg bg-tooltip px-2 py-1 text-[11px] font-medium leading-none text-tooltip-ink shadow-tooltip dark:bg-tooltip-dark dark:text-tooltip-ink-dark"
              >
                {label}
              </motion.span>
            </span>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </span>
  );
}
