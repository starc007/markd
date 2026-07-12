import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  FilePlus,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { TreeNode } from "@/lib/types";
import { EASE_OUT } from "@/lib/ease";
import { cx, parentDir } from "@/lib/utils";
import { useVault } from "@/stores/vault";
import {
  ContextMenu,
  type MenuItem,
  type MenuPosition,
} from "@/components/ui/ContextMenu";
import { ActionSwapIcon } from "@/components/motion/action-swap";

const ROOT_DROP_ID = "markd:notes-root";

const treeCollisionDetection: CollisionDetection = (args) => {
  const collisions = pointerWithin(args);
  const folderCollisions = collisions.filter(
    (collision) => collision.id !== ROOT_DROP_ID,
  );
  return folderCollisions.length > 0 ? folderCollisions : collisions;
};

interface TreeApi {
  renaming: string | null;
  setRenaming: (rel: string | null) => void;
  dragging: string | null;
  openMenu: (position: MenuPosition, node: TreeNode) => void;
}

const TreeContext = createContext<TreeApi | null>(null);

export function FileTree() {
  const tree = useVault((s) => s.tree);
  const moveEntry = useVault((s) => s.moveEntry);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [menu, setMenu] = useState<{
    position: MenuPosition;
    node: TreeNode;
  } | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const openMenu = useCallback(
    (position: MenuPosition, node: TreeNode) => setMenu({ position, node }),
    [],
  );

  const finishDrag = ({ active, over }: DragEndEvent) => {
    setDragging(null);
    if (!over) return;
    const rel = String(active.id);
    const dir = String(over.data.current?.dir ?? "");
    if (rel === dir || dir.startsWith(`${rel}/`) || parentDir(rel) === dir) {
      return;
    }
    moveEntry(rel, dir);
  };
  const draggedNode = dragging ? findNode(tree, dragging) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={treeCollisionDetection}
      onDragStart={({ active }) => setDragging(String(active.id))}
      onDragCancel={() => setDragging(null)}
      onDragEnd={finishDrag}
    >
      <TreeContext.Provider
        value={{ renaming, setRenaming, dragging, openMenu }}
      >
        <TreeList tree={tree} dragging={dragging} />
        {menu && (
          <ContextMenu
            position={menu.position}
            items={menuItems(menu.node)}
            onClose={() => setMenu(null)}
          />
        )}
        <DragOverlay dropAnimation={null}>
          {draggedNode ? <DragPreview node={draggedNode} /> : null}
        </DragOverlay>
      </TreeContext.Provider>
    </DndContext>
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

function findNode(nodes: TreeNode[], rel: string): TreeNode | null {
  for (const node of nodes) {
    if (node.rel === rel) return node;
    const child = node.children ? findNode(node.children, rel) : null;
    if (child) return child;
  }
  return null;
}

function DragPreview({ node }: { node: TreeNode }) {
  const isFolder = node.kind === "folder";
  return (
    <div className="flex h-[30px] w-[208px] items-center rounded-md border border-line bg-panel px-2 text-[13px] text-ink shadow-lg shadow-black/10">
      {isFolder ? (
        <Folder size={14} strokeWidth={1.75} className="mr-2 text-faint" />
      ) : (
        <FileText size={14} strokeWidth={1.75} className="mr-2 text-faint" />
      )}
      <span className={cx("truncate", isFolder && "font-medium")}>
        {node.name}
      </span>
    </div>
  );
}

function TreeList({
  tree,
  dragging,
}: {
  tree: TreeNode[];
  dragging: string | null;
}) {
  const eligible = Boolean(dragging && parentDir(dragging) !== "");
  const { setNodeRef } = useDroppable({
    id: ROOT_DROP_ID,
    disabled: !eligible,
    data: { dir: "" },
  });

  return (
    <div
      ref={setNodeRef}
      className="no-scrollbar relative min-h-0 flex-1 overflow-y-auto px-2 pb-6 pt-1"
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
  );
}

function Row({ node, depth }: { node: TreeNode; depth: number }) {
  const api = useContext(TreeContext);
  const view = useVault((s) => s.view);
  const expanded = useVault((s) => s.expanded);
  const toggleExpanded = useVault((s) => s.toggleExpanded);
  const setView = useVault((s) => s.setView);

  const isFolder = node.kind === "folder";
  const isOpen = expanded.has(node.rel);
  const isActive = view?.type === "note" && view.rel === node.rel;
  const isRenaming = api?.renaming === node.rel;
  const targetDir = isFolder ? node.rel : parentDir(node.rel);
  const invalidTarget = Boolean(
    api?.dragging &&
      (targetDir === api.dragging || targetDir.startsWith(`${api.dragging}/`)),
  );
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({ id: node.rel, disabled: isRenaming });
  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: `drop:${node.rel}`,
    disabled: invalidTarget,
    data: { dir: targetDir },
  });
  const setRowRef = useCallback(
    (element: HTMLDivElement | null) => {
      setDragRef(element);
      setDropRef(element);
    },
    [setDragRef, setDropRef],
  );

  return (
    <>
      <div
        ref={setRowRef}
        {...attributes}
        {...listeners}
        role="treeitem"
        aria-selected={isActive}
        className={cx(
          "group relative flex h-[30px] touch-none cursor-pointer items-center rounded-md pr-1.5 text-[13px] transition-colors duration-100",
          isActive
            ? "bg-active text-ink"
            : "text-muted hover:bg-hover hover:text-ink",
          isOver && !isActive && "bg-active text-ink",
          isDragging && "opacity-40",
        )}
        style={{
          paddingLeft: 8 + depth * 15,
        }}
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
      >
        {isFolder ? (
          <ActionSwapIcon
            value={isOpen ? "open" : "closed"}
            animation="roll"
            className={cx(
              "mr-2 h-[14px] w-[14px]",
              isActive ? "text-ink" : "text-faint",
            )}
          >
            {isOpen ? (
              <FolderOpen size={14} strokeWidth={1.75} />
            ) : (
              <Folder size={14} strokeWidth={1.75} />
            )}
          </ActionSwapIcon>
        ) : (
          <FileText
            size={14}
            strokeWidth={1.75}
            className={cx("mr-2 shrink-0", isActive ? "text-ink" : "text-faint")}
          />
        )}

        {isRenaming ? (
          <RenameInput node={node} />
        ) : (
          <span className={cx("truncate", isFolder && "font-medium")}>
            {node.name}
          </span>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isFolder && isOpen && (
          <motion.div
            role="group"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="overflow-hidden"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
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
