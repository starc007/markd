// Release coordinates — kept in sync with scripts/release.sh output.
export const VERSION = "0.1.1";
export const DMG = "/downloads/Markd_0.1.1_aarch64.dmg";
export const GITHUB = "https://github.com/usemarkd/markd"; // TODO: real repo

export const FEATURES = [
  {
    title: "Plain files, real folders",
    body: "Every note is a .md file on your disk. No database, no proprietary format, no lock-in. Open the folder in anything.",
  },
  {
    title: "Local-first, always",
    body: "Nothing leaves your machine. Rust owns the filesystem; the app is just the window. Your notes work offline, forever.",
  },
  {
    title: "Instant search",
    body: "Title and content, ranked in milliseconds. Title matches surface first, so the note you meant is always on top.",
  },
  {
    title: "Tabs & page links",
    body: "Open notes in tabs and link between them with [[wiki]] syntax stored as clean markdown. Switching tabs never reparses.",
  },
  {
    title: "Frontmatter, rendered",
    body: "YAML from web clippers or any tool is preserved verbatim and shown as a tidy properties panel above the note.",
  },
  {
    title: "Silent auto-update",
    body: "Signed updates delivered straight to the app. No app store, no manual downloads after the first — it just stays current.",
  },
] as const;
