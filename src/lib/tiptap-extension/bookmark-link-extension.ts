import { Node, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export interface BookmarkLinkOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    bookmarkLink: {
      setBookmarkLink: (
        bookmarkId: string,
        title: string,
        url: string
      ) => ReturnType;
      removeBookmarkLink: () => ReturnType;
    };
  }
}

export const BookmarkLinkExtension = Node.create<BookmarkLinkOptions>({
  name: "bookmarkLink",

  group: "inline",

  inline: true,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      bookmarkId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-bookmark-id"),
        renderHTML: (attributes) => {
          if (!attributes.bookmarkId) {
            return {};
          }
          return {
            "data-bookmark-id": attributes.bookmarkId,
          };
        },
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-title"),
        renderHTML: (attributes) => {
          if (!attributes.title) {
            return {};
          }
          return {
            "data-title": attributes.title,
          };
        },
      },
      url: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-url"),
        renderHTML: (attributes) => {
          if (!attributes.url) {
            return {};
          }
          return {
            "data-url": attributes.url,
          };
        },
      },
      favicon: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-favicon"),
        renderHTML: (attributes) => {
          if (!attributes.favicon) {
            return {};
          }
          return {
            "data-favicon": attributes.favicon,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="bookmark-link"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const title = node.attrs.title || "Bookmark";

    // If we have a favicon, we'll use it in the custom node view
    // For SSR/export, just show title (icon will be added in node view)
    return [
      "span",
      mergeAttributes(
        {
          "data-type": "bookmark-link",
          class: "bookmark-link",
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      title,
    ];
  },

  addCommands() {
    return {
      setBookmarkLink:
        (
          bookmarkId: string,
          title: string,
          url: string,
          favicon?: string | null
        ) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              bookmarkId,
              title,
              url,
              favicon,
            },
          });
        },
      removeBookmarkLink:
        () =>
        ({ commands }) => {
          return commands.deleteSelection();
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("bookmarkLinkClick"),
        props: {
          handleDOMEvents: {
            click: (_view, event) => {
              const target = event.target as HTMLElement;
              const bookmarkLink = target.closest(
                '[data-type="bookmark-link"]'
              );

              if (bookmarkLink) {
                const url = bookmarkLink.getAttribute("data-url");
                if (url) {
                  // Open bookmark URL
                  window.dispatchEvent(
                    new CustomEvent("open-bookmark-url", { detail: { url } })
                  );
                  return true;
                }
              }
              return false;
            },
          },
        },
      }),
    ];
  },

  addNodeView() {
    return ({ node }) => {
      // Helper function to create bookmark icon SVG
      const createBookmarkIcon = () => {
        const svg = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg"
        );
        svg.setAttribute("width", "14");
        svg.setAttribute("height", "14");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("fill", "none");
        svg.style.flexShrink = "0";
        svg.style.marginRight = "4px";

        const path = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        path.setAttribute(
          "d",
          "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"
        );
        path.setAttribute("stroke", "currentColor");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");
        svg.appendChild(path);

        return svg;
      };
      const dom = document.createElement("span");
      dom.setAttribute("data-type", "bookmark-link");
      dom.setAttribute("data-bookmark-id", node.attrs.bookmarkId);
      dom.setAttribute("data-title", node.attrs.title);
      dom.setAttribute("data-url", node.attrs.url);
      if (node.attrs.favicon) {
        dom.setAttribute("data-favicon", node.attrs.favicon);
      }

      const title = node.attrs.title || "Bookmark";
      const favicon = node.attrs.favicon;

      // Create content with favicon or emoji
      if (favicon) {
        const img = document.createElement("img");
        img.src = favicon;
        img.alt = "";
        img.style.width = "14px";
        img.style.height = "14px";
        img.style.objectFit = "contain";
        img.style.marginRight = "4px";
        img.style.flexShrink = "0";

        img.onerror = () => {
          // If favicon fails to load, replace with bookmark icon
          img.style.display = "none";
          const iconSvg = createBookmarkIcon();
          dom.insertBefore(iconSvg, dom.firstChild);
        };

        dom.appendChild(img);
        dom.appendChild(document.createTextNode(title));
      } else {
        const iconSvg = createBookmarkIcon();
        dom.appendChild(iconSvg);
        dom.appendChild(document.createTextNode(title));
      }

      // Apply styles
      dom.style.cursor = "pointer";
      dom.style.padding = "2px 6px";
      dom.style.borderRadius = "4px";
      dom.style.display = "inline-flex";
      dom.style.alignItems = "center";
      dom.style.gap = "4px";
      dom.style.fontSize = "0.9em";
      dom.style.fontWeight = "500";
      dom.style.transition = "all 0.2s";

      // Get computed muted foreground color
      try {
        const tempEl = document.createElement("span");
        tempEl.className = "text-muted-foreground";
        tempEl.style.visibility = "hidden";
        tempEl.style.position = "absolute";
        document.body.appendChild(tempEl);
        const computedColor = window.getComputedStyle(tempEl).color;
        document.body.removeChild(tempEl);

        dom.style.color = computedColor;
        dom.style.backgroundColor = computedColor
          .replace("rgb", "rgba")
          .replace(")", ", 0.1)");

        // Hover effect
        dom.addEventListener("mouseenter", () => {
          dom.style.backgroundColor = computedColor
            .replace("rgb", "rgba")
            .replace(")", ", 0.2)");
        });
        dom.addEventListener("mouseleave", () => {
          dom.style.backgroundColor = computedColor
            .replace("rgb", "rgba")
            .replace(")", ", 0.1)");
        });
      } catch (e) {
        // Fallback colors
        dom.style.color = "#6b7280";
        dom.style.backgroundColor = "rgba(107, 114, 128, 0.1)";
      }

      // Click handler
      dom.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const url = node.attrs.url;
        if (url) {
          window.dispatchEvent(
            new CustomEvent("open-bookmark-url", { detail: { url } })
          );
        }
      });

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type.name !== this.name) {
            return false;
          }

          const newTitle = updatedNode.attrs.title || "Bookmark";
          const newFavicon = updatedNode.attrs.favicon;

          // Clear existing content
          dom.innerHTML = "";

          // Rebuild content with new favicon or emoji
          if (newFavicon) {
            const img = document.createElement("img");
            img.src = newFavicon;
            img.alt = "";
            img.style.width = "14px";
            img.style.height = "14px";
            img.style.objectFit = "contain";
            img.style.marginRight = "4px";
            img.style.flexShrink = "0";

            img.onerror = () => {
              img.style.display = "none";
              const iconSvg = createBookmarkIcon();
              dom.insertBefore(iconSvg, dom.firstChild);
            };

            dom.appendChild(img);
            dom.appendChild(document.createTextNode(newTitle));
          } else {
            const iconSvg = createBookmarkIcon();
            dom.appendChild(iconSvg);
            dom.appendChild(document.createTextNode(newTitle));
          }

          // Update data attributes
          dom.setAttribute("data-title", updatedNode.attrs.title);
          if (newFavicon) {
            dom.setAttribute("data-favicon", newFavicon);
          } else {
            dom.removeAttribute("data-favicon");
          }

          return true;
        },
      };
    };
  },
});
