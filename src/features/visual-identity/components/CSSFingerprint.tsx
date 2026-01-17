/**
 * CSS-based fingerprint component - no canvas, no Base64 storage
 * Generates beautiful patterns using pure CSS
 */

import { useMemo, useRef } from "react";
import { generateCSSPattern } from "../utils/css-patterns";
import { useVisualIdentityStore } from "../stores/visualIdentityStore";

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
}: CSSFingerprintProps) {
  // Subscribe to regeneration triggers to force re-generation
  const regenerationTriggers = useVisualIdentityStore(
    (state) => state.regenerationTriggers
  );
  const regenerationTrigger = regenerationTriggers.get(noteId) || 0;

  // Generate CSS pattern data - regenerates when trigger changes
  const patternData = useMemo(
    () => generateCSSPattern(noteId, title, content || "", width, height),
    [noteId, title, content, width, height, regenerationTrigger]
  );

  // Container ref for potential future animations
  const containerRef = useRef<HTMLDivElement>(null);

  const containerStyle: React.CSSProperties = {
    width: width,
    height: height,
    borderRadius:
      variant === "thumbnail" || variant === "indicator" ? "50%" : 0,
    overflow: "hidden",
    position: "relative",
    ...patternData.cssStyles,
    ...style,
  };

  return (
    <div
      ref={containerRef}
      className={`${className} ${patternData.cssClasses}`}
      style={containerStyle}
    >
      {/* Additional pattern layers for depth */}
      <div
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
      />
    </div>
  );
}
