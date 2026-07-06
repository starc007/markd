import { FolderOpen, X } from "lucide-react";
import type { Theme } from "@/lib/types";
import { cx } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useUi } from "@/stores/ui";
import { useVault } from "@/stores/vault";

const THEMES: Array<{ value: Theme; label: string }> = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function SettingsModal() {
  const open = useUi((s) => s.settingsOpen);
  const setOpen = useUi((s) => s.setSettingsOpen);
  const theme = useVault((s) => s.theme);
  const setTheme = useVault((s) => s.setTheme);
  const root = useVault((s) => s.root);
  const chooseVault = useVault((s) => s.chooseVault);

  return (
    <Modal open={open} onClose={() => setOpen(false)} className="w-[420px] p-5">
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
        <Label>Appearance</Label>
        <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg bg-panel p-1">
          {THEMES.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cx(
                "rounded-md py-1.5 text-[13px] font-medium transition-colors duration-100",
                theme === option.value
                  ? "bg-invert text-invert-ink"
                  : "text-muted hover:text-ink",
              )}
              onClick={() => setTheme(option.value)}
            >
              {option.label}
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

      <p className="mt-6 text-center text-[11px] text-faint">
        Draft · notes as plain markdown, on your disk
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
