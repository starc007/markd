import { create } from "zustand";
import type { Update } from "../lib/tauri/update";

/**
 * Update state management store
 *
 * Manages the state of app updates including:
 * - Update availability
 * - Download progress
 * - Installation status
 */
export type UpdateStatus =
  | "idle" // No update check performed yet
  | "checking" // Currently checking for updates
  | "available" // Update is available
  | "downloading" // Update is being downloaded
  | "ready" // Update is downloaded and ready to install
  | "error"; // Error occurred during update process

interface UpdateStore {
  // State
  status: UpdateStatus;
  update: Update | null;
  currentVersion: string;
  error: string | null;
  downloadProgress: number; // 0-100
  lastChecked: number | null; // Timestamp of last check

  // Actions
  setStatus: (status: UpdateStatus) => void;
  setUpdate: (update: Update | null) => void;
  setCurrentVersion: (version: string) => void;
  setError: (error: string | null) => void;
  setDownloadProgress: (progress: number) => void;
  setLastChecked: (timestamp: number) => void;
  reset: () => void;
}

const initialState = {
  status: "idle" as UpdateStatus,
  update: null,
  currentVersion: "0.1.0",
  error: null,
  downloadProgress: 0,
  lastChecked: null,
};

export const useUpdateStore = create<UpdateStore>((set) => ({
  ...initialState,

  setStatus: (status) => set({ status }),
  setUpdate: (update) => set({ update }),
  setCurrentVersion: (version) => set({ currentVersion: version }),
  setError: (error) => set({ error }),
  setDownloadProgress: (progress) => set({ downloadProgress: progress }),
  setLastChecked: (timestamp) => set({ lastChecked: timestamp }),
  reset: () => set(initialState),
}));
