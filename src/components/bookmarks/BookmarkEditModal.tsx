import { useState, useEffect } from "react";
import { useBookmarkStore } from "../../stores/bookmarkStore";
import { toast } from "sonner";
import type { BookmarkMetadata } from "../../lib/tauri/commands";
import { Modal, ModalFooter } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

interface BookmarkEditModalProps {
  bookmark: BookmarkMetadata | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BookmarkEditModal({
  bookmark,
  isOpen,
  onClose,
}: BookmarkEditModalProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateBookmark } = useBookmarkStore();

  useEffect(() => {
    if (bookmark) {
      setUrl(bookmark.url);
      setTitle(bookmark.title);
      setTags(bookmark.tags || "");
    }
  }, [bookmark]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookmark) return;

    const trimmedUrl = url.trim();
    const trimmedTitle = title.trim();

    if (!trimmedUrl || !trimmedTitle) {
      toast.error("URL and title are required");
      return;
    }

    if (
      !trimmedUrl.startsWith("http://") &&
      !trimmedUrl.startsWith("https://")
    ) {
      toast.error("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateBookmark(bookmark.id, {
        url: trimmedUrl,
        title: trimmedTitle,
        tags: tags.trim() || undefined,
      });

      toast.success("Bookmark updated");
      onClose();
    } catch (error) {
      console.error("Failed to update bookmark:", error);
      toast.error(
        `Failed to update bookmark: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!bookmark) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Bookmark"
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* URL */}
        <div>
          <label
            htmlFor="url"
            className="block text-sm font-medium text-foreground mb-2"
          >
            URL *
          </label>
          <Input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Title *
          </label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Tags */}
        <div>
          <label
            htmlFor="tags"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Tags (comma-separated)
          </label>
          <Input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            disabled={isSubmitting}
            placeholder="tag1, tag2, tag3"
          />
        </div>

        {/* Actions */}
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
