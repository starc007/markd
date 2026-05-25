import {
  AiUserIcon,
  Folder01Icon,
  Moon02Icon,
  Settings02Icon,
  Sun02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, cx } from "@/components/ui";
import { useWorkspaceStore } from "@/stores/workspace";
import { Board } from "./Board";

export function SettingsBoard() {
  const theme = useWorkspaceStore((state) => state.theme);
  const setTheme = useWorkspaceStore((state) => state.setTheme);
  const rootPath = useWorkspaceStore((state) => state.rootPath);

  return (
    <Board
      title="Settings"
      icon={Settings02Icon}
      description="Workspace preferences, appearance, and local storage details."
    >
      <div className="overflow-hidden rounded-2xl border border-line bg-panel dark:border-line-dark dark:bg-panel-dark">
        <section className="flex items-center justify-between gap-4 border-b border-line-soft px-4 py-3.5 dark:border-line-soft-dark">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-panel-soft text-muted dark:bg-panel-soft-dark dark:text-muted-dark">
              <HugeiconsIcon icon={AiUserIcon} size={16} color="currentColor" />
            </div>
            <div className="min-w-0">
              <h2 className="m-0 text-sm font-semibold text-ink dark:text-ink-dark">
                Local account
              </h2>
              <p className="m-0 mt-0.5 text-xs text-muted dark:text-muted-dark">
                Profile and sync details will live here later.
              </p>
            </div>
          </div>
          <Button className="min-h-8 rounded-xl px-2.5 text-xs" variant="soft">
            Coming soon
          </Button>
        </section>

        <section className="flex items-center justify-between gap-4 border-b border-line-soft px-4 py-3.5 dark:border-line-soft-dark">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-panel-soft text-muted dark:bg-panel-soft-dark dark:text-muted-dark">
              <HugeiconsIcon icon={theme === "dark" ? Moon02Icon : Sun02Icon} size={16} color="currentColor" />
            </div>
            <div className="min-w-0">
              <h2 className="m-0 text-sm font-semibold text-ink dark:text-ink-dark">
                Appearance
              </h2>
              <p className="m-0 mt-0.5 text-xs text-muted dark:text-muted-dark">
                Choose how Draft looks on this device.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 rounded-xl border border-line bg-panel-soft p-0.5 dark:border-line-dark dark:bg-panel-soft-dark">
            {(["light", "dark"] as const).map((item) => (
              <button
                key={item}
                className={cx(
                  "rounded-[10px] px-2.5 py-1 text-xs font-medium capitalize text-muted transition-colors hover:bg-hover dark:text-muted-dark dark:hover:bg-hover-dark",
                  theme === item &&
                    "bg-panel text-ink dark:bg-panel-dark dark:text-ink-dark",
                )}
                onClick={() => setTheme(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-between gap-4 px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-panel-soft text-muted dark:bg-panel-soft-dark dark:text-muted-dark">
              <HugeiconsIcon icon={Folder01Icon} size={16} color="currentColor" />
            </div>
            <div className="min-w-0">
              <h2 className="m-0 text-sm font-semibold text-ink dark:text-ink-dark">
                Workspace
              </h2>
              <p className="m-0 mt-0.5 text-xs text-muted dark:text-muted-dark">
                Markdown files are stored locally for agent access.
              </p>
            </div>
          </div>
          <code className="max-w-[360px] truncate rounded-xl bg-panel-soft px-2.5 py-1.5 text-xs text-muted dark:bg-panel-soft-dark dark:text-muted-dark">
            {rootPath}
          </code>
        </section>
      </div>
    </Board>
  );
}
