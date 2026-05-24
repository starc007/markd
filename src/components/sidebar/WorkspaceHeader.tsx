import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function WorkspaceHeader({
  name,
  onCreateNote,
}: {
  name: string;
  onCreateNote: () => void;
}) {
  return (
    <div className="relative mb-7 flex min-h-11 items-center gap-3.5">
      <div className="grid h-9 w-9 place-items-center rounded-[9px] bg-[#f4f4f4] font-extrabold text-[#1f1f1f]">
        D
      </div>
      <div className="grid min-w-0 flex-1 gap-0.5">
        <strong className="truncate text-xl leading-none text-[#f3f3f3]">
          {name}
        </strong>
        <span className="text-xs text-[#8f8f8f]">Local files for agents</span>
      </div>
      <button
        className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-transparent text-[#d6d6d6]"
        onClick={onCreateNote}
        aria-label="New note"
      >
        <HugeiconsIcon icon={Add01Icon} size={21} color="currentColor" />
      </button>
    </div>
  );
}
