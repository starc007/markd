import { useEffect } from "react";
import { useNoteStore } from "@/stores/noteStore";

/**
 * Hook to handle editor-related event handlers (page navigation, bookmark opening)
 */
export function useEditorEventHandlers() {
  const { loadNote } = useNoteStore();

  // Handle page link navigation
  useEffect(() => {
    const handleNavigateToPage = async (e: CustomEvent<{ pageId: string }>) => {
      try {
        await loadNote(e.detail.pageId);
      } catch (error) {
        console.error("Failed to navigate to page:", error);
        useNoteStore.setState({
          error: `Failed to load page: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });
      }
    };

    window.addEventListener(
      "navigate-to-page",
      handleNavigateToPage as unknown as EventListener
    );
    return () => {
      window.removeEventListener(
        "navigate-to-page",
        handleNavigateToPage as unknown as EventListener
      );
    };
  }, [loadNote]);

  // Handle bookmark URL opening
  useEffect(() => {
    const handleOpenBookmarkUrl = async (e: CustomEvent<{ url: string }>) => {
      try {
        const { openUrl } = await import("@tauri-apps/plugin-opener");
        await openUrl(e.detail.url);
      } catch (error) {
        console.error("Failed to open bookmark URL:", error);
      }
    };

    window.addEventListener(
      "open-bookmark-url",
      handleOpenBookmarkUrl as unknown as EventListener
    );
    return () => {
      window.removeEventListener(
        "open-bookmark-url",
        handleOpenBookmarkUrl as unknown as EventListener
      );
    };
  }, []);
}
