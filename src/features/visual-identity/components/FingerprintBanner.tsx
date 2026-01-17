import { memo, useState } from "react";
import { CSSFingerprint } from "./CSSFingerprint";

import {
  BannerSelector,
  type BannerType,
} from "@/components/editor/BannerSelector";

interface FingerprintBannerProps {
  className?: string;
  onBannerChange?: (type: BannerType) => void;
  currentBanner?: BannerType;
  gradientIndex?: number; // Index to select which of the 6 gradients to use
}

export const FingerprintBanner = memo(function FingerprintBanner({
  className = "",
  onBannerChange,
  currentBanner,
  gradientIndex = 0,
}: FingerprintBannerProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Responsive height: 200px desktop, 120px mobile
  const height =
    typeof window !== "undefined" && window.innerWidth < 768 ? 120 : 300;

  // Calculate size for square canvas (we'll use width for both dimensions)
  const width = typeof window !== "undefined" ? window.innerWidth : 1200;

  return (
    <div
      className={`relative w-full overflow-hidden h-52 group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CSSFingerprint
        width={width}
        height={height}
        variant="banner"
        gradientIndex={gradientIndex}
        style={{
          width: "100%",
          height: `${height}px`,
          borderRadius: 0,
          position: "absolute",
          top: 0,
          left: 0,
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
