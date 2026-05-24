import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function SearchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="relative mb-1.5 flex min-h-11 w-full items-center gap-2.5 rounded-[13px] border-0 bg-transparent px-3.5 py-[7px] text-left text-[21px] font-medium text-[#cfcfcf]"
      onClick={onClick}
    >
      <HugeiconsIcon icon={Search01Icon} size={27} color="currentColor" />
      <span>Search</span>
    </button>
  );
}
