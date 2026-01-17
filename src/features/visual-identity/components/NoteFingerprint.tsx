import { useEffect, useRef, useState } from "react";
import { useVisualIdentityStore } from "../stores/visualIdentityStore";
import { useFingerprintAnimation } from "../hooks/useFingerprintAnimation";
import type { PatternType } from "../generators/core";

interface NoteFingerprintProps {
  noteId: string;
  title: string;
  content: string;
  size: number;
  variant?: "thumbnail" | "banner" | "indicator";
  isEditing?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function NoteFingerprint({
  noteId,
  title,
  content,
  size,
  variant = "thumbnail",
  isEditing = false,
  className = "",
  style,
}: NoteFingerprintProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [patternType, setPatternType] = useState<PatternType>("mesh");
  const getFingerprint = useVisualIdentityStore(
    (state) => state.getFingerprint
  );

  // Load fingerprint and draw on canvas
  useEffect(() => {
    let cancelled = false;

    const loadFingerprint = async () => {
      try {
        const regeneratePattern = async () => {
          if (!canvasRef.current || cancelled) return;
          const ctx = canvasRef.current.getContext("2d");
          if (!ctx) return;

          const { generateFingerprintPattern } = await import(
            "../utils/canvas"
          );
          const { hashToSeeds, selectPatternType } = await import(
            "../generators/core"
          );
          const hash = `${title}${content}`;
          const seeds = hashToSeeds(hash);
          const type = selectPatternType(seeds[0]);
          setPatternType(type);

          // Clear and draw pattern
          ctx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
          generateFingerprintPattern(canvasRef.current, seeds, type);
          const newImageUrl = canvasRef.current.toDataURL("image/png");
          setImageUrl(newImageUrl);
        };

        const data = await getFingerprint(noteId, title, content, size);
        if (cancelled) return;

        setPatternType(data.patternType);

        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          if (!ctx) return;

          // Always draw on canvas (required for banner animation)
          if (data.imageData) {
            // Load image from base64 and draw on canvas
            const img = new Image();
            img.onload = () => {
              if (cancelled || !canvasRef.current) return;
              ctx.clearRect(
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
              );
              ctx.drawImage(
                img,
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
              );
              setImageUrl(data.imageData || null); // Store for non-banner variants
            };
            img.onerror = () => {
              console.error("Failed to load fingerprint image");
              // Fallback to regeneration
              regeneratePattern();
            };
            img.src = data.imageData;
          } else {
            // Regenerate if no image data
            await regeneratePattern();
          }
        }
      } catch (error) {
        console.error("Failed to load fingerprint:", error);
      }
    };

    loadFingerprint();

    return () => {
      cancelled = true;
    };
  }, [noteId, title, content, size, getFingerprint]);

  // Animation seed from noteId
  const seed = useRef(() => {
    let hash = 0;
    for (let i = 0; i < noteId.length; i++) {
      const char = noteId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }).current();

  // Use animation only for banner variant, and only after image is loaded
  useFingerprintAnimation({
    canvas: variant === "banner" && imageUrl ? canvasRef.current : null,
    seed,
    patternType,
    isEditing,
    enabled: variant === "banner" && !!imageUrl,
  });

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius:
      variant === "thumbnail" || variant === "indicator" ? "50%" : 0,
    overflow: "hidden",
    ...style,
  };

  // For banner variant, always use canvas (for animation)
  // For other variants, use img if available for better performance
  if (imageUrl && variant !== "banner") {
    return (
      <div className={className} style={containerStyle}>
        <img
          src={imageUrl}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
    );
  }

  // Canvas rendering (used for banner or when image not ready)
  // For banner, we need to get actual container size, but use size as fallback
  // The canvas will be scaled via CSS to fit the container
  return (
    <div className={className} style={containerStyle}>
      <canvas
        ref={canvasRef}
        width={size}
        height={variant === "banner" ? Math.floor(size * 0.2) : size} // Banner is ~20% height of width
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "cover", // Ensure it covers the container
        }}
      />
    </div>
  );
}
