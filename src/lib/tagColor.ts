// Apple system-color palette. Tags are the one place the app breaks its
// strict monochrome — each tag gets a stable color from its name. Chips
// derive their tint/border from this solid color via color-mix, so they
// read well in both light and dark without per-theme values.

const PALETTE = [
  "#FF3B30", // red
  "#FF9500", // orange
  "#FFCC00", // yellow
  "#34C759", // green
  "#30B0C7", // teal
  "#007AFF", // blue
  "#5856D6", // indigo
  "#AF52DE", // purple
  "#FF2D55", // pink
  "#8E8E93", // gray
];

function hash(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Stable solid color (hex) for a tag name. */
export function tagColor(name: string) {
  return PALETTE[hash(name) % PALETTE.length];
}
