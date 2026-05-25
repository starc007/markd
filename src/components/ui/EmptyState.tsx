import { FileEmpty01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";

export function EmptyState({
  icon = FileEmpty01Icon,
  title,
  description,
  action,
}: {
  icon?: typeof FileEmpty01Icon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-line-soft bg-panel-soft/60 px-6 py-10 text-center dark:border-line-soft-dark dark:bg-panel-soft-dark/60">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-panel text-muted dark:bg-panel-dark dark:text-muted-dark">
        <HugeiconsIcon icon={icon} size={17} color="currentColor" />
      </div>
      <h2 className="mb-0 mt-4 text-sm font-semibold text-ink dark:text-ink-dark">
        {title}
      </h2>
      <p className="m-0 mt-1 max-w-[320px] text-sm leading-6 text-muted dark:text-muted-dark">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
