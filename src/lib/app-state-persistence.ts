/**
 * App State Persistence
 *
 * Handles saving and restoring app state (currently open note, view, etc.)
 * Uses localStorage for persistence, following the same pattern as other stores.
 */

const STORAGE_KEY = "usedraft-app-state";

export interface AppState {
  currentNoteId: string | null;
  currentView: string | null;
  parentPath: string[]; // Array of parent IDs from root to direct parent (for expanding hierarchy)
  openTabIds: string[]; // Array of open tab note IDs (for tab persistence)
  activeTabId: string | null; // Active tab ID
}

/**
 * Load app state from localStorage
 */
export function loadAppState(): Partial<AppState> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("[AppState] Failed to load app state:", error);
  }
  return {};
}

/**
 * Save app state to localStorage
 */
export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("[AppState] Failed to save app state:", error);
  }
}

/**
 * Clear saved app state
 */
export function clearAppState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("[AppState] Failed to clear app state:", error);
  }
}
