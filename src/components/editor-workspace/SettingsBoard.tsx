import { Settings02Icon } from "@hugeicons/core-free-icons";
import { Button, cx } from "@/components/ui";
import { useWorkspaceStore } from "@/stores/workspace";
import { Board } from "./Board";

export function SettingsBoard() {
  const theme = useWorkspaceStore((state) => state.theme);
  const setTheme = useWorkspaceStore((state) => state.setTheme);
  const rootPath = useWorkspaceStore((state) => state.rootPath);

  return (
    <Board title="Settings" icon={Settings02Icon}>
      <div className="grid max-w-[760px] gap-8">
        <section className="grid gap-3">
          <div>
            <h2 className="m-0 text-base font-semibold">Account</h2>
            <p className="m-0 mt-1 text-sm text-muted dark:text-muted-dark">
              Profile and sync details will live here later.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-panel-soft p-4 dark:border-line-dark dark:bg-panel-soft-dark">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium">Local account</div>
                <div className="mt-1 text-sm text-muted dark:text-muted-dark">
                  Not connected
                </div>
              </div>
              <Button variant="soft">Coming soon</Button>
            </div>
          </div>
        </section>

        <section className="grid gap-3">
          <div>
            <h2 className="m-0 text-base font-semibold">Appearance</h2>
            <p className="m-0 mt-1 text-sm text-muted dark:text-muted-dark">
              Choose how Draft looks on this device.
            </p>
          </div>
          <div className="flex w-fit rounded-2xl border border-line bg-panel-soft p-1 dark:border-line-dark dark:bg-panel-soft-dark">
            {(["light", "dark"] as const).map((item) => (
              <button
                key={item}
                className={cx(
                  "rounded-xl px-3 py-1.5 text-sm font-medium capitalize text-muted transition-colors hover:bg-hover dark:text-muted-dark dark:hover:bg-hover-dark",
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

        <section className="grid gap-3">
          <div>
            <h2 className="m-0 text-base font-semibold">Workspace</h2>
            <p className="m-0 mt-1 text-sm text-muted dark:text-muted-dark">
              Notes are stored as Markdown files for agent access.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-panel-soft p-4 text-sm text-muted dark:border-line-dark dark:bg-panel-soft-dark dark:text-muted-dark">
            {rootPath}
          </div>
        </section>
      </div>
    </Board>
  );
}
