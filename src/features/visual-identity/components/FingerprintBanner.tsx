import { memo } from "react";
import { CSSFingerprint } from "./CSSFingerprint";

interface FingerprintBannerProps {
  noteId: string;
  title: string;
  content: string;
  isEditing?: boolean;
  className?: string;
}

export const FingerprintBanner = memo(function FingerprintBanner({
  noteId,
  title,
  content,
  isEditing = false,
  className = "",
}: FingerprintBannerProps) {
  // Responsive height: 200px desktop, 120px mobile
  const height =
    typeof window !== "undefined" && window.innerWidth < 768 ? 120 : 200;

  // Calculate size for square canvas (we'll use width for both dimensions)
  const width = typeof window !== "undefined" ? window.innerWidth : 1200;
  const size = Math.max(width, 1200); // Minimum 1200px for quality

  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      style={{ height: `${height}px` }}
    >
      <CSSFingerprint
        noteId={noteId}
        title={title || "Untitled"}
        content={content || ""}
        width={width}
        height={height}
        variant="banner"
        isEditing={isEditing}
        style={{
          width: "100%",
          height: `${height}px`,
          borderRadius: 0,
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
      {/* Title overlay with auto-contrast */}
      <div className="absolute inset-0 flex items-end justify-start p-8">
        <h1 className="text-4xl font-bold text-white drop-shadow-lg">
          {title || "Untitled"}
        </h1>
      </div>
    </div>
  );
});
