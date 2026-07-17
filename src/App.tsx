import { lazy, Suspense, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { Toaster } from "sonner";
import { closeTab } from "@/components/editor/TabBar";
import { Welcome } from "@/components/welcome/Welcome";
import { initSessionSync, restoreSession } from "@/lib/session";
import { notifyBacklinksChanged } from "@/lib/backlinks";
import { activeDir, useVault } from "@/stores/vault";
import { useUi } from "@/stores/ui";
import { usePins } from "@/stores/pins";
import { useUpdater } from "@/stores/updater";

const AppShell = lazy(() =>
  import("@/components/layout/AppShell").then((module) => ({
    default: module.AppShell,
  })),
);
const loadCommandPalette = () =>
  import("@/components/palette/CommandPalette").then((module) => ({
    default: module.CommandPalette,
  }));
const CommandPalette = lazy(loadCommandPalette);
const SettingsModal = lazy(() =>
  import("@/components/settings/SettingsModal").then((module) => ({
    default: module.SettingsModal,
  })),
);
export default function App() {
  const status = useVault((s) => s.status);
  const root = useVault((s) => s.root);
  const startup = useVault((s) => s.startup);
  const refreshTree = useVault((s) => s.refreshTree);

  useEffect(() => {
    initSessionSync();
    startup();
    void loadCommandPalette();
    // Look for an app update in the background; surfaces in the sidebar.
    useUpdater.getState().check();
  }, [startup]);

  // Restore the saved tabs / view / filters once a vault is loaded (and again
  // whenever the active vault changes).
  useEffect(() => {
    if (status === "ready" && root) restoreSession(root);
  }, [status, root]);

  useEffect(() => {
    if (status === "ready" && root) {
      usePins.getState().clear();
      void usePins.getState().load();
    } else {
      usePins.getState().clear();
    }
  }, [status, root]);

  // Pick up edits made outside the app when the window regains focus.
  useEffect(() => {
    const onFocus = () => refreshTree();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshTree]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let disposed = false;
    void listen("markd:notes-changed", () => {
      void refreshTree();
      notifyBacklinksChanged();
    }).then((stop) => {
      if (disposed) stop();
      else unlisten = stop;
    });
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [refreshTree]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      const ui = useUi.getState();
      const vault = useVault.getState();

      if (event.shiftKey && event.key.toLowerCase() === "y" && vault.status === "ready") {
        event.preventDefault();
        void vault.openDailyNote();
      } else if (
        event.shiftKey &&
        event.key.toLowerCase() === "t" &&
        vault.status === "ready"
      ) {
        event.preventDefault();
        vault.setView({ type: "todos" });
      } else if (
        event.shiftKey &&
        event.key.toLowerCase() === "b" &&
        vault.status === "ready"
      ) {
        event.preventDefault();
        vault.setView({ type: "bookmarks" });
      } else if (event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        vault.cycleTheme();
      } else if (event.key === "k") {
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
      <Suspense fallback={null}>
        {status === "ready" && <AppShell />}
        <CommandPalette />
        <SettingsModal />
      </Suspense>
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
