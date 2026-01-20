import { memo, useState, useEffect } from "react";
import { BannerSelector, type BannerType } from "./BannerSelector";
import { getBannerImage } from "@/lib/tauri/commands";

interface BannerProps {
  bannerType: BannerType;
  title: string;
  className?: string;
  noteId: string;
  onBannerChange?: (type: BannerType) => void;
}

export const Banner = memo(function Banner({
  bannerType,
  title,
  className = "",
  noteId,
  onBannerChange,
}: BannerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      if (bannerType === "none" || bannerType.startsWith("static-")) {
        // Static URL - use it directly
        if (bannerType.startsWith("static-")) {
          const url = bannerType.replace("static-", "");
          setImageUrl(url);
        } else {
          setImageUrl(null);
        }
        setIsLoading(false);
        return;
      }

      // Custom image - load from database
      if (bannerType.startsWith("custom-")) {
        try {
          setIsLoading(true);
          const data = await getBannerImage(noteId);
          setImageUrl(data);
        } catch (error) {
          console.error("Failed to load banner image:", error);
          setImageUrl(null);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadImage();
  }, [bannerType, noteId]);

  if (bannerType === "none" || !imageUrl) {
    return null;
  }

  if (isLoading) {
    return (
      <div
        className={`relative w-full overflow-hidden h-52 group ${className}`}
      >
        <div className="w-full h-full bg-muted animate-pulse" />
      </div>
    );
  }

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
        onError={(e) => {
          // Hide image on error
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
        }}
      />
      {/* Banner selector CTA on hover */}
      {isHovered && onBannerChange && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <BannerSelector
            currentBanner={bannerType}
            onSelect={onBannerChange}
            noteId={noteId}
          />
        </div>
      )}
    </div>
  );
});
