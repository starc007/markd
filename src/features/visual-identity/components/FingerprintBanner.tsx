import { memo, useState } from "react";
import { CSSFingerprint } from "./CSSFingerprint";
import { useVisualIdentityStore } from "../stores/visualIdentityStore";
import {
  BannerSelector,
  type BannerType,
} from "@/components/editor/BannerSelector";

interface FingerprintBannerProps {
  noteId: string;
  title: string;
  content: string;
  isEditing?: boolean;
  className?: string;
  gradientIndex?: number; // Index of the selected gradient (0-4)
  onBannerChange?: (type: BannerType) => void;
  currentBanner?: BannerType;
}

export const FingerprintBanner = memo(function FingerprintBanner({
  noteId,
  title,
  content,
  isEditing = false,
  className = "",
  gradientIndex = 0,
  onBannerChange,
  currentBanner,
}: FingerprintBannerProps) {
  const [isHovered, setIsHovered] = useState(false);
  // Get regeneration trigger to use as key for forcing re-render
  const regenerationTrigger = useVisualIdentityStore(
    (state) => state.regenerationTriggers.get(noteId) || 0
  );

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
        key={`${noteId}-${regenerationTrigger}-${gradientIndex}`}
        noteId={noteId}
        title={title || "Untitled"}
        content={content || ""}
        width={width}
        height={height}
        variant="banner"
        isEditing={isEditing}
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
            noteId={noteId}
            title={title}
            content={content}
          />
        </div>
      )}
    </div>
  );
});
