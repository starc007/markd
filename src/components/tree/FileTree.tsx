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
  FileText,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { TreeNode } from "@/lib/types";
import { EASE_OUT } from "@/lib/ease";
import { cx, parentDir } from "@/lib/utils";
import { useVault } from "@/stores/vault";
import { usePins } from "@/stores/pins";
import { RenameInput } from "./RenameInput";
import { entryMenuItems } from "./treeMenu";
import {
  ContextMenu,
  type MenuItem,
  type MenuPosition,
} from "@/components/ui/ContextMenu";
import { FolderMorphIcon } from "./FolderMorphIcon";

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
  focusRel: string | null;
  setFocusRel: (rel: string) => void;
  dragging: string | null;
  openMenu: (position: MenuPosition, node: TreeNode) => void;
}

const TreeContext = createContext<TreeApi | null>(null);

export function FileTree() {
  const tree = useVault((s) => s.tree);
  const pins = usePins((s) => s.pins);
  const moveEntry = useVault((s) => s.moveEntry);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [focusRel, setFocusRel] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [menu, setMenu] = useState<{
    position: MenuPosition;
    node: TreeNode;
  } | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  const visibleTree = useMemo(
    () => withoutPinnedEntries(tree, new Set(pins)),
    [pins, tree],
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
  const draggedNode = dragging ? findNode(visibleTree, dragging) : null;

  useEffect(() => {
    const currentView = useVault.getState().view;
    const activeRel = currentView?.type === "note" ? currentView.rel : null;
    if (focusRel && findNode(visibleTree, focusRel)) return;
    setFocusRel(
      activeRel && findNode(visibleTree, activeRel)
        ? activeRel
        : visibleTree[0]?.rel ?? null,
    );
  }, [visibleTree, focusRel]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={treeCollisionDetection}
      onDragStart={({ active }) => setDragging(String(active.id))}
      onDragCancel={() => setDragging(null)}
      onDragEnd={finishDrag}
    >
      <TreeContext.Provider
        value={{
          renaming,
          setRenaming,
          focusRel,
          setFocusRel,
          dragging,
          openMenu,
        }}
      >
        <TreeList
          tree={visibleTree}
          dragging={dragging}
          showEmpty={tree.length === 0}
        />
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
    return entryMenuItems(node, {
      onRename: setRenaming,
      pinMode: "toggle",
    });
  }
}

function withoutPinnedEntries(nodes: TreeNode[], pins: Set<string>): TreeNode[] {
  return nodes.flatMap((node) => {
    if (pins.has(node.rel)) return [];
    if (node.kind === "note") return [node];
    return [
      {
        ...node,
        children: node.children
          ? withoutPinnedEntries(node.children, pins)
          : node.children,
      },
    ];
  });
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
        <FolderMorphIcon
          open={false}
          className="mr-2 h-[14px] w-[14px] text-faint"
        />
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
  showEmpty,
}: {
  tree: TreeNode[];
  dragging: string | null;
  showEmpty: boolean;
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
      role="tree"
      aria-label="Notes"
      className="no-scrollbar relative min-h-0 flex-1 overflow-y-auto px-2 pb-6 pt-1"
    >
      {tree.map((node) => (
        <Row key={node.rel} node={node} depth={0} />
      ))}
      {showEmpty && (
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
        aria-expanded={isFolder ? isOpen : undefined}
        tabIndex={api?.focusRel === node.rel ? 0 : -1}
        className={cx(
          "group relative flex h-[30px] touch-none cursor-pointer items-center rounded-md pr-1.5 text-[13px] transition-colors duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink",
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
          api?.setFocusRel(node.rel);
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
        onFocus={() => api?.setFocusRel(node.rel)}
        onKeyDown={(event) => {
          if (isRenaming) return;
          const treeRoot = event.currentTarget.closest('[role="tree"]');
          const items = Array.from(
            treeRoot?.querySelectorAll<HTMLElement>('[role="treeitem"]') ?? [],
          );
          const index = items.indexOf(event.currentTarget);
          const focusAt = (next: number) => {
            const item = items[next];
            if (!item) return;
            event.preventDefault();
            item.focus();
          };

          if (event.key === "ArrowDown") {
            focusAt(Math.min(index + 1, items.length - 1));
          } else if (event.key === "ArrowUp") {
            focusAt(Math.max(index - 1, 0));
          } else if (event.key === "Home") {
            focusAt(0);
          } else if (event.key === "End") {
            focusAt(items.length - 1);
          } else if (event.key === "ArrowRight" && isFolder) {
            event.preventDefault();
            if (!isOpen) toggleExpanded(node.rel);
            else focusAt(index + 1);
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            if (isFolder && isOpen) {
              toggleExpanded(node.rel);
            } else {
              const parent = parentDir(node.rel);
              const parentItem = items.find(
                (item) => item.dataset.rel === parent,
              );
              parentItem?.focus();
            }
          } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (isFolder) toggleExpanded(node.rel);
            else setView({ type: "note", rel: node.rel });
          } else if (event.key === "F2") {
            event.preventDefault();
            api?.setRenaming(node.rel);
          }
        }}
        data-rel={node.rel}
      >
        {isFolder ? (
          <FolderMorphIcon
            open={isOpen}
            className={cx(
              "mr-2 h-[14px] w-[14px] shrink-0",
              isActive ? "text-ink" : "text-faint",
            )}
          />
        ) : (
          <FileText
            size={14}
            strokeWidth={1.75}
            className={cx("mr-2 shrink-0", isActive ? "text-ink" : "text-faint")}
          />
        )}

        {isRenaming ? (
          <RenameInput node={node} onDone={() => api?.setRenaming(null)} />
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
