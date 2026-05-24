import { useCallback, useState, useRef, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreVerticalIcon,
  DeleteIcon,
  Download01Icon,
  CheckmarkCircle01Icon,
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
import { WordCountStats } from "./WordCountStats";
import { AppProvider } from "@/context/app-context";
import { formatRelativeTime } from "@/lib/utils";
import { Banner, type BannerType } from "@/features/visual-identity/components";
import { deleteBannerImage } from "@/lib/tauri/commands";
import { normalizeBannerType } from "@/features/visual-identity/utils/util";

interface EditorProps {
  noteId: string;
  content: string;
}

export function Editor({ noteId, content }: EditorProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editorInstance, setEditorInstance] = useState<ReturnType<
    EditorContentRef["getEditor"]
  > | null>(null);
  const editorRef = useRef<EditorContentRef>(null);
  const titleRef = useRef<EditorTitleRef>(null);
  const hasFocusedRef = useRef<string | null>(null);

  const newlyCreatedNoteId = useNoteStore((state) => state.newlyCreatedNoteId);
  const isSaving = useNoteStore((state) => state.isSaving);
  const focusMode = useUIStore((state) => state.focusMode);
  const activeTab = useTabStore((state) => state.getActiveTab());
  const { updateTabContent, updateTabTitle, getTab } = useTabStore();
  const [bannerType, setBannerType] = useState<BannerType>(
    normalizeBannerType(activeTab?.bannerType),
  );

  // Sync bannerType state when active tab changes (e.g., switching notes)
  useEffect(() => {
    setBannerType(normalizeBannerType(activeTab?.bannerType));
  }, [activeTab?.bannerType]);

  const updatedAt = activeTab?.updatedAt || 0;

  // Auto-focus title when a new note is created
  const currentFlag = useNoteStore.getState().newlyCreatedNoteId;
  useEffect(() => {
    // Check if this note is the newly created one
    const shouldFocus = currentFlag === noteId;
    
    if (shouldFocus && hasFocusedRef.current !== noteId) {
      // Reset focus tracking for this note
      hasFocusedRef.current = null;
      
      // Try to focus immediately, then retry with delays to ensure it works
      const focusTitle = () => {
        // Check flag again before focusing (in case it was cleared)
        const currentFlag = useNoteStore.getState().newlyCreatedNoteId;
        
        if (currentFlag === noteId && titleRef.current && hasFocusedRef.current !== noteId) {
          try {
            titleRef.current.focus();
            // Select all text if it's "Untitled" or empty so user can immediately type
            const currentValue = titleRef.current.getValue();
            if (currentValue === "Untitled" || currentValue === "") {
              titleRef.current.selectAll();
            }
            // Mark as focused for this note
            hasFocusedRef.current = noteId;
            // Clear the flag after a short delay to ensure focus is complete
            setTimeout(() => {
              if (useNoteStore.getState().newlyCreatedNoteId === noteId) {
                useNoteStore.setState({ newlyCreatedNoteId: null });
              }
            }, 100);
          } catch (error) {
            // Silently fail if focus doesn't work yet
            console.debug("[Editor] Failed to focus title:", error);
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
    } else if (!shouldFocus) {
      // Reset focus tracking when note changes or flag doesn't match
      hasFocusedRef.current = null;
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

  // Handle banner type change
  const handleBannerChange = useCallback(
    async (type: BannerType) => {
      setBannerType(type);
      // Save banner type to database
      // Always pass banner_type, even if "none" (pass null to clear it)
      try {
        const bannerValue = type === "none" ? "none" : type;
        
        // If removing banner and it was a custom image, delete the image from DB
        if (type === "none" && bannerType?.startsWith("custom-")) {
          try {
            await deleteBannerImage(noteId);
          } catch (error) {
            console.error("Failed to delete banner image:", error);
          }
        }
        
        await useNoteStore.getState().updateNote(noteId, {
          banner_type: bannerValue,
        });
        if (activeTab?.id)
          useTabStore.getState().updateTabBannerType(activeTab.id, bannerValue);
      } catch (error) {
        console.error("Failed to save banner type:", error);
      }
    },
    [noteId, bannerType, activeTab?.id],
  );

  // Content save handler (already debounced in EditorContent)
  const handleContentChange = useCallback(
    (newContent: string) => {
      // Don't clear newlyCreatedNoteId here - let the focus effect handle it
      // Only clear it after focus succeeds or when user explicitly interacts

      // CRITICAL: Get active tab and check content BEFORE updating tab
      // This prevents the save check from failing after tab content is updated
      const activeTab = useTabStore.getState().getActiveTab();
      const shouldSave =
        activeTab &&
        activeTab.id === noteId &&
        activeTab.content !== newContent;

      // Update tab content if tab exists
      const tab = getTab(noteId);
      if (tab && tab.content !== newContent) {
        updateTabContent(noteId, newContent);
      }

      // Save to database if content actually changed
      if (shouldSave) {
        useNoteStore.getState().saveCurrentNoteContent(newContent);
      }
    },
    [noteId, getTab, updateTabContent],
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
    [noteId, getTab, updateTabTitle],
  );

  // Handle Enter in title to focus content editor
  const handleTitleEnter = useCallback(() => {
    // Clear the newlyCreatedNoteId flag when user explicitly moves to editor
    if (useNoteStore.getState().newlyCreatedNoteId === noteId) {
      useNoteStore.setState({ newlyCreatedNoteId: null });
    }
    editorRef.current?.focus();
  }, [noteId]);

  // Track editor instance when it becomes available
  useEffect(() => {
    // Reset editor instance when note changes
    setEditorInstance(null);

    const checkEditor = () => {
      const editor = editorRef.current?.getEditor();
      if (editor) {
        setEditorInstance(editor);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkEditor()) {
      return;
    }

    // Check periodically until editor is available
    const interval = setInterval(() => {
      if (checkEditor()) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
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
      <div className="draft-editor-surface flex-1 flex flex-col h-full overflow-hidden bg-background">
        {!focusMode && (
          <div
            className="draft-editor-topbar shrink-0 flex items-center justify-between px-5"
            data-tauri-drag-region
          >
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground [-webkit-app-region:no-drag]">
              <span className="font-medium tracking-[0.08em] uppercase">
                Draft
              </span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/35" />
              <span className="truncate">
                Edited {formatRelativeTime(updatedAt)}
              </span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/35" />
              <span className="inline-flex items-center gap-1.5">
                <HugeiconsIcon
                  icon={CheckmarkCircle01Icon}
                  size={14}
                  color="currentColor"
                  strokeWidth={1.7}
                  className={isSaving ? "opacity-35" : "text-emerald-600 dark:text-emerald-400"}
                />
                {isSaving ? "Saving" : "Saved"}
              </span>
            </div>

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

        <div className="draft-editor-scroll flex-1 overflow-y-auto">
          {!focusMode && bannerType !== "none" && (
            <Banner
              bannerType={bannerType}
              title={activeTab?.title || ""}
              noteId={noteId}
              onBannerChange={handleBannerChange}
            />
          )}
          <article className="draft-editor-page mx-auto">
            <EditorTitle
              ref={titleRef}
              title={activeTab?.title || ""}
              onTitleChange={handleTitleChange}
              onEnter={handleTitleEnter}
              onBannerChange={handleBannerChange}
              currentBanner={bannerType}
              noteId={noteId}
            />

            <AppProvider>
              <EditorContent
                ref={editorRef}
                noteId={noteId}
                content={content}
                onContentChange={handleContentChange}
              />
            </AppProvider>

            <footer className="draft-editor-footer">
              <WordCountStats editor={editorInstance} />
            </footer>
          </article>
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
