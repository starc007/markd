import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { useEditor, EditorContent as TiptapEditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { UiState } from "../../lib/tiptap-extension/ui-state-extension";
import { NodeAlignment } from "../../lib/tiptap-extension/node-alignment-extension";
import { NodeBackground } from "../../lib/tiptap-extension/node-background-extension";
import { ListNormalizationExtension } from "../../lib/tiptap-extension/list-normalization-extension";
import { PageLinkExtension } from "../../lib/tiptap-extension/page-link-extension";
import { SlashDropdownMenu } from "./slash-dropdown-menu";
import { FloatingToolbar } from "./floating-toolbar";
import { PageLinkMenu } from "./PageLinkMenu";
import { useNoteStore } from "../../stores/noteStore";
import * as commands from "../../lib/tauri/commands";
import type { NoteMetadata } from "../../lib/tauri/commands";
import type { SuggestionItem } from "../tiptap-ui-utils/suggestion-menu/suggestion-menu-types";
import type { Editor, Range } from "@tiptap/react";
import { FileIcon } from "../tiptap-icons/file-icon";

interface EditorContentProps {
  content: string;
  noteId: string;
  onContentChange: (content: string) => void;
}

export interface EditorContentRef {
  focus: () => void;
  getEditor: () => ReturnType<typeof useEditor> | null;
}

export const EditorContent = forwardRef<EditorContentRef, EditorContentProps>(
  ({ content, noteId, onContentChange }, ref) => {
    const noteIdForLinksRef = useRef<string>(noteId);

    // Update noteId ref when it changes
    useEffect(() => {
      noteIdForLinksRef.current = noteId;
    }, [noteId]);
    const editorRef = useRef<ReturnType<typeof useEditor> | null>(null);
    const saveTimeoutRef = useRef<number | null>(null);
    const switchingTimeoutRef = useRef<number | null>(null);
    const syncTimeoutRef = useRef<number | null>(null);
    const noteIdRef = useRef<string | null>(noteId); // Initialize with current noteId
    const onContentChangeRef = useRef(onContentChange);
    const lastSavedContentRef = useRef<string>("");
    const isSwitchingNotesRef = useRef<boolean>(false);
    const isMountedRef = useRef<boolean>(true); // Track component mount status
    const { loadNote } = useNoteStore();

    // Extract page links from TipTap JSON and sync with backend
    const extractAndSyncPageLinks = async (
      currentNoteId: string,
      json: any
    ) => {
      const pageIds = new Set<string>();

      // Recursively find all pageLink nodes
      const findPageLinks = (node: any) => {
        if (node.type === "pageLink" && node.attrs?.pageId) {
          pageIds.add(node.attrs.pageId);
        }
        if (node.content && Array.isArray(node.content)) {
          node.content.forEach(findPageLinks);
        }
      };

      findPageLinks(json);

      // Sync page links (debounced - only sync after save)
      if (pageIds.size > 0) {
        try {
          await commands.syncPageLinks(currentNoteId, Array.from(pageIds));
        } catch (error) {
          console.error("Failed to sync page links:", error);
        }
      }
    };

    // Keep callback ref updated
    useEffect(() => {
      onContentChangeRef.current = onContentChange;
    }, [onContentChange]);

    // Parse content safely
    const parseContent = (content: string) => {
      if (!content || content.trim() === "") {
        return { type: "doc", content: [{ type: "paragraph" }] };
      }
      try {
        return JSON.parse(content);
      } catch (e) {
        console.error("Failed to parse note content:", e);
        return { type: "doc", content: [{ type: "paragraph" }] };
      }
    };

    console.log("EditorContent content", parseContent(content));

    // Initialize editor
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        Highlight,
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-primary underline",
          },
        }),
        Placeholder.configure({
          placeholder: "Type '/' for commands...",
        }),
        UiState,
        NodeAlignment,
        NodeBackground,
        ListNormalizationExtension,
        PageLinkExtension.configure({
          HTMLAttributes: {
            class: "page-link",
          },
        }),
      ],
      content: parseContent(content),
      editorProps: {
        attributes: {
          class: "tiptap-editor focus:outline-none",
        },
      },
      onUpdate: ({ editor, transaction }) => {
        // Ignore if we're switching notes
        if (isSwitchingNotesRef.current) {
          return;
        }

        // Ignore if this is not a user-initiated change
        if (!transaction.docChanged) {
          return;
        }

        // Clear previous timeout
        if (saveTimeoutRef.current) {
          window.clearTimeout(saveTimeoutRef.current);
        }

        // Debounce saves - save after 500ms of no changes
        saveTimeoutRef.current = window.setTimeout(() => {
          // Prevent execution if component has unmounted
          if (!isMountedRef.current) {
            return;
          }

          if (
            editor &&
            onContentChangeRef.current &&
            !isSwitchingNotesRef.current
          ) {
            const json = editor.getJSON();
            const jsonString = JSON.stringify(json);

            // Only save if content actually changed
            if (jsonString !== lastSavedContentRef.current) {
              lastSavedContentRef.current = jsonString;
              onContentChangeRef.current(jsonString);

              // Extract page links from content and sync
              extractAndSyncPageLinks(noteIdForLinksRef.current, json);
            } else {
            }
          }
        }, 500);
      },
      onCreate: ({ editor }) => {
        editorRef.current = editor;
        // Initialize lastSavedContentRef with current content
        const json = editor.getJSON();
        lastSavedContentRef.current = JSON.stringify(json);
      },
      onDestroy: () => {
        editorRef.current = null;
      },
    });

    // Update content when noteId changes (only when noteId actually changes, not when content updates)
    useEffect(() => {
      if (noteIdRef.current !== noteId && editor) {
        // Set flag to prevent saves during note switch

        isSwitchingNotesRef.current = true;

        noteIdRef.current = noteId;

        // Clear any pending saves
        if (saveTimeoutRef.current) {
          window.clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }

        const json = parseContent(content);

        // Use emitUpdate: false to prevent onUpdate event
        editor.commands.setContent(json, {
          emitUpdate: false,
        });

        // Reset last saved content when switching notes (use the content prop as-is since it's already JSON string)
        lastSavedContentRef.current = content || JSON.stringify(json);

        // Reset flag after a short delay to allow any pending updates to complete
        if (switchingTimeoutRef.current) {
          window.clearTimeout(switchingTimeoutRef.current);
        }

        switchingTimeoutRef.current = window.setTimeout(() => {
          if (isMountedRef.current) {
            isSwitchingNotesRef.current = false;
          }
          switchingTimeoutRef.current = null;
        }, 100);
      }
    }, [noteId, editor, content]); // Include content to update when note content changes

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      focus: () => {
        if (editor) {
          editor.commands.focus();
          // Move cursor to end of content
          const { from, to } = editor.state.selection;
          const docSize = editor.state.doc.content.size;
          if (from === to && from < docSize) {
            editor.commands.setTextSelection(docSize);
          }
        }
      },
      getEditor: () => editor,
    }));

    // Save on window blur
    useEffect(() => {
      const handleWindowBlur = () => {
        // Don't save if component unmounted or switching notes
        if (!isMountedRef.current || isSwitchingNotesRef.current) {
          return;
        }

        if (editor && saveTimeoutRef.current) {
          window.clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
        if (editor) {
          const json = editor.getJSON();
          const jsonString = JSON.stringify(json);

          // Only save if content actually changed
          if (jsonString !== lastSavedContentRef.current) {
            lastSavedContentRef.current = jsonString;
            onContentChangeRef.current(jsonString);
          }
        }
      };

      window.addEventListener("blur", handleWindowBlur);
      return () => window.removeEventListener("blur", handleWindowBlur);
    }, [editor]);

    // Handle page link navigation
    useEffect(() => {
      const handleNavigateToPage = async (
        e: CustomEvent<{ pageId: string }>
      ) => {
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

    // Cleanup on unmount
    useEffect(() => {
      // Set mounted flag on mount
      isMountedRef.current = true;

      return () => {
        // Mark component as unmounted FIRST to prevent any pending callbacks from executing
        isMountedRef.current = false;

        // Clear all pending timeouts
        if (saveTimeoutRef.current) {
          window.clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
        if (switchingTimeoutRef.current) {
          window.clearTimeout(switchingTimeoutRef.current);
          switchingTimeoutRef.current = null;
        }
        if (syncTimeoutRef.current) {
          window.clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = null;
        }

        // Don't save on unmount if we're switching notes
        if (editor && !isSwitchingNotesRef.current) {
          const json = editor.getJSON();
          const jsonString = JSON.stringify(json);

          // Only save if content actually changed
          if (jsonString !== lastSavedContentRef.current) {
            lastSavedContentRef.current = jsonString;
            onContentChangeRef.current(jsonString);
          }
        }
      };
    }, [editor]);

    if (!editor) {
      return null;
    }

    // Custom slash menu items
    const customSlashItems: SuggestionItem[] = [
      {
        title: "Page",
        subtext: "Create a sub-page and link it here",
        keywords: ["page", "new page", "link"],
        badge: FileIcon,
        group: "Basic",
        onSelect: ({ editor, range }: { editor: Editor; range: Range }) => {
          if (!range) {
            console.error(
              "[EditorContent./page] No range provided for page creation"
            );
            return;
          }

          const currentNoteId = noteIdForLinksRef.current;

          // Check if we have a current note to create sub-page
          if (!currentNoteId) {
            console.error(
              "[EditorContent./page] No current note to create sub-page"
            );
            return;
          }

          // Store the range where the command was typed
          const insertPosition = range.from;

          // Defer async operation to allow TipTap transaction to complete first
          // This prevents blocking the editor state and ensures the transaction completes
          // Use queueMicrotask to ensure it runs after the current transaction
          queueMicrotask(() => {
            // Check if editor is still valid before proceeding
            if (editor.isDestroyed) {
              console.error(
                "[EditorContent./page] Editor is destroyed, cannot create sub-page"
              );
              return;
            }

            // Call backend directly to avoid blocking store's isLoading state
            // This prevents freezing the UI when creating subpages via /page command
            commands
              .createSubpage(currentNoteId, "Untitled")
              .then(async (newPage) => {
                // Check again if editor is still valid after async operation
                if (editor.isDestroyed) {
                  console.error(
                    "Editor was destroyed during sub-page creation"
                  );
                  return;
                }

                if (!newPage) {
                  console.error("Failed to create sub-page: no page returned");
                  return;
                }

                // Reload the full note data from database to ensure we have correct content
                const fullNote = await commands.getNote(newPage.id);
                if (!fullNote) {
                  console.error("Failed to load created sub-page");
                  return;
                }

                // Manually update store state without blocking (no isLoading: true)
                // This allows other operations to continue while we update the UI
                const { childrenMap, notes, expandedPages, loadedChildren } =
                  useNoteStore.getState();
                const metadata = {
                  id: fullNote.id,
                  title: fullNote.title,
                  preview: null,
                  folder_id: fullNote.folder_id,
                  parent_id: fullNote.parent_id,
                  pinned: false,
                  children_count: 0,
                  created_at: fullNote.created_at,
                  updated_at: fullNote.updated_at,
                };

                // Add to parent's children
                const newMap = new Map(childrenMap);
                const parentChildren = newMap.get(currentNoteId) || [];
                newMap.set(currentNoteId, [metadata, ...parentChildren]);

                // Update parent's children_count in notes list if visible
                const updatedNotes = notes.map((n: NoteMetadata) =>
                  n.id === currentNoteId
                    ? { ...n, children_count: n.children_count + 1 }
                    : n
                );

                // Update parent's children_count in childrenMap if it's a child itself
                for (const [parentIdKey, children] of newMap.entries()) {
                  const childrenArray = children as NoteMetadata[];
                  const updatedChildren = childrenArray.map((n: NoteMetadata) =>
                    n.id === currentNoteId
                      ? { ...n, children_count: n.children_count + 1 }
                      : n
                  );
                  if (
                    updatedChildren.some(
                      (n: NoteMetadata) => n.id === currentNoteId
                    )
                  ) {
                    newMap.set(parentIdKey, updatedChildren);
                  }
                }

                // Automatically expand parent and mark as loaded so subpage is visible
                const newExpanded = new Set(expandedPages);
                newExpanded.add(currentNoteId);
                const newLoaded = new Set(loadedChildren);
                newLoaded.add(currentNoteId);

                // Update store without setting isLoading (non-blocking)
                useNoteStore.setState({
                  childrenMap: newMap,
                  notes: updatedNotes,
                  expandedPages: newExpanded,
                  loadedChildren: newLoaded,
                  // Don't change currentNote - keep user on parent page
                });

                // Insert page link at the position where /page was typed
                // Get fresh editor state to ensure position is still valid
                try {
                  const currentState = editor.state;
                  if (!currentState || !currentState.doc) {
                    console.error(
                      "Invalid editor state, cannot insert page link"
                    );
                    return;
                  }

                  const docSize = currentState.doc.content.size;

                  // Use current selection position if available, otherwise use stored position
                  const currentFrom = currentState.selection.from;
                  const safePosition =
                    currentFrom >= 0 && currentFrom <= docSize
                      ? currentFrom
                      : Math.min(insertPosition, docSize);

                  // Ensure position is valid
                  if (safePosition < 0 || safePosition > docSize) {
                    console.error(
                      `Invalid insert position: ${safePosition}, docSize: ${docSize}`
                    );
                    return;
                  }

                  editor
                    .chain()
                    .focus()
                    .insertContentAt(safePosition, [
                      {
                        type: "pageLink",
                        attrs: {
                          pageId: newPage.id,
                          pageTitle: newPage.title,
                        },
                      },
                      {
                        type: "text",
                        text: " ",
                      },
                    ])
                    .run();

                  console.log(
                    "[EditorContent./page] Page link inserted, waiting for save trigger",
                    {
                      noteId: currentNoteId,
                      timestamp: new Date().toISOString(),
                    }
                  );

                  // Ensure isSaving is reset after inserting content
                  // The editor's onUpdate will trigger a save, but we need to ensure
                  // isSaving doesn't get stuck if something goes wrong
                  if (syncTimeoutRef.current) {
                    window.clearTimeout(syncTimeoutRef.current);
                  }
                  syncTimeoutRef.current = window.setTimeout(() => {
                    if (!isMountedRef.current) {
                      syncTimeoutRef.current = null;
                      return;
                    }

                    try {
                      if (!editor.isDestroyed) {
                        const json = editor.getJSON();
                        const currentIsSaving =
                          useNoteStore.getState().isSaving;
                        console.log("[EditorContent./page] After 100ms delay", {
                          noteId: currentNoteId,
                          isSaving: currentIsSaving,
                          timestamp: new Date().toISOString(),
                        });

                        extractAndSyncPageLinks(currentNoteId, json);
                      }
                    } catch (error) {
                      console.error(
                        "[EditorContent./page] Error syncing page links",
                        {
                          noteId: currentNoteId,
                          error: String(error),
                          errorStack:
                            error instanceof Error ? error.stack : undefined,
                          timestamp: new Date().toISOString(),
                        }
                      );
                      // Reset isSaving on error
                      useNoteStore.setState({ isSaving: false });
                      console.log(
                        "[EditorContent./page] Set isSaving: false (after sync error)"
                      );
                    }
                    syncTimeoutRef.current = null;
                  }, 100);
                } catch (error) {
                  console.error("Failed to insert page link:", error);
                }
              })
              .catch((error) => {
                console.error("Failed to create sub-page:", error);
              });
          });
        },
      },
    ];

    return (
      <div className="relative">
        <TiptapEditorContent editor={editor}>
          <SlashDropdownMenu
            editor={editor}
            config={{
              customItems: customSlashItems,
            }}
          />
          <PageLinkMenu />
          <FloatingToolbar editor={editor} />
        </TiptapEditorContent>
      </div>
    );
  }
);

EditorContent.displayName = "EditorContent";
