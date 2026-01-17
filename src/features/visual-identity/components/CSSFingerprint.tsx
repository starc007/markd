/**
 * CSS-based fingerprint component - no canvas, no Base64 storage
 * Generates beautiful patterns using pure CSS
 */

import { useRef, useState, useEffect } from "react";
import { generateCSSPattern } from "../utils/css-patterns";
import { useVisualIdentityStore } from "../stores/visualIdentityStore";
import type { CSSPatternData } from "../utils/css-patterns";

interface CSSFingerprintProps {
  noteId: string;
  title: string;
  content: string;
  width: number;
  height: number;
  variant?: "thumbnail" | "banner" | "indicator";
  isEditing?: boolean;
  className?: string;
  style?: React.CSSProperties;
  gradientIndex?: number; // Index for generating different gradient variations
}

export function CSSFingerprint({
  noteId,
  title,
  content,
  width,
  height,
  variant = "thumbnail",
  isEditing = false,
  className = "",
  style,
  gradientIndex = 0,
}: CSSFingerprintProps) {
  // Subscribe to regeneration trigger - this will trigger re-render when it changes
  const regenerationTrigger = useVisualIdentityStore(
    (state) => state.regenerationTriggers.get(noteId) || 0
  );

  // Subscribe to fingerprint hash - get it directly from the store
  // We'll use the trigger as a dependency to force re-evaluation
  const fingerprintHash = useVisualIdentityStore((state) => {
    const fp = state.fingerprints.get(noteId);
    const hash = fp?.patternData?.hash as string | undefined;
    const trigger = state.regenerationTriggers.get(noteId) || 0;
    const result = hash || `default-${noteId}-${trigger}`;

    // Return hash with trigger appended to force updates when trigger changes
    return `${result}__trigger__${trigger}`;
  });

  // Extract the actual hash (remove trigger suffix)
  const actualHash = fingerprintHash.split("__trigger__")[0];

  // Generate CSS pattern data - use useState + useEffect for async generation
  const [patternData, setPatternData] = useState<CSSPatternData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function generatePattern() {
      // If gradientIndex is provided, use it to generate different variations
      // This ensures each gradient preview is unique
      let hashInput: string;
      if (
        gradientIndex > 0 ||
        (actualHash && !actualHash.startsWith("default-"))
      ) {
        // Use gradientIndex to create unique hash for each gradient variation
        if (actualHash && !actualHash.startsWith("default-")) {
          // If we have a cached hash, combine it with gradientIndex
          hashInput = `${actualHash}__gradient__${gradientIndex}`;
        } else {
          // Generate unique hash based on note content + gradientIndex
          const baseHash =
            content && content.trim()
              ? `${title}${content}`
              : `${noteId}${title || "Untitled"}`;
          hashInput = `${baseHash}__gradient__${gradientIndex}`;
        }
        const pattern = await generateCSSPattern(
          noteId,
          "",
          hashInput,
          width,
          height
        );
        if (!cancelled) {
          setPatternData(pattern);
        }
      } else {
        // Normal generation without gradient index
        const pattern = await generateCSSPattern(
          noteId,
          title,
          content || "",
          width,
          height
        );
        if (!cancelled) {
          setPatternData(pattern);
        }
      }
    }

    generatePattern();

    return () => {
      cancelled = true;
    };
  }, [
    noteId,
    title,
    content,
    width,
    height,
    regenerationTrigger, // This will change when regenerated, forcing re-computation
    actualHash, // This will change when fingerprint is regenerated
    gradientIndex, // This will change when different gradient is selected
  ]);

  // Fallback pattern while loading
  const finalPatternData = patternData || {
    gradientColors: ["#6366f1", "#8b5cf6"],
    patternType: "mesh" as const,
    cssStyles: {},
    cssClasses: "",
    patternParams: {},
  };

  // Container ref for potential future animations
  const containerRef = useRef<HTMLDivElement>(null);

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    borderRadius:
      variant === "thumbnail" || variant === "indicator" ? "50%" : 0,
    overflow: "hidden",
    position: "relative",
    ...finalPatternData.cssStyles,
    ...style,
  };

  return (
    <div
      ref={containerRef}
      className={`${className} ${finalPatternData.cssClasses}`}
      style={containerStyle}
    >
      {/* Additional pattern layers for depth */}
      {/* <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
          mixBlendMode: "overlay",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 70% 70%, rgba(0,0,0,0.1) 0%, transparent 50%)`,
          mixBlendMode: "multiply",
        }}
      /> */}
    </div>
  );
}
