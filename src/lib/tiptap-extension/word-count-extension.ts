import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export interface WordCountStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  readingTime: number; // in minutes
}

declare module "@tiptap/core" {
  interface Storage {
    wordCount: WordCountStats;
  }
}

/**
 * Calculate word count, character count, and reading time from text
 */
function calculateStats(text: string): WordCountStats {
  // Remove all whitespace and count characters
  const charactersNoSpaces = text.replace(/\s/g, "").length;

  // Count all characters including spaces
  const characters = text.length;

  // Count words (split by whitespace and filter empty strings)
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

  // Calculate reading time (average reading speed: 200 words per minute)
  const readingTime = Math.ceil(words / 200);

  return {
    words,
    characters,
    charactersNoSpaces,
    readingTime,
  };
}

const wordCountPluginKey = new PluginKey("wordCount");

export const WordCountExtension = Extension.create({
  name: "wordCount",

  addStorage() {
    return {
      wordCount: {
        words: 0,
        characters: 0,
        charactersNoSpaces: 0,
        readingTime: 0,
      } as WordCountStats,
    };
  },

  onCreate() {
    // Initial calculation when editor is created
    if (this.editor) {
      const text = this.editor.state.doc.textContent;
      const stats = calculateStats(text);
      this.editor.storage.wordCount = stats;
    }
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: wordCountPluginKey,
        state: {
          init(_, state) {
            // Calculate initial stats from the document
            const text = state.doc.textContent;
            const stats = calculateStats(text);

            // Update extension storage immediately
            if (extension.editor) {
              extension.editor.storage.wordCount = stats;
            }

            return stats;
          },
          apply(_transaction, _value, _oldState, newState) {
            // Always recalculate to ensure accuracy
            const text = newState.doc.textContent;
            const stats = calculateStats(text);

            // Update extension storage
            if (extension.editor) {
              extension.editor.storage.wordCount = stats;
            }

            return stats;
          },
        },
        view(editorView) {
          // Calculate and update storage when view is created
          const text = editorView.state.doc.textContent;
          const stats = calculateStats(text);

          if (extension.editor) {
            extension.editor.storage.wordCount = stats;
          }

          return {
            update: (view, prevState) => {
              // Update on any document change
              if (view.state.doc !== prevState.doc) {
                const text = view.state.doc.textContent;
                const stats = calculateStats(text);

                if (extension.editor) {
                  extension.editor.storage.wordCount = stats;
                }
              }
            },
          };
        },
      }),
    ];
  },
});
