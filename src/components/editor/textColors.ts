import {
  BackgroundColor,
  Color,
  TextStyle,
} from "@tiptap/extension-text-style";

export const TEXT_COLORS = [
  { label: "Red", value: "#d45b55" },
  { label: "Amber", value: "#b7791f" },
  { label: "Green", value: "#3f8f62" },
  { label: "Blue", value: "#4f7fd1" },
  { label: "Violet", value: "#8a63c5" },
] as const;

export const BACKGROUND_COLORS = [
  { label: "Red", value: "#f6d7d4" },
  { label: "Amber", value: "#f5e6b8" },
  { label: "Green", value: "#d4e9dc" },
  { label: "Blue", value: "#d8e2f5" },
  { label: "Violet", value: "#e5daf2" },
] as const;

function safeCssColor(value: unknown) {
  if (typeof value !== "string") return null;
  return /^(?:#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i.test(value)
    ? value
    : null;
}

/**
 * Standard Markdown has no text-color syntax. Serialize the textStyle mark as
 * inline HTML, which Markdown readers preserve and Tiptap parses back into the
 * same mark. Background swatches carry a dark foreground for legibility in
 * both app themes and external Markdown renderers.
 */
export const MarkdownTextStyle = TextStyle.extend({
  renderMarkdown: (node, helpers) => {
    const color = safeCssColor(node.attrs?.color);
    const background = safeCssColor(node.attrs?.backgroundColor);
    if (!color && !background) return helpers.renderChildren(node);

    const styles = [
      color ? `color: ${color}` : background ? "color: #191919" : null,
      background ? `background-color: ${background}` : null,
    ].filter(Boolean);
    return `<span style="${styles.join("; ")}">${helpers.renderChildren(node)}</span>`;
  },
});

export const textColorExtensions = [
  MarkdownTextStyle,
  Color,
  BackgroundColor,
];
