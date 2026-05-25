import { FileEditIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

export function Board({
  title,
  icon,
  description,
  meta,
  children,
}: {
  title: string;
  icon: typeof FileEditIcon;
  description?: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <motion.main
      className="min-h-0 overflow-auto bg-panel p-[clamp(28px,5vw,56px)] dark:bg-panel-dark"
      initial={{ opacity: 0, y: 8, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 360, damping: 34 }}
    >
      <div className="mx-auto grid w-full max-w-[920px] gap-6">
        <header className="flex items-start justify-between gap-6 border-b border-line-soft/80 pb-5 dark:border-line-soft-dark/80">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-panel-soft text-muted dark:bg-panel-soft-dark dark:text-muted-dark">
              <HugeiconsIcon icon={icon} size={17} color="currentColor" />
            </div>
            <div className="min-w-0">
              <h1 className="m-0 text-xl font-semibold tracking-normal text-ink dark:text-ink-dark">
                {title}
              </h1>
              {description && (
                <p className="m-0 mt-1 text-sm leading-6 text-muted dark:text-muted-dark">
                  {description}
                </p>
              )}
            </div>
          </div>
          {meta && <div className="shrink-0">{meta}</div>}
        </header>
        {children}
      </div>
    </motion.main>
  );
}
