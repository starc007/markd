import { memo, useState } from "react";
import { BannerSelector, type BannerType } from "./BannerSelector";
import { JAPANESE_PRINT_IMAGES } from "@/assets/japanesePrints";

interface JapanesePrintBannerProps {
  printId: string;
  title: string;
  className?: string;
  noteId: string;
  content: string;
  onBannerChange?: (type: BannerType) => void;
  currentBanner?: BannerType;
}

export const JapanesePrintBanner = memo(function JapanesePrintBanner({
  printId,
  title,
  className = "",
  noteId,
  content,
  onBannerChange,
  currentBanner,
}: JapanesePrintBannerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const imageUrl =
    JAPANESE_PRINT_IMAGES[printId as keyof typeof JAPANESE_PRINT_IMAGES] ||
    JAPANESE_PRINT_IMAGES["2"];

  return (
    <div
      className={`relative w-full overflow-hidden h-52 group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={imageUrl}
        alt={title || "Banner"}
        className="w-full h-full object-cover"
        style={{
          filter: "brightness(0.9) contrast(1.1)",
        }}
        onError={(e) => {
          // Fallback to gradient if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
          if (target.parentElement) {
            target.parentElement.style.background =
              "linear-gradient(135deg, rgb(132, 210, 204), rgb(145, 77, 179))";
          }
        }}
      />
      {/* Banner selector CTA on hover */}
      {isHovered && onBannerChange && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <BannerSelector
            currentBanner={currentBanner}
            onSelect={onBannerChange}
          />
        </div>
      )}
    </div>
  );
});
