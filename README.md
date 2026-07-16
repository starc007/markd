# Markd

**Local-first notes for people who write.**

Markd is a macOS-first notes app built for developers and content creators who care about speed, privacy, and ownership.

No accounts.
No cloud.
No sync (for now).

Your notes live on your Mac as plain `.md` files. Markd simply makes writing and finding them fast.

---

## Installing on macOS

Download the latest `.dmg` from [usemarkd.app](https://usemarkd.app) and drag Markd to Applications.

The current `0.1.4` download predates the notarized release pipeline, so macOS may ask you to verify it on first launch. Open it once, either way:

**Terminal**

```bash
xattr -dr com.apple.quarantine /Applications/Markd.app
```

Then open Markd normally.

**Or via Settings**

Double-click Markd → click **Done** → **System Settings → Privacy & Security** → **Open Anyway** → authenticate. macOS remembers the choice after that.

Future releases are Developer ID signed and notarized through Apple before distribution.

---

## Features

- **WYSIWYG markdown editor** — write in a rich editor, saved as clean markdown on disk
- **Folders & subfolders** — organize notes in real, Finder-visible folders
- **Todos** — a standalone task list with tags and filtering
- **Bookmarks** — save links with auto-fetched title, image, and favicon; tag and filter them too
- **⌘K command palette** — jump to any note, folder, or page instantly
- **Instant search** — title + content, ranked, in milliseconds
- **Monochrome UI** — light, dark, or system theme; no color noise
- **Portable vault** — plain files, no IDs, no required metadata, no lock-in

---

## Vault model

Pick any folder on disk as your vault:

```
<vault>/
├── notes/          plain .md files — filename is the title, folders are real folders
└── .markd/         app data: todos, bookmarks, tags, pasted images
```

Notes are addressed by path, never by ID. Deletes go to the OS trash. Edit notes externally (vim, VS Code, whatever) — Markd picks up changes on window focus.

---

## Getting started

Requirements: [Bun](https://bun.sh), [Rust](https://rustup.rs), and Xcode Command Line Tools.

```bash
bun install
bun tauri dev      # run the app
```

Build a release bundle:

```bash
bun tauri build    # produces a .app and .dmg under src-tauri/target/release/bundle
```

Maintainers can follow [NOTARIZATION.md](./NOTARIZATION.md) to configure Developer ID signing and Apple notarization for releases.

See [AGENTS.md](./AGENTS.md) for architecture details, or [CONTRIBUTING.md](./CONTRIBUTING.md) to send a PR.

---

## Data & Privacy

- Notes are stored locally as user-owned files
- No analytics, tracking, accounts, or note-content uploads
- Markd connects to `usemarkd.app` to check for application updates
- Saving a bookmark fetches that page's title, preview image, and favicon
- Export your notes anytime — they're already just files

---

## Status

Markd is under active development.
Sync, encryption, and publishing may be added later — without compromising local-first performance.

## License

[MIT](./LICENSE)

---

**Markd**
_Write at the speed of thought._
