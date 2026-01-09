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
        tag: `a[data-type="${this.name}"], span[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      mergeAttributes(
        {
          "data-type": this.name,
          href: "#",
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      0,
    ];
  },

  addNodeView() {
    return ({ node }) => {
      // Create anchor element for proper link semantics
      const dom = document.createElement("a");
      dom.setAttribute("data-type", this.name);
      dom.setAttribute("data-page-id", node.attrs.pageId);
      dom.setAttribute("data-page-title", node.attrs.pageTitle);
      dom.href = "#"; // Placeholder href for accessibility
      dom.className =
        "page-link inline-flex items-center gap-1 hover:bg-primary/5 pr-10 py-0.5 rounded text-primary hover:text-primary/80 transition-colors cursor-pointer font-medium";

      // Create SVG icon
      const iconSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      iconSvg.setAttribute("width", "20");
      iconSvg.setAttribute("height", "20");
      iconSvg.setAttribute("viewBox", "0 0 24 24");
      iconSvg.setAttribute("fill", "none");
      iconSvg.setAttribute("class", "shrink-0 opacity-70");

      // First path (horizontal lines)
      const path1 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      path1.setAttribute("d", "M8 17H16");
      path1.setAttribute("stroke", "currentColor");
      path1.setAttribute("stroke-width", "1.5");
      path1.setAttribute("stroke-linecap", "round");
      path1.setAttribute("stroke-linejoin", "round");
      iconSvg.appendChild(path1);

      // Second path (shorter horizontal line)
      const path2 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      path2.setAttribute("d", "M8 13H12");
      path2.setAttribute("stroke", "currentColor");
      path2.setAttribute("stroke-width", "1.5");
      path2.setAttribute("stroke-linecap", "round");
      path2.setAttribute("stroke-linejoin", "round");
      iconSvg.appendChild(path2);

      // Third path (file outline)
      const path3 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      path3.setAttribute(
        "d",
        "M13 2.5V3C13 5.82843 13 7.24264 13.8787 8.12132C14.7574 9 16.1716 9 19 9H19.5M20 10.6569V14C20 17.7712 20 19.6569 18.8284 20.8284C17.6569 22 15.7712 22 12 22C8.22876 22 6.34315 22 5.17157 20.8284C4 19.6569 4 17.7712 4 14V9.45584C4 6.21082 4 4.58831 4.88607 3.48933C5.06508 3.26731 5.26731 3.06508 5.48933 2.88607C6.58831 2 8.21082 2 11.4558 2C12.1614 2 12.5141 2 12.8372 2.11401C12.9044 2.13772 12.9702 2.165 13.0345 2.19575C13.3436 2.34355 13.593 2.593 14.0919 3.09188L18.8284 7.82843C19.4065 8.40649 19.6955 8.69552 19.8478 9.06306C20 9.4306 20 9.83935 20 10.6569Z"
      );
      path3.setAttribute("stroke", "currentColor");
      path3.setAttribute("stroke-width", "1.5");
      path3.setAttribute("stroke-linecap", "round");
      path3.setAttribute("stroke-linejoin", "round");
      iconSvg.appendChild(path3);

      // Create text node wrapped in a span for underline styling
      const textSpan = document.createElement("span");
      textSpan.className = "underline";
      // Get the computed primary color and apply it with reduced opacity for underline
      const getPrimaryColorWithOpacity = () => {
        try {
          // Create a temporary element to get the computed primary color
          const tempEl = document.createElement("span");
          tempEl.className = "text-muted-foreground";
          tempEl.style.visibility = "hidden";
          tempEl.style.position = "absolute";
          document.body.appendChild(tempEl);
          const computedColor = window.getComputedStyle(tempEl).color;
          document.body.removeChild(tempEl);

          // Convert rgb/rgba to rgba with 0.5 opacity
          if (computedColor) {
            const rgbMatch = computedColor.match(/\d+/g);
            if (rgbMatch && rgbMatch.length >= 3) {
              const r = rgbMatch[0];
              const g = rgbMatch[1];
              const b = rgbMatch[2];
              return `rgba(${r}, ${g}, ${b}, 0.5)`;
            }
          }
        } catch (e) {
          // Fallback to currentColor
        }
        return "currentColor";
      };

      textSpan.style.textDecoration = "underline";
      textSpan.style.textDecorationColor = getPrimaryColorWithOpacity();
      textSpan.style.textUnderlineOffset = "5px";
      textSpan.textContent = node.attrs.pageTitle || "Untitled";

      // Append icon and text
      dom.appendChild(iconSvg);
      dom.appendChild(textSpan);

      // Handle click to navigate to page
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

      // Store the current pageTitle for comparison
      let currentPageTitle: string | null = node.attrs.pageTitle;

      return {
        dom,
        update: (updatedNode) => {
          // Update the text content when pageTitle changes
          const newPageTitle = updatedNode.attrs.pageTitle as string | null;
          if (newPageTitle !== currentPageTitle) {
            dom.setAttribute("data-page-title", newPageTitle || "");
            // Find the text span and update it
            const textSpan = dom.querySelector("span.underline");
            if (textSpan) {
              textSpan.textContent = newPageTitle || "Untitled";
            }
            // Update our stored reference for future comparisons
            currentPageTitle = newPageTitle;
          }
          // Return true to indicate the update was successful
          return true;
        },
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
