// App configuration - centralized static values

export const APP_CONFIG = {
  name: "Draft",
  description: "Local Notes",
  version: "0.1.0",
} as const;

// Note card background colors (light pastel colors)
export const NOTE_COLORS = [
  {
    id: "default",
    name: "Default",
    bg: "#ffffff",
    header: "#f5f5f5",
    darkBg: "#f7fafc",
    darkHeader: "#e5e7eb",
  },
  {
    id: "rose",
    name: "Rose",
    bg: "#fff1f2",
    header: "#ffe4e6",
    darkBg: "#ffe4ea",
    darkHeader: "#ffd6dd",
  },
  {
    id: "pink",
    name: "Pink",
    bg: "#fdf2f8",
    header: "#fce7f3",
    darkBg: "#ffe5f7",
    darkHeader: "#fccef1",
  },
  {
    id: "purple",
    name: "Purple",
    bg: "#faf5ff",
    header: "#f3e8ff",
    darkBg: "#ede9fe",
    darkHeader: "#e9d5ff",
  },
  {
    id: "violet",
    name: "Violet",
    bg: "#f5f3ff",
    header: "#ede9fe",
    darkBg: "#e0e7ff",
    darkHeader: "#c7d2fe",
  },
  {
    id: "blue",
    name: "Blue",
    bg: "#eff6ff",
    header: "#dbeafe",
    darkBg: "#bae6fd",
    darkHeader: "#a5d8ff",
  },
  {
    id: "cyan",
    name: "Cyan",
    bg: "#ecfeff",
    header: "#cffafe",
    darkBg: "#a7f3eb",
    darkHeader: "#67e8f9",
  },
  {
    id: "teal",
    name: "Teal",
    bg: "#f0fdfa",
    header: "#ccfbf1",
    darkBg: "#99f6e4",
    darkHeader: "#5eead4",
  },
  {
    id: "green",
    name: "Green",
    bg: "#f0fdf4",
    header: "#dcfce7",
    darkBg: "#bbf7d0",
    darkHeader: "#86efac",
  },
  {
    id: "lime",
    name: "Lime",
    bg: "#f7fee7",
    header: "#ecfccb",
    darkBg: "#d9f99d",
    darkHeader: "#bef264",
  },
  {
    id: "yellow",
    name: "Yellow",
    bg: "#fefce8",
    header: "#fef9c3",
    darkBg: "#fde68a",
    darkHeader: "#facc15",
  },
  {
    id: "amber",
    name: "Amber",
    bg: "#fffbeb",
    header: "#fef3c7",
    darkBg: "#fde68a",
    darkHeader: "#fcd34d",
  },
  {
    id: "orange",
    name: "Orange",
    bg: "#fff7ed",
    header: "#ffedd5",
    darkBg: "#fdba74",
    darkHeader: "#fb923c",
  },
] as const;

export type NoteColorId = (typeof NOTE_COLORS)[number]["id"];

export function getNoteColor(colorId?: string | null) {
  return (
    NOTE_COLORS.find((c) => c.id === colorId) ||
    NOTE_COLORS.find((c) => c.id === "default")!
  );
}

// Sidebar navigation sections
export const SIDEBAR_SECTIONS = {
  main: [
    { id: "all", label: "All notes", icon: "ClipboardText" },
    { id: "favorites", label: "Favorites", icon: "Heart" },
    { id: "recent", label: "Recent notes", icon: "Clock" },
    { id: "tags", label: "Tags", icon: "Tag" },
  ],
  settings: [{ id: "settings", label: "Settings", icon: "Gear" }],
} as const;

// Editor configuration
export const EDITOR_CONFIG = {
  maxWidth: 720,
  padding: {
    horizontal: 32,
    vertical: 48,
  },
  autosaveDelay: 500, // ms
} as const;

// Search configuration
export const SEARCH_CONFIG = {
  debounceDelay: 200, // ms
  maxResults: 50,
  snippetLength: 150,
} as const;
