import { memo, useState, useEffect } from "react";
import { BannerSelector, type BannerType } from "./BannerSelector";
import { getBannerImage } from "@/lib/tauri/commands";
import { normalizeBannerType } from "../utils/util";
import { motion, AnimatePresence } from "motion/react";

interface BannerProps {
  bannerType: BannerType;
  title: string;
  className?: string;
  noteId: string;
  onBannerChange?: (type: BannerType) => void;
}

export const Banner = memo(function Banner({
  bannerType: rawBannerType,
  title,
  className = "",
  noteId,
  onBannerChange,
}: BannerProps) {
  // Normalize banner type to handle old formats
  const bannerType = normalizeBannerType(rawBannerType);
  
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
        className={`draft-banner relative mx-4 mt-3 overflow-hidden h-48 group ${className}`}
      >
        <div className="w-full h-full bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 360, damping: 34 }}
      className={`draft-banner relative mx-4 mt-3 overflow-hidden h-48 group ${className}`}
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
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/18 dark:from-white/8 dark:to-black/28" />
      <div className="absolute inset-x-0 top-0 h-12 border-b border-white/20 bg-white/18 backdrop-blur-xl dark:border-white/10 dark:bg-white/8" />
      {/* Banner selector CTA on hover */}
      <AnimatePresence>
        {isHovered && onBannerChange && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute top-4 right-4 z-10 rounded-2xl border border-white/45 bg-white/38 p-1 backdrop-blur-2xl dark:border-white/10 dark:bg-black/20"
          >
            <BannerSelector
              currentBanner={bannerType}
              onSelect={onBannerChange}
              noteId={noteId}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
