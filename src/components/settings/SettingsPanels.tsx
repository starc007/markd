import {
  Check,
  FolderOpen,
  Globe2,
  Monitor,
  Moon,
  RefreshCw,
  Sun,
} from "lucide-react";
import { useState } from "react";
import type { CloudAccount, Theme } from "@/lib/types";
import { cx, isMac } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { CloudAccountCard } from "@/components/settings/CloudAccountCard";
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
    description: "Match your system",
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

function shortcuts(mac: boolean): Array<{ label: string; keys: string[] }> {
  const mod = mac ? "⌘" : "Ctrl";
  const shift = mac ? "⇧" : "Shift";
  const control = mac ? "⌃" : "Ctrl";

  return [
    { label: "Command palette", keys: [mod, "K"] },
    { label: "Find in note", keys: [mod, "F"] },
    { label: "New note", keys: [mod, "N"] },
    { label: "Quick capture", keys: [control, shift, "Space"] },
    { label: "Today's note", keys: [mod, shift, "Y"] },
    { label: "Open Todos", keys: [mod, shift, "T"] },
    { label: "Open Bookmarks", keys: [mod, shift, "B"] },
    { label: "Toggle sidebar", keys: [mod, "\\"] },
    { label: "Cycle theme", keys: [mod, shift, "D"] },
    { label: "Settings", keys: [mod, ","] },
    { label: "Close tab", keys: [mod, "W"] },
  ];
}

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

export function CloudSettings() {
  const [account, setAccount] = useState<CloudAccount | null>(null);

  return (
    <div className="space-y-6">
      <SettingsGroup
        title="Account"
        description="Sign in once to manage public pages and future synced devices."
      >
        <CloudAccountCard onAccountChange={setAccount} />
      </SettingsGroup>

      <SettingsGroup
        title="Plans"
        description="Start free. Upgrade only when you need more publishing or sync."
      >
        <div className="grid grid-cols-2 gap-2">
          <PlanCard
            name="Free"
            price="$0"
            description="For trying public pages"
            features={["1 active published note", "Local notes stay unlimited"]}
            active={account?.plan === "free"}
          />
          <PlanCard
            name="Markd Cloud"
            price="$6/mo yearly"
            description="$8 when billed monthly"
            features={["Unlimited publishing", "Cross-device sync"]}
            active={account?.plan === "cloud"}
          />
        </div>
        <p className="mt-2.5 flex items-center gap-1.5 text-[10.5px] text-faint">
          <Globe2 size={11.5} strokeWidth={1.7} />
          Publishing is being built first. Sync will follow.
        </p>
      </SettingsGroup>
    </div>
  );
}

export function AppearanceSettings() {
  const theme = useVault((state) => state.theme);
  const setTheme = useVault((state) => state.setTheme);
  const mod = isMac() ? "⌘" : "Ctrl";
  const shift = isMac() ? "⇧" : "Shift";

  return (
    <SettingsGroup
      title="Theme"
      description="Choose how Markd looks across the editor and navigation."
      aside={
        <span className="flex items-center text-[10.5px] text-faint">
          <Kbd>{mod}</Kbd>
          <Kbd>{shift}</Kbd>
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
  const platformShortcuts = shortcuts(isMac());

  return (
    <SettingsGroup
      title="Keyboard shortcuts"
      description="Fast ways to move through Markd without leaving the keyboard."
    >
      <div className="overflow-hidden rounded-xl bg-panel">
        {platformShortcuts.map((shortcut, index) => (
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

function PlanCard({
  name,
  price,
  description,
  features,
  active,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  active: boolean;
}) {
  return (
    <div
      className={cx(
        "relative min-h-[142px] rounded-xl border p-3.5",
        active ? "border-ink bg-bg" : "border-line-soft bg-panel",
      )}
    >
      {active && (
        <span className="absolute right-3 top-3 rounded-full bg-invert px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-invert-ink">
          Current
        </span>
      )}
      <p className="text-[12px] font-semibold text-ink">{name}</p>
      <p className="mt-2 text-[13px] font-semibold tracking-[-0.01em] text-ink">
        {price}
      </p>
      <p className="mt-0.5 text-[10px] text-faint">{description}</p>
      <ul className="mt-3 space-y-1.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-1.5 text-[10.5px] text-muted">
            <Check size={11} strokeWidth={2} />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-grid h-5 min-w-5 place-items-center rounded border border-line bg-bg px-1 font-mono text-[10.5px] text-muted">
      {children}
    </kbd>
  );
}
