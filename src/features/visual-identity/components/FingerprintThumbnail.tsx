import { memo } from "react";
import { NoteFingerprint } from "./NoteFingerprint";

interface FingerprintThumbnailProps {
  noteId: string;
  title: string;
  content: string;
  className?: string;
}

export const FingerprintThumbnail = memo(function FingerprintThumbnail({
  noteId,
  title,
  content,
  className = "",
}: FingerprintThumbnailProps) {
  return (
    <NoteFingerprint
      noteId={noteId}
      title={title}
      content={content}
      size={20}
      variant="thumbnail"
      className={className}
      style={{
        flexShrink: 0,
      }}
    />
  );
});
