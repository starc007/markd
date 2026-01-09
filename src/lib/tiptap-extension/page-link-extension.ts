import { Node, mergeAttributes } from "@tiptap/core";

export interface PageLinkOptions {
  HTMLAttributes: Record<string, any>;
}

export interface PageLinkSuggestionItem {
  pageId: string;
  pageTitle: string;
}

export const PageLinkExtension = Node.create<PageLinkOptions>({
  name: "pageLink",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: "inline",

  inline: true,

  selectable: false,

  atom: true,

  addAttributes() {
    return {
      pageId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-page-id"),
        renderHTML: (attributes) => {
          if (!attributes.pageId) {
            return {};
          }
          return {
            "data-page-id": attributes.pageId,
          };
        },
      },
      pageTitle: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-page-title"),
        renderHTML: (attributes) => {
          if (!attributes.pageTitle) {
            return {};
          }
          return {
            "data-page-title": attributes.pageTitle,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        { "data-type": this.name },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      0,
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("span");
      dom.setAttribute("data-type", this.name);
      dom.setAttribute("data-page-id", node.attrs.pageId);
      dom.setAttribute("data-page-title", node.attrs.pageTitle);
      dom.className =
        "page-link inline-flex items-center gap-1.5 px-2 py-1 text-primary underline transition-all cursor-pointer text-sm font-medium";
      dom.textContent = node.attrs.pageTitle || "Untitled";

      // Add icon before text
      const icon = document.createElement("span");
      icon.innerHTML = "📄";
      icon.className = "text-xs opacity-70";
      dom.insertBefore(icon, dom.firstChild);

      // Make clickable to navigate to page
      dom.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const pageId = dom.getAttribute("data-page-id");
        if (pageId) {
          // Dispatch custom event to navigate
          window.dispatchEvent(
            new CustomEvent("navigate-to-page", { detail: { pageId } })
          );
        }
      });

      return {
        dom,
      };
    };
  },

  addProseMirrorPlugins() {
    return [];
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageLink: {
      /**
       * Insert a page link
       */
      setPageLink: (attributes: {
        pageId: string;
        pageTitle: string;
      }) => ReturnType;
    };
  }
}
