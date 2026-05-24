import {
  Bookmark01Icon,
  FileEditIcon,
  Settings02Icon,
  StickyNote01Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import type { ViewMode } from "@/lib/types";

export const sidebarNavigation: Array<{
  id: ViewMode;
  label: string;
  icon: typeof FileEditIcon;
}> = [
  { id: "todos", label: "Tasks", icon: Task01Icon },
  { id: "stickies", label: "Sticky notes", icon: StickyNote01Icon },
  { id: "bookmarks", label: "Bookmarks", icon: Bookmark01Icon },
  { id: "settings", label: "Settings", icon: Settings02Icon },
];
