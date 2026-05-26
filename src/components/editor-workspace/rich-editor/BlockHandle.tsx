import {
  Delete02Icon,
  DragDropVerticalIcon,
  LeftToRightListBulletIcon,
  ParagraphIcon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Editor } from "@tiptap/react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { Tooltip, cx } from "@/components/ui";

interface BlockHandlePosition {
  left: number;
  top: number;
}

export function BlockHandle({ editor }: { editor: Editor | null }) {
  const [position, setPosition] = useState<BlockHandlePosition | null>(null);
  const [active, setActive] = useState(false);
  const [pinned, setPinned] = useState(false);

  const measurePosition = useCallback(() => {
    if (!editor || !editor.isFocused || !editor.state.selection.empty) {
      return null;
    }

    try {
      const { $from } = editor.state.selection;
      const coords = editor.view.coordsAtPos($from.start($from.depth));
      const nextPosition = {
        left: Math.max(8, coords.left - 42),
        top: Math.max(56, coords.top - 4),
      };
      return nextPosition;
    } catch {
      return null;
    }
  }, [editor]);

  const hide = useCallback(() => {
    if (pinned) return;
    setActive(false);
    setPosition(null);
  }, [pinned]);

  const updatePosition = useCallback(() => {
    const nextPosition = measurePosition();
    if (!nextPosition) {
      hide();
      return;
    }
    if (active || pinned) {
      setPosition(nextPosition);
    }
  }, [active, hide, measurePosition, pinned]);

  const handlePointerMove = useCallback(
    (event: MouseEvent) => {
      if (pinned) return;
      const nextPosition = measurePosition();
      if (!nextPosition) {
        hide();
        return;
      }

      const nearGutter =
        event.clientX >= nextPosition.left - 12 &&
        event.clientX <= nextPosition.left + 40 &&
        event.clientY >= nextPosition.top - 12 &&
        event.clientY <= nextPosition.top + 44;

      if (nearGutter) {
        setPosition(nextPosition);
        setActive(true);
      } else if (active) {
        hide();
      }
    },
    [active, hide, measurePosition, pinned],
  );

  useEffect(() => {
    if (!editor) return;

    editor.on("selectionUpdate", updatePosition);
    editor.on("transaction", updatePosition);
    editor.on("focus", updatePosition);
    editor.on("blur", updatePosition);
    document.addEventListener("scroll", updatePosition, true);
    document.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("resize", updatePosition);

    return () => {
      editor.off("selectionUpdate", updatePosition);
      editor.off("transaction", updatePosition);
      editor.off("focus", updatePosition);
      editor.off("blur", updatePosition);
      document.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("resize", updatePosition);
    };
  }, [editor, handlePointerMove, updatePosition]);

  const deleteBlock = () => {
    if (!editor) return;
    const { $from } = editor.state.selection;
    const depth = Math.max(1, $from.depth);
    editor
      .chain()
      .focus()
      .deleteRange({ from: $from.before(depth), to: $from.after(depth) })
      .run();
  };

  return (
    <AnimatePresence>
      {active && position && (
        <motion.div
          animate={{ scale: 1, x: 0 }}
          className="fixed z-40 flex items-center gap-0.5 rounded-xl border border-line bg-panel/92 p-0.5 shadow-overlay backdrop-blur-[18px] dark:border-line-dark dark:bg-tooltip"
          exit={{ scale: 0.96, x: -4 }}
          initial={{ scale: 0.96, x: -4 }}
          style={{ left: position.left, top: position.top }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          onMouseEnter={() => setPinned(true)}
          onMouseLeave={() => {
            setPinned(false);
            setActive(false);
            setPosition(null);
          }}
        >
          <span className="grid h-7 w-5 place-items-center text-muted dark:text-tooltip-ink/60">
            <HugeiconsIcon icon={DragDropVerticalIcon} size={14} color="currentColor" />
          </span>
          <BlockAction
            label="Text"
            icon={ParagraphIcon}
            active={editor?.isActive("paragraph")}
            onClick={() => editor?.chain().focus().setParagraph().run()}
          />
          <BlockAction
            label="Bullets"
            icon={LeftToRightListBulletIcon}
            active={editor?.isActive("bulletList")}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          />
          <BlockAction
            label="Task"
            icon={Task01Icon}
            active={editor?.isActive("taskList")}
            onClick={() => editor?.chain().focus().toggleTaskList().run()}
          />
          <BlockAction label="Delete" icon={Delete02Icon} onClick={deleteBlock} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BlockAction({
  active,
  icon,
  label,
  onClick,
}: {
  active?: boolean;
  icon: typeof ParagraphIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip label={label} place="bottom">
      <button
        aria-label={label}
        className={cx(
          "grid h-7 w-7 place-items-center rounded-lg text-muted transition-[background-color,color,transform] duration-150 hover:scale-[1.04] hover:bg-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-line dark:text-tooltip-ink/70 dark:hover:bg-tooltip-ink/10 dark:hover:text-tooltip-ink dark:focus-visible:ring-focus-line-dark",
          active && "bg-hover text-ink dark:bg-tooltip-ink/10 dark:text-tooltip-ink",
        )}
        onClick={onClick}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        <HugeiconsIcon icon={icon} size={14} color="currentColor" />
      </button>
    </Tooltip>
  );
}
