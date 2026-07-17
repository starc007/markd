import { PanelRight } from "lucide-react";
import { motion } from "motion/react";
import { Tooltip } from "@/components/ui/Tooltip";
import { SPRING_PANEL } from "@/lib/ease";
import { cx } from "@/lib/utils";
import { LinkedMentions } from "./LinkedMentions";

const WIDTH = 280;

export function BacklinksToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Tooltip label="Toggle linked mentions" side="bottom">
      <button
        type="button"
        aria-pressed={open}
        onClick={onToggle}
        className={cx(
          "grid h-7 w-7 place-items-center rounded-md border transition-[color,background-color,border-color,transform] duration-100 active:scale-[0.96]",
          open
            ? "border-line-soft bg-invert text-invert-ink"
            : "border-line-soft bg-hover text-muted hover:bg-active hover:text-ink",
        )}
      >
        <PanelRight size={15} strokeWidth={1.85} />
      </button>
    </Tooltip>
  );
}

export function BacklinksSidebar({
  rel,
  open,
  onClose,
}: {
  rel: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const visible = Boolean(rel && open);

  return (
    <motion.div
      animate={{ width: visible ? WIDTH : 0 }}
      initial={false}
      transition={SPRING_PANEL}
      className="h-full shrink-0 overflow-hidden"
    >
      <div style={{ width: WIDTH }} className="h-full">
        <LinkedMentions rel={rel ?? ""} active={visible} onClose={onClose} />
      </div>
    </motion.div>
  );
}
