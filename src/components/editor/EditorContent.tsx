import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Checklist from "@editorjs/checklist";
import Quote from "@editorjs/quote";
import Code from "@editorjs/code";
import Delimiter from "@editorjs/delimiter";
import LinkTool from "@editorjs/link";
import Marker from "@editorjs/marker";
import InlineCode from "@editorjs/inline-code";
import Underline from "@editorjs/underline";
import {
  markdownToBlocks,
  blocksToMarkdown,
} from "../../lib/editorjs/converter";

interface EditorContentProps {
  content: string;
  noteId: string;
  onContentChange: (content: string) => void;
}

export interface EditorContentRef {
  focus: () => void;
  getEditor: () => EditorJS | null;
}

export const EditorContent = forwardRef<EditorContentRef, EditorContentProps>(
  ({ content, noteId, onContentChange }, ref) => {
    const editorRef = useRef<EditorJS | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const noteIdRef = useRef<string | null>(null);
    const saveTimeoutRef = useRef<number | null>(null);
    const isInitializingRef = useRef(false);
    const isDestroyedRef = useRef(false);
    const onContentChangeRef = useRef(onContentChange);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      focus: async () => {
        // Focus the first block in Editor.js
        if (editorRef.current && containerRef.current) {
          try {
            // Wait for editor to be ready
            await editorRef.current.isReady;

            // Find the first block and focus it
            const firstBlock = containerRef.current.querySelector(
              ".ce-block"
            ) as HTMLElement;

            if (firstBlock) {
              firstBlock.focus();
              // Try to place cursor at the start
              const firstContentEditable = firstBlock.querySelector(
                "[contenteditable]"
              ) as HTMLElement;
              if (firstContentEditable) {
                firstContentEditable.focus();
                // Move cursor to start
                const range = document.createRange();
                const selection = window.getSelection();
                if (selection) {
                  range.selectNodeContents(firstContentEditable);
                  range.collapse(true);
                  selection.removeAllRanges();
                  selection.addRange(range);
                }
              }
            } else {
              // If no blocks exist, focus the container and Editor.js will create a new block
              containerRef.current.focus();
            }
          } catch (error) {
            console.warn("Error focusing editor:", error);
            containerRef.current?.focus();
          }
        }
      },
      getEditor: () => editorRef.current,
    }));

    // Keep callback ref updated
    useEffect(() => {
      onContentChangeRef.current = onContentChange;
    }, [onContentChange]);

    // Manual save function
    const saveContent = useRef(async () => {
      if (!editorRef.current || isDestroyedRef.current) return;

      try {
        const outputData = await editorRef.current.save();
        if (outputData && outputData.blocks && onContentChangeRef.current) {
          const markdown = blocksToMarkdown(outputData.blocks);
          onContentChangeRef.current(markdown);
        }
      } catch (error) {
        console.error("Error in manual save:", error);
      }
    });

    // Periodic save as fallback (every 3 seconds)
    useEffect(() => {
      if (!editorRef.current) return;

      const interval = setInterval(() => {
        if (editorRef.current && !isDestroyedRef.current) {
          saveContent.current();
        }
      }, 3000);

      return () => clearInterval(interval);
    }, [noteId]);

    // Save on window blur (user switches away)
    useEffect(() => {
      const handleWindowBlur = () => {
        if (editorRef.current && !isDestroyedRef.current) {
          setTimeout(() => {
            saveContent.current();
          }, 100);
        }
      };

      window.addEventListener("blur", handleWindowBlur);
      return () => window.removeEventListener("blur", handleWindowBlur);
    }, [noteId]);

    // Initialize editor - only when noteId changes
    useEffect(() => {
      // Skip if already initialized for this note
      if (
        noteIdRef.current === noteId &&
        editorRef.current &&
        !isDestroyedRef.current
      ) {
        return;
      }

      // Skip if already initializing or container not ready
      if (
        isInitializingRef.current ||
        !containerRef.current ||
        isDestroyedRef.current
      ) {
        return;
      }

      const initializeEditor = async () => {
        isInitializingRef.current = true;
        isDestroyedRef.current = false;

        // Clean up previous editor
        if (editorRef.current) {
          try {
            // Check if destroy method exists and editor is ready
            if (typeof (editorRef.current as any).destroy === "function") {
              (editorRef.current as any).destroy();
            }
          } catch (error) {
            console.warn("Error destroying editor:", error);
          }
          editorRef.current = null;
        }

        // Clear container
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }

        noteIdRef.current = noteId;

        // Convert markdown to blocks
        const blocks = markdownToBlocks(content);

        try {
          if (!containerRef.current) {
            isInitializingRef.current = false;
            return;
          }

          // Initialize Editor.js
          const editor = new EditorJS({
            holder: containerRef.current as HTMLElement,
            data: {
              blocks,
            },
            placeholder: "Type '/' for commands...",
            tools: {
              header: {
                class: Header as any,
                // config: {
                //   levels: [1, 2, 3],
                //   defaultLevel: 1,
                // },
                toolbox: [
                  {
                    title: "Heading 1",
                    data: {
                      level: 1,
                    },
                    icon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-h1'><path d='M4 6h16'/><path d='M4 12h16'/><path d='M4 18h16'/></svg>",
                  },
                  {
                    title: "Heading 2",
                    data: {
                      level: 2,
                    },
                    icon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-h2'><path d='M4 6h16'/><path d='M4 12h16'/><path d='M4 18h16'/></svg>",
                  },
                  {
                    title: "Heading 3",
                    data: {
                      level: 3,
                    },
                    icon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-h3'><path d='M4 6h16'/><path d='M4 12h16'/><path d='M4 18h16'/></svg>",
                  },
                ],
              },
              list: {
                class: List,
                inlineToolbar: true,
              },
              checklist: {
                class: Checklist,
                inlineToolbar: true,
              },
              quote: {
                class: Quote,
                inlineToolbar: true,
              },
              code: Code,
              delimiter: Delimiter,
              linkTool: {
                class: LinkTool,
                config: {
                  endpoint: "", // We'll handle links manually
                },
              },
              marker: {
                class: Marker,
                shortcut: "CMD+SHIFT+M",
              },
              inlineCode: {
                class: InlineCode,
                shortcut: "CMD+E",
              },
              underline: Underline,
            },
            onChange: async (_api) => {
              const currentEditor = editorRef.current;

              // Don't check isDestroyedRef here - onChange can fire during normal operation
              if (!currentEditor) {
                return;
              }

              try {
                // Ensure editor is ready before saving
                await currentEditor.isReady;

                const outputData = await currentEditor.save();
                console.log("Editor save result:", outputData);

                if (!outputData || !outputData.blocks) {
                  return;
                }

                const markdown = blocksToMarkdown(outputData.blocks);
                console.log("Converted markdown:", markdown);

                // Clear previous timeout
                if (saveTimeoutRef.current) {
                  window.clearTimeout(saveTimeoutRef.current);
                }

                // Debounce saves - save after 500ms of no changes
                saveTimeoutRef.current = window.setTimeout(() => {
                  // Only check if editor still exists and callback is available
                  if (editorRef.current && onContentChangeRef.current) {
                    console.log("Calling onContentChange with:", markdown);
                    onContentChangeRef.current(markdown);
                  } else {
                    console.log("Skipping onContentChange", {
                      hasEditor: !!editorRef.current,
                      hasCallback: !!onContentChangeRef.current,
                      isDestroyed: isDestroyedRef.current,
                    });
                  }
                }, 500);
              } catch (error) {
                console.error("Error saving editor content:", error);
              }
            },
            minHeight: 0,
          });

          // Wait for editor to be ready
          await editor.isReady;

          // Set editor ref BEFORE marking as not initializing
          // This ensures onChange handlers can access it
          editorRef.current = editor;
          isInitializingRef.current = false;

          console.log("Editor initialized and ready", {
            hasEditor: !!editorRef.current,
            noteId: noteIdRef.current,
          });
        } catch (error) {
          console.error("Error initializing editor:", error);
          isInitializingRef.current = false;
        }
      };

      initializeEditor();

      return () => {
        // Save any pending changes before destroying
        if (saveTimeoutRef.current) {
          window.clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }

        // Try to save current content before destroying
        if (editorRef.current && !isDestroyedRef.current) {
          editorRef.current
            .save()
            .then((outputData) => {
              if (
                outputData &&
                outputData.blocks &&
                onContentChangeRef.current
              ) {
                const markdown = blocksToMarkdown(outputData.blocks);
                onContentChangeRef.current(markdown);
              }
            })
            .catch((error) => {
              console.warn("Error saving before destroy:", error);
            });
        }

        isDestroyedRef.current = true;
        if (editorRef.current) {
          try {
            // Check if destroy method exists and call it
            if (typeof (editorRef.current as any).destroy === "function") {
              (editorRef.current as any).destroy();
            }
          } catch (error) {
            console.warn("Error destroying editor:", error);
          }
          editorRef.current = null;
        }
        isInitializingRef.current = false;
      };
    }, [noteId]); // Only depend on noteId, use ref for callback

    return (
      <div
        ref={containerRef}
        className="editorjs-container"
        style={{ minHeight: "200px" }}
      />
    );
  }
);

EditorContent.displayName = "EditorContent";
