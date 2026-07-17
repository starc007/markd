import {
  FilePlus,
  FolderOpen,
  FolderPlus,
  Pencil,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import type { TreeNode } from "@/lib/types";
import type { MenuItem } from "@/components/ui/ContextMenu";
import { usePins } from "@/stores/pins";
import { useVault } from "@/stores/vault";
import { isMac } from "@/lib/utils";

type PinMode = "toggle" | "unpin" | "none";

export function entryMenuItems(
  node: TreeNode,
  options: {
    onRename: (rel: string) => void;
    pinMode?: PinMode;
  },
): MenuItem[] {
  const vault = useVault.getState();
  const pins = usePins.getState();
  const items: MenuItem[] = [];

  if (node.kind === "folder") {
    items.push(
      {
        label: "New note",
        icon: FilePlus,
        onSelect: () => void vault.createNote(node.rel),
      },
      {
        label: "New folder",
        icon: FolderPlus,
        onSelect: () => {
          void vault.createFolder(node.rel, "Untitled").then((rel) => {
            if (rel) options.onRename(rel);
          });
        },
      },
    );
  }

  if (options.pinMode === "unpin") {
    items.push({
      label: node.kind === "folder" ? "Unpin folder" : "Unpin note",
      icon: PinOff,
      onSelect: () => void pins.unpin(node.rel),
    });
  } else if (options.pinMode === "toggle") {
    const pinned = pins.pins.includes(node.rel);
    items.push({
      label: pinned
        ? node.kind === "folder"
          ? "Unpin folder"
          : "Unpin note"
        : node.kind === "folder"
          ? "Pin folder"
          : "Pin note",
      icon: pinned ? PinOff : Pin,
      onSelect: () => void pins.toggle(node.rel),
    });
  }

  items.push(
    {
      label: isMac() ? "Reveal in Finder" : "Reveal in File Manager",
      icon: FolderOpen,
      onSelect: () => {
        if (!vault.root) return;
        void revealItemInDir(`${vault.root}/notes/${node.rel}`).catch((error) =>
          toast.error("Could not reveal item", {
            description: error instanceof Error ? error.message : String(error),
          }),
        );
      },
    },
    {
      label: "Rename",
      icon: Pencil,
      onSelect: () => options.onRename(node.rel),
    },
    {
      label: "Move to Trash",
      icon: Trash2,
      danger: true,
      onSelect: () => void vault.deleteEntry(node.rel),
    },
  );

  return items;
}
