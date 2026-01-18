import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SunIcon,
  MoonIcon,
  ComputerIcon,
  UserIcon,
  DatabaseSync01Icon,
} from "@hugeicons/core-free-icons";
import { useSettingsStore, type Theme } from "@/stores/settingsStore";
import { Button, Input, ToggleGroup } from "@/components/ui";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { SettingsSidebar, type SettingsSection } from "./SettingsSidebar";

export function Settings() {
  const [selectedSection, setSelectedSection] =
    useState<SettingsSection>("appearance");
  const {
    theme,
    syncEnabled,
    isLoggedIn,
    showBanner,
    setTheme,
    setSyncEnabled,
    setShowBanner,
  } = useSettingsStore();

  const themeOptions: Array<{
    value: Theme;
    icon: React.ReactNode;
    title: string;
  }> = [
    {
      value: "light",
      icon: (
        <HugeiconsIcon
          icon={SunIcon}
          size={18}
          color="currentColor"
          strokeWidth={1.5}
        />
      ),
      title: "Light",
    },
    {
      value: "dark",
      icon: (
        <HugeiconsIcon
          icon={MoonIcon}
          size={18}
          color="currentColor"
          strokeWidth={1.5}
        />
      ),
      title: "Dark",
    },
    {
      value: "system",
      icon: (
        <HugeiconsIcon
          icon={ComputerIcon}
          size={18}
          color="currentColor"
          strokeWidth={1.5}
        />
      ),
      title: "System",
    },
  ];

  const renderContent = () => {
    switch (selectedSection) {
      case "appearance":
        return (
          <section>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Appearance
              </h2>
              <p className="text-sm text-muted-foreground">
                Customize how Draft looks on your device.
              </p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">
                  Theme
                </label>
                <ToggleGroup
                  value={theme}
                  onChange={(value) => setTheme(value as Theme)}
                  options={themeOptions}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">
                  Visual Identity
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        Show Note Banner
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Display visual fingerprint banner above note title
                      </div>
                    </div>
                    <Button
                      variant={showBanner ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => setShowBanner(!showBanner)}
                    >
                      {showBanner ? "On" : "Off"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      case "account":
        return (
          <section>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Account
              </h2>
              <p className="text-sm text-muted-foreground">
                Manage your account settings and preferences.
              </p>
            </div>
            <div className="space-y-4">
              {isLoggedIn ? (
                <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <HugeiconsIcon
                      icon={UserIcon}
                      size={20}
                      color="currentColor"
                      strokeWidth={1.5}
                      className="text-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">
                      Logged in
                    </div>
                    <div className="text-xs text-muted-foreground">
                      user@example.com
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      useSettingsStore.setState({ isLoggedIn: false });
                    }}
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-card border border-border rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <HugeiconsIcon
                        icon={UserIcon}
                        size={20}
                        color="currentColor"
                        strokeWidth={1.5}
                        className="text-muted-foreground"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">
                        Not logged in
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Sign in to sync your notes across devices
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Input
                      type="email"
                      placeholder="Email"
                      disabled
                      className="opacity-50"
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      disabled
                      className="opacity-50"
                    />
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => {
                        useSettingsStore.setState({ isLoggedIn: true });
                      }}
                    >
                      Sign In
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>
        );

      case "keyboard":
        return (
          <section>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Keyboard Shortcuts
              </h2>
              <p className="text-sm text-muted-foreground">
                Customize keyboard shortcuts to speed up your workflow.
              </p>
            </div>
            <KeyboardShortcuts />
          </section>
        );

      case "sync":
        return (
          <section>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Sync
              </h2>
              <p className="text-sm text-muted-foreground">
                Manage synchronization settings for your notes.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <HugeiconsIcon
                      icon={DatabaseSync01Icon}
                      size={20}
                      color="currentColor"
                      strokeWidth={1.5}
                      className="text-primary"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      Sync enabled
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {syncEnabled
                        ? "Your notes are being synced"
                        : "Enable sync to keep your notes backed up"}
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncEnabled}
                    onChange={(e) => setSyncEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <SettingsSidebar
        selectedSection={selectedSection}
        onSectionChange={setSelectedSection}
      />
      <div className="flex-1 overflow-y-auto p-8 min-h-0">
        <div className="max-w-2xl">{renderContent()}</div>
      </div>
    </div>
  );
}
