import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { Extension } from "@codemirror/state";

// Configure markdown with GFM support and code block highlighting
export function createMarkdownExtension(): Extension {
  return markdown({
    base: markdownLanguage,
    codeLanguages: languages,
    addKeymap: true,
  });
}
