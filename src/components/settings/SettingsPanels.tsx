import { FolderOpen, Monitor, Moon, RefreshCw, Sun } from "lucide-react";
import type { Theme } from "@/lib/types";
import { cx } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useUpdater } from "@/stores/updater";
import { useVault } from "@/stores/vault";

const THEMES: Array<{
  value: Theme;
  label: string;
  description: string;
  icon: typeof Sun;
}> = [
  {
    value: "system",
    label: "System",
    description: "Match macOS",
    icon: Monitor,
  },
  {
    value: "light",
    label: "Light",
    description: "Bright canvas",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Low light",
    icon: Moon,
  },
];

const SHORTCUTS: Array<{ label: string; keys: string[] }> = [
  { label: "Command palette", keys: ["⌘", "K"] },
  { label: "New note", keys: ["⌘", "N"] },
  { label: "Quick capture", keys: ["⌃", "⇧", "Space"] },
  { label: "Today's note", keys: ["⌘", "⇧", "Y"] },
  { label: "Toggle sidebar", keys: ["⌘", "\\"] },
  { label: "Cycle theme", keys: ["⌘", "⇧", "D"] },
  { label: "Settings", keys: ["⌘", ","] },
  { label: "Close tab", keys: ["⌘", "W"] },
];

export function GeneralSettings() {
  const root = useVault((state) => state.root);
  const chooseVault = useVault((state) => state.chooseVault);
  const updateStatus = useUpdater((state) => state.status);
  const updateVersion = useUpdater((state) => state.version);
  const checkUpdate = useUpdater((state) => state.check);
  const installUpdate = useUpdater((state) => state.install);

  const updateCopy =
    updateStatus === "available"
      ? `Version ${updateVersion} is available`
      : updateStatus === "downloading" || updateStatus === "ready"
        ? "Installing…"
        : updateStatus === "checking"
          ? "Checking for updates…"
          : "You're on the latest version";

  return (
    <div className="space-y-6">
      <SettingsGroup
        title="Vault"
        description="The folder Markd uses for notes and local app data."
      >
        <div className="flex items-center gap-3 rounded-xl bg-panel p-3">
          <p
            title={root}
            className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-muted"
          >
            {root}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={chooseVault}
            className="shrink-0 bg-bg"
          >
            <FolderOpen size={13.5} strokeWidth={1.75} />
            Change
          </Button>
        </div>
      </SettingsGroup>

      <SettingsGroup
        title="Software updates"
        description="Keep Markd current with the latest fixes and improvements."
      >
        <div className="flex items-center justify-between gap-4 rounded-xl bg-panel p-3">
          <p aria-live="polite" className="min-w-0 text-[12.5px] text-muted">
            {updateCopy}
          </p>
          {updateStatus === "available" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={installUpdate}
              className="shrink-0 bg-bg"
            >
              Install &amp; restart
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => checkUpdate({ silent: false })}
              disabled={
                updateStatus === "checking" || updateStatus === "downloading"
              }
              className="shrink-0 bg-bg"
            >
              <RefreshCw
                size={13}
                strokeWidth={1.75}
                className={updateStatus === "checking" ? "animate-spin" : undefined}
              />
              Check
            </Button>
          )}
        </div>
      </SettingsGroup>
    </div>
  );
}

export function AppearanceSettings() {
  const theme = useVault((state) => state.theme);
  const setTheme = useVault((state) => state.setTheme);

  return (
    <SettingsGroup
      title="Theme"
      description="Choose how Markd looks across the editor and navigation."
      aside={
        <span className="flex items-center text-[10.5px] text-faint">
          <Kbd>⌘</Kbd>
          <Kbd>⇧</Kbd>
          <Kbd>D</Kbd>
          <span className="ml-1.5">to cycle</span>
        </span>
      }
    >
      <div role="group" aria-label="Theme" className="grid grid-cols-3 gap-2">
        {THEMES.map(({ value, label, description, icon: Icon }) => {
          const active = theme === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => setTheme(value)}
              className={cx(
                "flex min-h-24 flex-col items-start rounded-xl p-3 text-left transition-colors duration-100",
                active
                  ? "bg-invert text-invert-ink"
                  : "bg-panel text-muted hover:bg-hover hover:text-ink",
              )}
            >
              <Icon size={17} strokeWidth={1.7} />
              <span className="mt-auto text-[12.5px] font-semibold">{label}</span>
              <span
                className={cx(
                  "mt-0.5 text-[10.5px]",
                  active ? "text-invert-ink/65" : "text-faint",
                )}
              >
                {description}
              </span>
            </button>
          );
        })}
      </div>
    </SettingsGroup>
  );
}

export function ShortcutSettings() {
  return (
    <SettingsGroup
      title="Keyboard shortcuts"
      description="Fast ways to move through Markd without leaving the keyboard."
    >
      <div className="overflow-hidden rounded-xl bg-panel">
        {SHORTCUTS.map((shortcut, index) => (
          <div
            key={shortcut.label}
            className={cx(
              "flex min-h-10 items-center justify-between gap-4 px-3.5 py-2 text-[12.5px] text-muted",
              index > 0 && "border-t border-line-soft",
            )}
          >
            <span>{shortcut.label}</span>
            <span className="flex shrink-0 items-center gap-1">
              {shortcut.keys.map((key, keyIndex) => (
                <Kbd key={`${shortcut.label}-${keyIndex}`}>{key}</Kbd>
              ))}
            </span>
          </div>
        ))}
      </div>
    </SettingsGroup>
  );
}

function SettingsGroup({
  title,
  description,
  aside,
  children,
}: {
  title: string;
  description: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex min-h-10 items-start justify-between gap-4">
        <div>
          <h4 className="text-[12.5px] font-semibold text-ink">{title}</h4>
          <p className="mt-1 text-[11.5px] leading-4 text-faint">{description}</p>
        </div>
        {aside}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-grid h-5 min-w-5 place-items-center rounded border border-line bg-bg px-1 font-mono text-[10.5px] text-muted">
      {children}
    </kbd>
  );
}
