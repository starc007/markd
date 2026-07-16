import {
  Cloud,
  Keyboard,
  Palette,
  Settings,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import {
  AppearanceSettings,
  CloudSettings,
  GeneralSettings,
  ShortcutSettings,
} from "@/components/settings/SettingsPanels";
import { Modal } from "@/components/ui/Modal";
import { EASE_OUT } from "@/lib/ease";
import { cx } from "@/lib/utils";
import { useUi } from "@/stores/ui";

type SettingsPage = "general" | "cloud" | "appearance" | "shortcuts";

const PAGES: Array<{
  id: SettingsPage;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    id: "general",
    label: "General",
    description: "Vault and updates",
    icon: SlidersHorizontal,
  },
  {
    id: "cloud",
    label: "Markd Cloud",
    description: "Account, publishing, and sync",
    icon: Cloud,
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "Theme and display",
    icon: Palette,
  },
  {
    id: "shortcuts",
    label: "Shortcuts",
    description: "Keyboard reference",
    icon: Keyboard,
  },
];

const PAGE_CONTENT: Record<SettingsPage, React.ComponentType> = {
  general: GeneralSettings,
  cloud: CloudSettings,
  appearance: AppearanceSettings,
  shortcuts: ShortcutSettings,
};

export function SettingsModal() {
  const open = useUi((state) => state.settingsOpen);
  const setOpen = useUi((state) => state.setSettingsOpen);
  const [page, setPage] = useState<SettingsPage>("general");
  const current = PAGES.find((item) => item.id === page) ?? PAGES[0];
  const PageContent = PAGE_CONTENT[page];

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      ariaLabel="Settings"
      className="h-[520px] w-[720px]"
    >
      <div className="flex h-full min-h-0">
        <aside className="flex w-[196px] shrink-0 flex-col border-r border-line-soft">
          <div className="flex items-center gap-2.5 px-4 pb-3 pt-4">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-panel text-muted">
              <Settings size={15} strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold tracking-[-0.01em]">
                Settings
              </h2>
              <p className="mt-0.5 text-[10.5px] text-faint">Markd preferences</p>
            </div>
          </div>

          <nav aria-label="Settings sections" className="space-y-1 px-2.5 py-2">
            {PAGES.map(({ id, label, icon: Icon }) => {
              const active = page === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => setPage(id)}
                  className={cx(
                    "flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[12.5px] font-medium transition-colors duration-100",
                    active
                      ? "bg-hover text-primary"
                      : "text-muted hover:bg-hover hover:text-ink",
                  )}
                >
                  <Icon size={14.5} strokeWidth={1.8} />
                  {label}
                </button>
              );
            })}
          </nav>

          <p className="mt-auto px-4 pb-4 text-[10.5px] leading-4 text-faint">
            Notes as plain markdown,
            <br />
            stored on your disk.
          </p>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-bg">
          <header className="flex h-[65px] shrink-0 items-center border-b border-line-soft px-5">
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em]">
                {current.label}
              </h3>
              <p className="mt-0.5 text-[11.5px] text-faint">
                {current.description}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close settings"
              onClick={() => setOpen(false)}
              className="ml-auto grid h-8 w-8 place-items-center rounded-md text-faint transition-colors duration-100 hover:bg-hover hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <X size={15} strokeWidth={2} />
            </button>
          </header>

          <div className="relative min-h-0 flex-1 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={page}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.12, ease: EASE_OUT }}
                className="page-scroll absolute inset-0 overflow-y-auto px-6 py-5"
              >
                <PageContent />
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </div>
    </Modal>
  );
}
