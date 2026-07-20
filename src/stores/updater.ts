import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { toast } from "sonner";
import { create } from "zustand";
import { shouldShowReleaseNotes } from "@/lib/updateRelease";

type Status = "idle" | "checking" | "available" | "downloading" | "ready" | "error";

interface UpdaterState {
  status: Status;
  version: string | null;
  update: Update | null;
  releaseNotesOpen: boolean;
  /** Look for an update. `silent` swallows "up to date"/failure noise. */
  check: (opts?: { silent?: boolean }) => Promise<void>;
  /** Show feature notes first, or immediately install a fix-only release. */
  requestInstall: () => Promise<void>;
  /** Download + install the pending update, then relaunch. */
  install: () => Promise<void>;
  dismissReleaseNotes: () => void;
}

export const useUpdater = create<UpdaterState>((set, get) => ({
  status: "idle",
  version: null,
  update: null,
  releaseNotesOpen: false,

  check: async ({ silent = true } = {}) => {
    if (get().status === "checking" || get().status === "downloading") return;
    set({
      status: "checking",
      releaseNotesOpen: false,
    });
    try {
      const update = await check();
      if (update) {
        set({
          status: "available",
          version: update.version,
          update,
          releaseNotesOpen: false,
        });
      } else {
        set({
          status: "idle",
          version: null,
          update: null,
          releaseNotesOpen: false,
        });
        if (!silent) toast("You're on the latest version.");
      }
    } catch (err) {
      // Dev builds, offline checks, and missing signatures all land here.
      set({
        status: "error",
        version: null,
        update: null,
        releaseNotesOpen: false,
      });
      if (!silent) {
        toast.error(err instanceof Error ? err.message : "Update check failed.");
      }
    }
  },

  requestInstall: async () => {
    const update = get().update;
    if (!update || get().status !== "available") return;
    if (shouldShowReleaseNotes(update)) {
      set({ releaseNotesOpen: true });
      return;
    }
    await get().install();
  },

  install: async () => {
    const update = get().update;
    if (!update) return;
    set({ status: "downloading" });
    try {
      await update.downloadAndInstall();
      set({ status: "ready" });
      await relaunch();
    } catch (err) {
      set({ status: "available" });
      toast.error(err instanceof Error ? err.message : "Update failed to install.");
    }
  },

  dismissReleaseNotes: () => {
    if (get().status === "available") {
      set({ releaseNotesOpen: false });
    }
  },
}));
