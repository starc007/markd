import {
  FolderOpen,
  Monitor,
  Moon,
  RefreshCw,
  Settings,
  Sun,
  X,
} from "lucide-react";
import type { Theme } from "@/lib/types";
import { cx } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useUi } from "@/stores/ui";
import { useUpdater } from "@/stores/updater";
import { useVault } from "@/stores/vault";

const THEMES: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

const SHORTCUTS: Array<{ label: string; keys: string[] }> = [
  { label: "Command palette", keys: ["⌘", "K"] },
  { label: "New note", keys: ["⌘", "N"] },
  { label: "Toggle sidebar", keys: ["⌘", "\\"] },
  { label: "Cycle theme", keys: ["⌘", "⇧", "D"] },
  { label: "Settings", keys: ["⌘", ","] },
  { label: "Close tab", keys: ["⌘", "W"] },
];

export function SettingsModal() {
  const open = useUi((s) => s.settingsOpen);
  const setOpen = useUi((s) => s.setSettingsOpen);
  const theme = useVault((s) => s.theme);
  const setTheme = useVault((s) => s.setTheme);
  const root = useVault((s) => s.root);
  const chooseVault = useVault((s) => s.chooseVault);
  const updateStatus = useUpdater((s) => s.status);
  const updateVersion = useUpdater((s) => s.version);
  const checkUpdate = useUpdater((s) => s.check);
  const installUpdate = useUpdater((s) => s.install);

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      ariaLabel="Settings"
      className="w-[460px]"
    >
      <header className="flex items-center gap-3 border-b border-line-soft px-5 py-4">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-invert text-invert-ink">
          <Settings size={15} strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
            Settings
          </h2>
          <p className="mt-0.5 text-[11.5px] text-faint">
            Appearance, vault, updates, and shortcuts
          </p>
        </div>
        <button
          type="button"
          aria-label="Close settings"
          onClick={() => setOpen(false)}
          className="ml-auto grid h-8 w-8 place-items-center rounded-md text-faint transition-colors hover:bg-hover hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <X size={15} strokeWidth={2} />
        </button>
      </header>

      <div className="page-scroll max-h-[min(620px,calc(100vh-96px))] px-5 pb-5">
        <section className="pt-5">
          <div className="flex items-center justify-between">
            <Label>Appearance</Label>
            <span className="text-[11px] text-faint">
              <Kbd>⌘</Kbd>
              <Kbd>⇧</Kbd>
              <Kbd>D</Kbd> to cycle
            </span>
          </div>
          <div
            role="group"
            aria-label="Theme"
            className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-panel p-1"
          >
            {THEMES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={theme === value}
                className={cx(
                  "flex flex-col items-center gap-1.5 rounded-lg py-2.5 text-[12.5px] font-medium transition-colors duration-100",
                  theme === value
                    ? "bg-invert text-invert-ink"
                    : "text-muted hover:bg-hover hover:text-ink",
                )}
                onClick={() => setTheme(value)}
              >
                <Icon size={16} strokeWidth={1.75} />
                {label}
              </button>
            ))}
          </div>
        </section>

      <section className="mt-5">
        <Label>Vault</Label>
        <div className="mt-2 flex items-center gap-2">
          <p
            className="min-w-0 flex-1 truncate rounded-lg border border-line-soft bg-panel px-3 py-2 font-mono text-[11.5px] text-muted"
            title={root}
          >
            {root}
          </p>
          <Button variant="outline" size="sm" onClick={chooseVault} className="shrink-0">
            <FolderOpen size={13.5} strokeWidth={1.75} />
            Change
          </Button>
        </div>
      </section>

      <section className="mt-5">
        <Label>Updates</Label>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p
            aria-live="polite"
            className="min-w-0 truncate text-[12.5px] text-muted"
          >
            {updateStatus === "available"
              ? `Version ${updateVersion} is available`
              : updateStatus === "downloading" || updateStatus === "ready"
                ? "Installing…"
                : updateStatus === "checking"
                  ? "Checking…"
                  : "You're on the latest version"}
          </p>
          {updateStatus === "available" ? (
            <Button variant="outline" size="sm" onClick={installUpdate} className="shrink-0">
              Install &amp; restart
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => checkUpdate({ silent: false })}
              disabled={updateStatus === "checking" || updateStatus === "downloading"}
              className="shrink-0"
            >
              <RefreshCw size={13} strokeWidth={1.75} />
              Check
            </Button>
          )}
        </div>
      </section>

      <section className="mt-5">
        <Label>Keyboard shortcuts</Label>
        <div className="mt-2 overflow-hidden rounded-xl border border-line-soft">
          {SHORTCUTS.map((shortcut, i) => (
            <div
              key={shortcut.label}
              className={cx(
                "flex items-center justify-between px-3 py-2 text-[13px] text-muted",
                i > 0 && "border-t border-line-soft",
              )}
            >
              <span>{shortcut.label}</span>
              <span className="flex items-center gap-1">
                {shortcut.keys.map((k, j) => (
                  <Kbd key={j}>{k}</Kbd>
                ))}
              </span>
            </div>
          ))}
        </div>
      </section>

        <p className="mt-6 text-center text-[11px] text-faint">
          Markd · notes as plain markdown, on your disk
        </p>
      </div>
    </Modal>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
      {children}
    </h3>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-grid h-5 min-w-5 place-items-center rounded border border-line bg-bg px-1 font-mono text-[10.5px] text-muted">
      {children}
    </kbd>
  );
}
