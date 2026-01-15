import { useCallback, useState, useRef, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreVerticalIcon,
  DeleteIcon,
  Download01Icon,
} from "@hugeicons/core-free-icons";
import { save } from "@tauri-apps/plugin-dialog";
import { useNoteStore } from "@/stores/noteStore";
import { useTabStore } from "@/stores/tabStore";
import { useUIStore } from "@/stores/uiStore";
import { fixedShortcuts } from "@/lib/keyboard-shortcuts";
import { matchesShortcut } from "@/hooks/useKeyboardShortcuts";
import {
  IconButton,
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "../ui";
import { DeleteNoteModal } from "@/components/DeleteNoteModal";
import { EditorTitle, type EditorTitleRef } from "./EditorTitle";
import { EditorContent, type EditorContentRef } from "./EditorContent";
import { AppProvider } from "@/context/app-context";
import { formatRelativeTime } from "@/lib/utils";

interface EditorProps {
  noteId: string;
  content: string;
}

export function Editor({ noteId, content }: EditorProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const editorRef = useRef<EditorContentRef>(null);
  const titleRef = useRef<EditorTitleRef>(null);

  const newlyCreatedNoteId = useNoteStore((state) => state.newlyCreatedNoteId);
  const focusMode = useUIStore((state) => state.focusMode);
  const activeTab = useTabStore((state) => state.getActiveTab());
  const { updateTabContent, updateTabTitle, getTab } = useTabStore();

  const updatedAt = activeTab?.updatedAt || 0;

  // Auto-focus title when a new note is created
  // This effect has priority and should run first
  useEffect(() => {
    if (newlyCreatedNoteId === noteId) {
      // Try to focus immediately, then retry with delays to ensure it works
      const focusTitle = () => {
        // Check flag again before focusing (in case it was cleared)
        const currentFlag = useNoteStore.getState().newlyCreatedNoteId;
        if (currentFlag === noteId && titleRef.current) {
          titleRef.current.focus();
          // Select all text if it's "Untitled" so user can immediately type
          // Access the textarea element directly via DOM query
          const textarea = document.querySelector(
            `textarea[placeholder="Untitled"]`
          ) as HTMLTextAreaElement;
          if (
            textarea &&
            (textarea.value === "Untitled" || textarea.value === "")
          ) {
            textarea.select();
          }
        }
      };

      // Try immediately
      focusTitle();

      // Retry with delays to ensure it works even if component isn't fully ready
      const timeout1 = setTimeout(focusTitle, 50);

      return () => {
        clearTimeout(timeout1);
      };
    }
  }, [newlyCreatedNoteId, noteId]);

  // // Helper function to check if content has actual text (not just empty/default structure)
  // const hasContent = useCallback((contentStr: string): boolean => {
  //   try {
  //     const parsed = JSON.parse(contentStr);
  //     // Default content is: {"type":"doc","content":[{"type":"paragraph"}]}
  //     // Check if there's actual text content
  //     const hasText = (node: any): boolean => {
  //       if (node.type === "text" && node.text && node.text.trim().length > 0) {
  //         return true;
  //       }
  //       if (node.content && Array.isArray(node.content)) {
  //         return node.content.some(hasText);
  //       }
  //       return false;
  //     };
  //     return hasText(parsed);
  //   } catch {
  //     // If parsing fails, assume it has content (better safe than sorry)
  //     return true;
  //   }
  // }, []);

  // Clear newlyCreatedNoteId when user starts typing in title or when note changes
  useEffect(() => {
    // Clear the flag when navigating to a different note
    if (newlyCreatedNoteId && newlyCreatedNoteId !== noteId) {
      useNoteStore.setState({ newlyCreatedNoteId: null });
    }
  }, [noteId, newlyCreatedNoteId]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    useNoteStore.getState().loadNotes(undefined, null);
  }, []);

  // Handle delete
  const handleDelete = useCallback(async () => {
    await useNoteStore.getState().deleteNote(noteId);
    setShowDeleteModal(false);
    handleBack();
  }, [noteId, handleBack]);

  // Handle export
  const handleExport = useCallback(async () => {
    const activeTab = useTabStore.getState().getActiveTab();
    if (!activeTab) return;

    const filePath = await save({
      defaultPath: `${activeTab.title || "untitled"}.md`,
      filters: [{ name: "Markdown", extensions: ["md"] }],
    });

    if (filePath) {
      await useNoteStore.getState().exportCurrentNote(filePath);
    }
  }, []);

  // Content save handler (already debounced in EditorContent)
  const handleContentChange = useCallback(
    (newContent: string) => {
      // Clear the newlyCreatedNoteId flag when user starts typing in editor
      // This allows normal editor focus behavior after user explicitly moves to editor
      if (useNoteStore.getState().newlyCreatedNoteId === noteId) {
        useNoteStore.setState({ newlyCreatedNoteId: null });
      }

      // Update tab content if tab exists
      const tab = getTab(noteId);
      if (tab && tab.content !== newContent) {
        updateTabContent(noteId, newContent);
      }

      // CRITICAL: Verify we're still on the same note before saving
      // This prevents saving content to the wrong note when switching quickly
      const activeTab = useTabStore.getState().getActiveTab();
      if (
        activeTab &&
        activeTab.id === noteId &&
        activeTab.content !== newContent
      ) {
        useNoteStore.getState().saveCurrentNoteContent(newContent);
      }
    },
    [noteId, getTab, updateTabContent]
  );

  // Title change handler
  const handleTitleChange = useCallback(
    (title: string) => {
      // Don't clear newlyCreatedNoteId here - let user type freely in title
      // The flag will be cleared when they press Enter or start typing in editor
      // Use "Untitled" only for saving/display, but allow empty during editing
      const displayTitle = title.trim() || "Untitled";

      // Update tab title if tab exists
      const tab = getTab(noteId);
      if (tab && tab.title !== displayTitle) {
        updateTabTitle(noteId, displayTitle);
      }

      // Only update if the display title (with "Untitled" fallback) is different
      // This allows the user to clear the title without it immediately coming back
      if (tab && displayTitle !== (tab.title || "Untitled")) {
        useNoteStore.getState().updateNote(noteId, { title: displayTitle });
      }
    },
    [noteId, getTab, updateTabTitle]
  );

  // Handle Enter in title to focus content editor
  const handleTitleEnter = useCallback(() => {
    // Clear the newlyCreatedNoteId flag when user explicitly moves to editor
    if (useNoteStore.getState().newlyCreatedNoteId === noteId) {
      useNoteStore.setState({ newlyCreatedNoteId: null });
    }
    editorRef.current?.focus();
  }, [noteId]);

  // Keyboard shortcuts: Cmd+Shift+D to open delete modal, Cmd+Enter to confirm when modal is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;

      // Don't handle shortcuts when typing in inputs/textarea (except for modifier combinations)
      if (
        !isMod &&
        (target?.tagName === "INPUT" ||
          target?.tagName === "TEXTAREA" ||
          (target?.isContentEditable && !target.closest(".tiptap-editor")))
      ) {
        return;
      }

      // Cmd+Shift+D: Open delete modal
      if (matchesShortcut(e, fixedShortcuts.deleteNote)) {
        e.preventDefault();
        setShowDeleteModal(true);
        return;
      }

      // Cmd+Enter: Confirm deletion when modal is open
      if (matchesShortcut(e, fixedShortcuts.confirmDelete) && showDeleteModal) {
        e.preventDefault();
        handleDelete();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDeleteModal, handleDelete]);

  return (
    <>
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        {/* Header with drag region - hidden in focus mode */}
        {!focusMode && (
          <div
            className="pt-2 shrink-0 flex items-center justify-between px-4"
            data-tauri-drag-region
          >
            <div className="flex items-center gap-3 [-webkit-app-region:no-drag]">
              <span className="font-medium text-muted-foreground truncate text-xs">
                Edited {formatRelativeTime(updatedAt)}
              </span>
            </div>

            {/* Dropdown Menu */}
            <div className="[-webkit-app-region:no-drag]">
              <Dropdown>
                <DropdownTrigger>
                  <IconButton size="sm" title="More options">
                    <HugeiconsIcon
                      icon={MoreVerticalIcon}
                      size={20}
                      color="currentColor"
                      strokeWidth={1.5}
                    />
                  </IconButton>
                </DropdownTrigger>

                <DropdownContent align="end" className="w-48">
                  <DropdownItem onClick={handleExport}>
                    <HugeiconsIcon
                      icon={Download01Icon}
                      size={16}
                      color="currentColor"
                      strokeWidth={1.5}
                      className="text-muted-foreground"
                    />
                    Export as Markdown
                  </DropdownItem>

                  <DropdownSeparator />

                  <DropdownItem
                    onClick={() => setShowDeleteModal(true)}
                    variant="destructive"
                  >
                    <HugeiconsIcon
                      icon={DeleteIcon}
                      size={16}
                      color="currentColor"
                      strokeWidth={1.5}
                    />
                    Delete note
                  </DropdownItem>
                </DropdownContent>
              </Dropdown>
            </div>
          </div>
        )}

        {/* Editor Content - Notion style */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[900px] mx-auto px-12 py-8">
            {/* Title Editor */}
            <EditorTitle
              ref={titleRef}
              title={activeTab?.title || ""}
              noteId={noteId}
              onTitleChange={handleTitleChange}
              onEnter={handleTitleEnter}
            />

            {/* Content Editor */}
            <AppProvider>
              <EditorContent
                ref={editorRef}
                noteId={noteId}
                content={content}
                onContentChange={handleContentChange}
              />
            </AppProvider>
          </div>
        </div>
      </div>

      <DeleteNoteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        noteTitle={activeTab?.title}
      />
    </>
  );
}
