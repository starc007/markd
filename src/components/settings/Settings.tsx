import { HugeiconsIcon } from "@hugeicons/react";
import {
  SunIcon,
  MoonIcon,
  ComputerIcon,
  UserIcon,
  DatabaseSync01Icon,
  ArrowLeft02Icon,
} from "@hugeicons/core-free-icons";
import { useSettingsStore, type Theme } from "../../stores/settingsStore";
import { useNoteStore } from "../../stores/noteStore";
import { Button, Input, ToggleGroup } from "../ui";

export function Settings() {
  const { theme, syncEnabled, isLoggedIn, setTheme, setSyncEnabled } =
    useSettingsStore();
  const { setSettingsOpen } = useNoteStore();

  const handleBack = () => {
    setSettingsOpen(false);
  };

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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div
        className="h-[50px] shrink-0 flex items-center gap-3 border-b border-sidebar-border px-4"
        data-tauri-drag-region
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="[-webkit-app-region:no-drag]"
        >
          <HugeiconsIcon
            icon={ArrowLeft02Icon}
            size={18}
            color="currentColor"
            strokeWidth={1.5}
          />
          Back
        </Button>
        <span className="font-medium text-foreground [-webkit-app-region:no-drag]">
          Settings
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[700px] mx-auto px-8 py-8 space-y-8">
          {/* Theme Section */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Appearance
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Theme
                </label>
                <ToggleGroup
                  value={theme}
                  onChange={(value) => setTheme(value as Theme)}
                  options={themeOptions}
                />
              </div>
            </div>
          </section>

          {/* Account Section */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Account
            </h2>
            <div className="space-y-4">
              {isLoggedIn ? (
                <div className="space-y-3">
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
                        // UI only - no functionality
                        useSettingsStore.setState({ isLoggedIn: false });
                      }}
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
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
                          // UI only - no functionality
                          useSettingsStore.setState({ isLoggedIn: true });
                        }}
                      >
                        Sign In
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Sync Section */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Sync</h2>
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
        </div>
      </div>
    </div>
  );
}
