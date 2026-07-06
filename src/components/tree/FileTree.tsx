import {
  ChevronRight,
  FilePlus,
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { TreeNode } from "@/lib/types";
import { cx, parentDir } from "@/lib/utils";
import { useVault } from "@/stores/vault";
import {
  ContextMenu,
  type MenuItem,
  type MenuPosition,
} from "@/components/ui/ContextMenu";

const DRAG_TYPE = "application/x-draft-rel";

interface TreeApi {
  renaming: string | null;
  setRenaming: (rel: string | null) => void;
  openMenu: (position: MenuPosition, node: TreeNode) => void;
}

const TreeContext = createContext<TreeApi | null>(null);

export function FileTree() {
  const tree = useVault((s) => s.tree);
  const moveEntry = useVault((s) => s.moveEntry);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [menu, setMenu] = useState<{
    position: MenuPosition;
    node: TreeNode;
  } | null>(null);
  const [rootDropping, setRootDropping] = useState(false);

  const openMenu = useCallback(
    (position: MenuPosition, node: TreeNode) => setMenu({ position, node }),
    [],
  );

  return (
    <TreeContext.Provider value={{ renaming, setRenaming, openMenu }}>
      <div
        className={cx(
          "flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pb-6 pt-1",
          rootDropping && "bg-hover",
        )}
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes(DRAG_TYPE)) {
            event.preventDefault();
            setRootDropping(true);
          }
        }}
        onDragLeave={(event) => {
          if (event.currentTarget === event.target) setRootDropping(false);
        }}
        onDrop={(event) => {
          setRootDropping(false);
          const rel = event.dataTransfer.getData(DRAG_TYPE);
          if (rel && parentDir(rel) !== "") moveEntry(rel, "");
        }}
      >
        {tree.map((node) => (
          <Row key={node.rel} node={node} depth={0} />
        ))}
        {tree.length === 0 && (
          <p className="px-2 pt-2 text-[12.5px] leading-relaxed text-faint">
            No notes yet. Press{" "}
            <kbd className="rounded border border-line bg-bg px-1 font-mono text-[10.5px]">
              ⌘N
            </kbd>{" "}
            to create one.
          </p>
        )}
      </div>
      {menu && (
        <ContextMenu
          position={menu.position}
          items={menuItems(menu.node)}
          onClose={() => setMenu(null)}
        />
      )}
    </TreeContext.Provider>
  );

  function menuItems(node: TreeNode): MenuItem[] {
    const vault = useVault.getState();
    const items: MenuItem[] = [];
    if (node.kind === "folder") {
      items.push(
        {
          label: "New note",
          icon: FilePlus,
          onSelect: () => vault.createNote(node.rel),
        },
        {
          label: "New folder",
          icon: FolderPlus,
          onSelect: async () => {
            const rel = await vault.createFolder(node.rel, "Untitled");
            if (rel) setRenaming(rel);
          },
        },
      );
    }
    items.push(
      {
        label: "Rename",
        icon: Pencil,
        onSelect: () => setRenaming(node.rel),
      },
      {
        label: "Move to Trash",
        icon: Trash2,
        danger: true,
        onSelect: () => vault.deleteEntry(node.rel),
      },
    );
    return items;
  }
}

function Row({ node, depth }: { node: TreeNode; depth: number }) {
  const api = useContext(TreeContext);
  const view = useVault((s) => s.view);
  const expanded = useVault((s) => s.expanded);
  const toggleExpanded = useVault((s) => s.toggleExpanded);
  const setView = useVault((s) => s.setView);
  const moveEntry = useVault((s) => s.moveEntry);
  const [dropping, setDropping] = useState(false);

  const isFolder = node.kind === "folder";
  const isOpen = expanded.has(node.rel);
  const isActive = view?.type === "note" && view.rel === node.rel;
  const isRenaming = api?.renaming === node.rel;

  return (
    <>
      <div
        role="treeitem"
        aria-selected={isActive}
        draggable={!isRenaming}
        className={cx(
          "group relative flex h-[26px] cursor-default items-center rounded-md pr-1.5 text-[13px] transition-colors duration-100",
          isActive
            ? "bg-invert text-invert-ink"
            : "text-muted hover:bg-hover hover:text-ink",
          dropping && !isActive && "bg-active text-ink",
        )}
        style={{ paddingLeft: 6 + depth * 14 }}
        onClick={() => {
          if (isFolder) {
            toggleExpanded(node.rel);
          } else {
            setView({ type: "note", rel: node.rel });
          }
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          api?.openMenu({ x: event.clientX, y: event.clientY }, node);
        }}
        onDragStart={(event) => {
          event.dataTransfer.setData(DRAG_TYPE, node.rel);
          event.dataTransfer.effectAllowed = "move";
        }}
        onDragOver={(event) => {
          if (!isFolder) return;
          if (event.dataTransfer.types.includes(DRAG_TYPE)) {
            event.preventDefault();
            event.stopPropagation();
            setDropping(true);
          }
        }}
        onDragLeave={() => setDropping(false)}
        onDrop={(event) => {
          if (!isFolder) return;
          event.stopPropagation();
          setDropping(false);
          const rel = event.dataTransfer.getData(DRAG_TYPE);
          if (rel && rel !== node.rel) moveEntry(rel, node.rel);
        }}
      >
        {isFolder ? (
          <ChevronRight
            size={13}
            strokeWidth={2}
            className={cx(
              "mr-1 shrink-0 transition-transform duration-150 ease-out",
              isOpen && "rotate-90",
              isActive ? "text-invert-ink/70" : "text-faint",
            )}
          />
        ) : (
          <span className="mr-1 w-[13px] shrink-0" />
        )}

        {isRenaming ? (
          <RenameInput node={node} />
        ) : (
          <span className={cx("truncate", isFolder && "font-medium")}>
            {node.name}
          </span>
        )}
      </div>

      {isFolder && isOpen && (
        <div role="group">
          {node.children?.map((child) => (
            <Row key={child.rel} node={child} depth={depth + 1} />
          ))}
          {node.children?.length === 0 && (
            <p
              className="py-0.5 text-[12px] italic text-faint"
              style={{ paddingLeft: 26 + (depth + 1) * 14 }}
            >
              empty
            </p>
          )}
        </div>
      )}
    </>
  );
}

function RenameInput({ node }: { node: TreeNode }) {
  const api = useContext(TreeContext);
  const renameEntry = useVault((s) => s.renameEntry);
  const inputRef = useRef<HTMLInputElement>(null);
  const submitted = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const submit = () => {
    if (submitted.current) return;
    submitted.current = true;
    const value = inputRef.current?.value.trim();
    api?.setRenaming(null);
    if (value && value !== node.name) renameEntry(node.rel, value);
  };

  return (
    <input
      ref={inputRef}
      defaultValue={node.name}
      className="w-full min-w-0 rounded-sm bg-bg px-1 text-[13px] text-ink outline-none ring-1 ring-line"
      onClick={(event) => event.stopPropagation()}
      onBlur={submit}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter") submit();
        if (event.key === "Escape") {
          submitted.current = true;
          api?.setRenaming(null);
        }
      }}
    />
  );
}
