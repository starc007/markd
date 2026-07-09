import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { toast } from "sonner";
import { create } from "zustand";

type Status = "idle" | "checking" | "available" | "downloading" | "ready" | "error";

interface UpdaterState {
  status: Status;
  version: string | null;
  update: Update | null;
  /** Look for an update. `silent` swallows "up to date"/failure noise. */
  check: (opts?: { silent?: boolean }) => Promise<void>;
  /** Download + install the pending update, then relaunch. */
  install: () => Promise<void>;
}

export const useUpdater = create<UpdaterState>((set, get) => ({
  status: "idle",
  version: null,
  update: null,

  check: async ({ silent = true } = {}) => {
    if (get().status === "checking" || get().status === "downloading") return;
    set({ status: "checking" });
    try {
      const update = await check();
      if (update) {
        set({ status: "available", version: update.version, update });
      } else {
        set({ status: "idle", version: null, update: null });
        if (!silent) toast("You're on the latest version.");
      }
    } catch (err) {
      // Dev builds / offline / no signature all land here — stay quiet.
      set({ status: "error" });
      if (!silent) {
        toast.error(err instanceof Error ? err.message : "Update check failed.");
      }
    }
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
}));
