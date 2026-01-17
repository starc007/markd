import { memo } from "react";
import { CSSFingerprint } from "./CSSFingerprint";

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
  // Use empty string if content is not provided (will use noteId+title for hash)
  const contentForFingerprint = content || "";

  return (
    <CSSFingerprint
      noteId={noteId}
      title={title || "Untitled"}
      content={contentForFingerprint}
      width={20}
      height={20}
      variant="thumbnail"
      className={className}
      style={{
        flexShrink: 0,
      }}
    />
  );
});
