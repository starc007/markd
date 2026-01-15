import { create } from "zustand";
import * as commands from "../lib/tauri/commands";

export interface Tab {
  id: string; // Note ID
  title: string;
  content: string; // TipTap JSON
  updatedAt: number;
  isDirty?: boolean; // Has unsaved changes
}

interface TabStore {
  // State
  openTabs: Tab[];
  activeTabId: string | null;
  closedTabs: Tab[]; // Recently closed tabs (for Cmd+Shift+T)

  // Actions
  openTab: (noteId: string) => Promise<void>;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  reopenClosedTab: () => Promise<void>;
  closeAllTabs: () => void;
  closeOtherTabs: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  updateTabTitle: (tabId: string, title: string) => void;
  setTabDirty: (tabId: string, isDirty: boolean) => void;
  getActiveTab: () => Tab | null;
  getTab: (tabId: string) => Tab | null;
}

const MAX_TABS = 20;

export const useTabStore = create<TabStore>((set, get) => ({
  // Initial state
  openTabs: [],
  activeTabId: null,
  closedTabs: [],

  // Get active tab
  getActiveTab: () => {
    const { openTabs, activeTabId } = get();
    if (!activeTabId) return null;
    return openTabs.find((tab) => tab.id === activeTabId) || null;
  },

  // Get tab by ID
  getTab: (tabId: string) => {
    const { openTabs } = get();
    return openTabs.find((tab) => tab.id === tabId) || null;
  },

  // Open a note in a new tab (or switch if already open)
  openTab: async (noteId: string) => {
    const { openTabs } = get();

    // Check if tab is already open
    const existingTab = openTabs.find((tab) => tab.id === noteId);
    if (existingTab) {
      // Switch to existing tab
      set({ activeTabId: noteId });
      return;
    }

    // Check tab limit
    if (openTabs.length >= MAX_TABS) {
      console.warn(`Tab limit (${MAX_TABS}) reached. Cannot open more tabs.`);
      // Could show a toast here
      return;
    }

    // Load note from backend
    try {
      const note = await commands.getNote(noteId);
      if (!note) {
        console.error(`Note ${noteId} not found`);
        return;
      }

      const newTab: Tab = {
        id: note.id,
        title: note.title,
        content: note.content,
        updatedAt: note.updated_at,
        isDirty: false,
      };

      // Add to open tabs and make it active
      set({
        openTabs: [...openTabs, newTab],
        activeTabId: noteId,
      });
    } catch (error) {
      console.error(`Failed to open tab for note ${noteId}:`, error);
    }
  },

  // Close a tab
  closeTab: (tabId: string) => {
    const { openTabs, activeTabId, closedTabs } = get();
    const tabToClose = openTabs.find((tab) => tab.id === tabId);
    if (!tabToClose) return;

    // Remove from open tabs
    const newOpenTabs = openTabs.filter((tab) => tab.id !== tabId);

    // Add to closed tabs (for reopening)
    const newClosedTabs = [tabToClose, ...closedTabs].slice(0, 10); // Keep last 10 closed tabs

    // Determine new active tab
    let newActiveTabId: string | null = null;
    if (activeTabId === tabId) {
      // Closing the active tab - switch to next or previous
      const currentIndex = openTabs.findIndex((tab) => tab.id === tabId);
      if (newOpenTabs.length > 0) {
        // Switch to next tab if available, otherwise previous
        if (currentIndex < newOpenTabs.length) {
          newActiveTabId = newOpenTabs[currentIndex].id;
        } else {
          newActiveTabId = newOpenTabs[newOpenTabs.length - 1].id;
        }
      }
    } else {
      // Not closing active tab, keep current active
      newActiveTabId = activeTabId;
    }

    set({
      openTabs: newOpenTabs,
      activeTabId: newActiveTabId,
      closedTabs: newClosedTabs,
    });
  },

  // Switch to a tab
  switchTab: (tabId: string) => {
    const { openTabs } = get();
    const tab = openTabs.find((tab) => tab.id === tabId);
    if (tab) {
      set({ activeTabId: tabId });
    }
  },

  // Reopen most recently closed tab
  reopenClosedTab: async () => {
    const { closedTabs } = get();
    if (closedTabs.length === 0) return;

    const tabToReopen = closedTabs[0];
    const { openTab } = get();

    // Remove from closed tabs
    set({
      closedTabs: closedTabs.slice(1),
    });

    // Open the tab (will switch if already open)
    await openTab(tabToReopen.id);
  },

  // Close all tabs
  closeAllTabs: () => {
    const { openTabs, closedTabs } = get();
    const newClosedTabs = [
      ...openTabs.reverse(), // Most recently closed first
      ...closedTabs,
    ].slice(0, 10);

    set({
      openTabs: [],
      activeTabId: null,
      closedTabs: newClosedTabs,
    });
  },

  // Close all tabs except specified one
  closeOtherTabs: (tabId: string) => {
    const { openTabs, closedTabs } = get();
    const tabToKeep = openTabs.find((tab) => tab.id === tabId);
    if (!tabToKeep) return;

    const tabsToClose = openTabs.filter((tab) => tab.id !== tabId);
    const newClosedTabs = [
      ...tabsToClose.reverse(), // Most recently closed first
      ...closedTabs,
    ].slice(0, 10);

    set({
      openTabs: [tabToKeep],
      activeTabId: tabId,
      closedTabs: newClosedTabs,
    });
  },

  // Update tab content
  updateTabContent: (tabId: string, content: string) => {
    const { openTabs } = get();
    const updatedTabs = openTabs.map((tab) =>
      tab.id === tabId ? { ...tab, content, updatedAt: Date.now() } : tab
    );
    set({ openTabs: updatedTabs });
  },

  // Update tab title
  updateTabTitle: (tabId: string, title: string) => {
    const { openTabs } = get();
    const updatedTabs = openTabs.map((tab) =>
      tab.id === tabId ? { ...tab, title } : tab
    );
    set({ openTabs: updatedTabs });
  },

  // Set tab dirty state
  setTabDirty: (tabId: string, isDirty: boolean) => {
    const { openTabs } = get();
    const updatedTabs = openTabs.map((tab) =>
      tab.id === tabId ? { ...tab, isDirty } : tab
    );
    set({ openTabs: updatedTabs });
  },
}));
