import { useEffect } from "react";
import { Toaster } from "sonner";
import { closeTab } from "@/components/editor/TabBar";
import { AppShell } from "@/components/layout/AppShell";
import { CommandPalette } from "@/components/palette/CommandPalette";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { Welcome } from "@/components/welcome/Welcome";
import { activeDir, useVault } from "@/stores/vault";
import { useUi } from "@/stores/ui";

export default function App() {
  const status = useVault((s) => s.status);
  const startup = useVault((s) => s.startup);
  const refreshTree = useVault((s) => s.refreshTree);

  useEffect(() => {
    startup();
  }, [startup]);

  // Pick up edits made outside the app when the window regains focus.
  useEffect(() => {
    const onFocus = () => refreshTree();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshTree]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      const ui = useUi.getState();
      const vault = useVault.getState();

      if (event.key === "k") {
        event.preventDefault();
        ui.setPaletteOpen(!ui.paletteOpen);
      } else if (event.key === "n" && vault.status === "ready") {
        event.preventDefault();
        vault.createNote(activeDir(vault));
      } else if (event.key === "\\") {
        event.preventDefault();
        ui.toggleSidebar();
      } else if (event.key === ",") {
        event.preventDefault();
        ui.setSettingsOpen(true);
      } else if (event.key === "w" && vault.view?.type === "note") {
        event.preventDefault();
        closeTab(vault.view.rel);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      {status === "welcome" && <Welcome />}
      {status === "ready" && <AppShell />}
      <CommandPalette />
      <SettingsModal />
      <Toaster
        position="top-right"
        gap={8}
        offset={16}
        toastOptions={{
          style: {
            background: "var(--panel)",
            color: "var(--ink)",
            border: "1px solid var(--line)",
            fontSize: "13px",
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          },
        }}
      />
    </>
  );
}
