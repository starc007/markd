import { FolderOpen, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import type { Theme } from "@/lib/types";
import { Tooltip } from "@/components/ui/Tooltip";
import { cx } from "@/lib/utils";
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

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-80 grid place-items-center bg-black/20 dark:bg-black/45"
          onMouseDown={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.985, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.985, y: 6 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="w-[420px] max-w-[calc(100vw-48px)] rounded-xl border border-line bg-bg p-5 shadow-2xl shadow-black/20 dark:shadow-black/60"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-semibold tracking-[-0.01em]">
                Settings
              </h2>
              <Tooltip label="Close" side="left">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-7 w-7 place-items-center rounded-md text-faint transition-colors hover:bg-hover hover:text-ink"
                >
                  <X size={15} strokeWidth={2} />
                </button>
              </Tooltip>
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
                <button
                  type="button"
                  onClick={chooseVault}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[12.5px] font-medium text-ink transition-colors hover:bg-hover"
                >
                  <FolderOpen size={13.5} strokeWidth={1.75} />
                  Change
                </button>
              </div>
            </section>

            <p className="mt-6 text-center text-[11px] text-faint">
              Draft · notes as plain markdown, on your disk
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
      {children}
    </h3>
  );
}
