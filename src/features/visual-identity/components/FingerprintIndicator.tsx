import { memo } from "react";
import { NoteFingerprint } from "./NoteFingerprint";

interface FingerprintIndicatorProps {
  noteId: string;
  title: string;
  content: string;
  brightness?: number; // 0-1, shows relevance
  className?: string;
}

export const FingerprintIndicator = memo(function FingerprintIndicator({
  noteId,
  title,
  content,
  brightness = 1,
  className = "",
}: FingerprintIndicatorProps) {
  return (
    <div
      className={className}
      style={{
        opacity: brightness,
        transition: "opacity 0.2s ease-in-out",
      }}
    >
      <NoteFingerprint
        noteId={noteId}
        title={title}
        content={content}
        size={16}
        variant="indicator"
        style={{
          flexShrink: 0,
        }}
      />
    </div>
  );
});
