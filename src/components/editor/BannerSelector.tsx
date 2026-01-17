import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownSeparator,
  Button,
} from "../ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { ImageIcon } from "@hugeicons/core-free-icons";
import { CSSFingerprint } from "@/features/visual-identity/components/CSSFingerprint";
import { JAPANESE_PRINT_PREVIEWS } from "@/assets/japanesePrints";

export type BannerType =
  | "none"
  | `gradient-${number}`
  | `japanese-print-${string}`;

interface BannerSelectorProps {
  currentBanner?: BannerType;
  onSelect: (type: BannerType) => void;
}

export function BannerSelector({
  onSelect,

  currentBanner,
}: BannerSelectorProps) {
  const isNone = currentBanner === "none";
  return (
    <Dropdown>
      <DropdownTrigger>
        <button className="px-3 py-1.5 text-sm text-foreground  rounded-md bg-accent transition-colors flex items-center gap-2">
          <HugeiconsIcon icon={ImageIcon} size={16} />
          <span>{!isNone ? "Update Banner" : "Add Banner"}</span>
        </button>
      </DropdownTrigger>
      <DropdownContent align="start" className="w-[500px] p-4">
        {/* No Banner Option */}
        <div className="flex justify-end">
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => onSelect("none")}
          >
            Remove Banner
          </Button>
        </div>

        <DropdownSeparator className="my-4" />

        {/* Gradient Patterns */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-3">Gradient Patterns</h3>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="cursor-pointer group"
                onClick={() => onSelect(`gradient-${index}` as BannerType)}
              >
                <div className="w-full aspect-5/2 rounded-lg overflow-hidden border-2 border-border group-hover:border-primary transition-colors relative">
                  <CSSFingerprint width={200} height={80} variant="banner" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <DropdownSeparator className="my-4" />

        {/* Japanese Prints */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Japanese Prints</h3>
          <div className="grid grid-cols-5 gap-3">
            {JAPANESE_PRINT_PREVIEWS.map((print) => (
              <div
                key={print.id}
                className="cursor-pointer group"
                onClick={() =>
                  onSelect(`japanese-print-${print.id}` as BannerType)
                }
              >
                <div className="w-full aspect-5/3 rounded-lg overflow-hidden border-2 border-border group-hover:border-primary transition-colors">
                  <img
                    src={print.url}
                    alt={print.id}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to gradient if image fails
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      if (target.parentElement) {
                        target.parentElement.style.background =
                          "linear-gradient(135deg, rgb(132, 210, 204), rgb(145, 77, 179))";
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
