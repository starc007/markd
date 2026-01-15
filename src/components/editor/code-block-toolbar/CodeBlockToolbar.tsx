import { Editor } from "@tiptap/react";
import { FloatingElement } from "../../tiptap-ui-utils/floating-element/floating-element";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from "../../ui/Dropdown";
import { CopyIcon } from "../../tiptap-icons/copy-icon";
import { LanguagesIcon } from "../../tiptap-icons/languages-icon";
import { cn } from "../../../lib/utils";
import { toast } from "sonner";
import { getClosestNode } from "../../../lib/tiptap-advanced-utils";

interface CodeBlockToolbarProps {
  editor: Editor;
}

// Common programming languages supported by lowlight
const LANGUAGES = [
  { value: null, label: "Plain Text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
  { value: "shell", label: "Shell" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "xml", label: "XML" },
];

export function CodeBlockToolbar({ editor }: CodeBlockToolbarProps) {
  const isCodeBlock = editor.isActive("codeBlock");
  const currentLanguage = editor.getAttributes("codeBlock").language || null;

  if (!isCodeBlock) {
    return null;
  }

  // Get code content
  const getCodeContent = () => {
    const { state } = editor;
    const { selection } = state;
    const $anchor = selection.$anchor;
    const codeBlock = $anchor.parent;
    if (codeBlock && codeBlock.type.name === "codeBlock") {
      return codeBlock.textContent;
    }
    return "";
  };

  const handleCopy = async () => {
    const code = getCodeContent();
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied to clipboard");
    } catch (error) {
      console.error("Failed to copy code:", error);
      toast.error("Failed to copy code");
    }
  };

  const handleLanguageChange = (language: string | null) => {
    editor.chain().focus().updateAttributes("codeBlock", { language }).run();
  };

  const currentLanguageLabel =
    LANGUAGES.find((lang) => lang.value === currentLanguage)?.label ||
    "Plain Text";

  // Get bounding rect for code block
  const getCodeBlockBoundingRect = () => {
    const codeBlockInfo = getClosestNode(editor, { nodeName: "codeBlock" });
    if (codeBlockInfo) {
      const dom = editor.view.nodeDOM(codeBlockInfo.pos) as HTMLElement;
      if (dom) {
        return dom.getBoundingClientRect();
      }
    }

    // Fallback to selection position
    const coords = editor.view.coordsAtPos(editor.state.selection.from);
    return new DOMRect(coords.left, coords.top - 20, 0, 0);
  };

  const shouldShow = isCodeBlock;

  return (
    <FloatingElement
      editor={editor}
      shouldShow={shouldShow}
      zIndex={50}
      getBoundingClientRect={getCodeBlockBoundingRect}
      floatingOptions={{
        placement: "top",
        middleware: [],
      }}
    >
      <div className="flex items-center gap-1 bg-background border border-border rounded-lg shadow-lg p-1">
        {/* Language Selector */}
        <Dropdown>
          <DropdownTrigger
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors",
              "text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
            )}
          >
            <LanguagesIcon className="w-4 h-4" />
            <span className="min-w-[100px] text-left">
              {currentLanguageLabel}
            </span>
          </DropdownTrigger>
          <DropdownContent
            align="start"
            className="max-h-[300px] overflow-y-auto"
          >
            {LANGUAGES.map((lang) => (
              <DropdownItem
                key={lang.value || "plain"}
                onClick={() => handleLanguageChange(lang.value)}
                className={cn(currentLanguage === lang.value && "bg-accent")}
              >
                {lang.label}
              </DropdownItem>
            ))}
          </DropdownContent>
        </Dropdown>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className={cn(
            "p-2 rounded transition-colors",
            "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
          aria-label="Copy code"
        >
          <CopyIcon className="w-4 h-4" />
        </button>
      </div>
    </FloatingElement>
  );
}
