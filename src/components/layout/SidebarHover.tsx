import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "motion/react";
import { createContext, useContext, useState, type ReactNode } from "react";
import { SPRING_LAYOUT } from "@/lib/ease";
import { cx } from "@/lib/utils";

/**
 * One gliding hover pill shared across the whole sidebar (nav links + tree
 * rows), using beui's shared-layout technique: a single `layoutId` element
 * that motion morphs between rows, with a blur fade on enter/exit. Because
 * the tree is nested (folder collapse), we can't use the flat SharedLayoutBg
 * wrapper — rows opt in via useHoverRow + <HoverPill>.
 */

interface HoverApi {
  hovered: string | null;
  setHovered: (id: string | null) => void;
}

const HoverContext = createContext<HoverApi>({
  hovered: null,
  setHovered: () => {},
});

const variants: Variants = {
  initial: { opacity: 0, filter: "blur(5px)" },
  animate: { opacity: 1, filter: "blur(0px)" },
  exit: (isActive: boolean) =>
    !isActive ? { opacity: 0, filter: "blur(5px)" } : {},
};

const reducedVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: (isActive: boolean) => (!isActive ? { opacity: 0 } : {}),
};

export function SidebarHover({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <motion.div
      layoutRoot
      onMouseLeave={() => setHovered(null)}
      className={cx("flex min-h-0 flex-1 flex-col", className)}
    >
      <HoverContext.Provider value={{ hovered, setHovered }}>
        {children}
      </HoverContext.Provider>
    </motion.div>
  );
}

/** Bind a row to the shared hover: spread `onMouseEnter` onto it. */
export function useHoverRow(id: string) {
  const { setHovered } = useContext(HoverContext);
  return { onMouseEnter: () => setHovered(id) };
}

/** The gliding background. Render as the first child of a `relative` row,
 *  with the row's real content wrapped in `relative z-10`. */
export function HoverPill({ id }: { id: string }) {
  const { hovered } = useContext(HoverContext);
  const reduce = useReducedMotion();
  return (
    <AnimatePresence custom={hovered !== null}>
      {hovered !== null ? (
        <motion.div
          variants={reduce ? reducedVariants : variants}
          initial="initial"
          animate="animate"
          exit="exit"
          custom={hovered !== null}
          className="pointer-events-none absolute inset-0"
        >
          {hovered === id ? (
            <motion.div
              layoutId="sidebar-hover"
              transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
              className="h-full w-full rounded-md bg-foreground/[0.06]"
            />
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
