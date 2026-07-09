import { FolderOpen, Monitor, Moon, Sun, X } from "lucide-react";
import type { Theme } from "@/lib/types";
import { cx } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useUi } from "@/stores/ui";
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

  return (
    <Modal open={open} onClose={() => setOpen(false)} className="w-[440px] p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold tracking-[-0.01em]">Settings</h2>
        <button
          type="button"
          aria-label="Close settings"
          onClick={() => setOpen(false)}
          className="grid h-7 w-7 place-items-center rounded-md text-faint transition-colors hover:bg-hover hover:text-ink"
        >
          <X size={15} strokeWidth={2} />
        </button>
      </div>

      <section className="mt-5">
        <div className="flex items-center justify-between">
          <Label>Appearance</Label>
          <span className="text-[11px] text-faint">
            <Kbd>⌘</Kbd>
            <Kbd>⇧</Kbd>
            <Kbd>D</Kbd> to cycle
          </span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-panel p-1">
          {THEMES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
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
