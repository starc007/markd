# Markd

**Local-first notes for people who write.**

Markd is a fast notes app for macOS and Linux, built for people who care about speed, privacy, and ownership.

No accounts.
No cloud.
No sync (for now).

Your notes live on your disk as plain `.md` files. Markd simply makes writing and finding them fast.

---

## Installing on macOS

Download the latest `.dmg` from [usemarkd.app](https://usemarkd.app) and drag Markd to Applications.

Markd releases are Developer ID signed and notarized by Apple before distribution.

---

## Installing on Linux

Download the latest AppImage or Debian package from the [GitHub releases](https://github.com/starc007/markd/releases/latest) page.

Run the AppImage:

```bash
chmod +x Markd_*_amd64.AppImage
./Markd_*_amd64.AppImage
```

Or install the Debian package:

```bash
sudo apt install ./Markd_*_amd64.deb
```

---

## Features

- **WYSIWYG markdown editor:** write in a rich editor, saved as clean markdown on disk
- **Folders and subfolders:** organize notes in real, file-manager-visible folders
- **Todos:** a standalone task list with tags and filtering
- **Bookmarks:** save links with an auto-fetched title, image, and favicon
- **Command palette:** press Ctrl/Cmd+K to jump to any note, folder, or page instantly
- **Instant search:** title and content, ranked in milliseconds
- **Monochrome UI:** light, dark, or system theme with no color noise
- **Portable vault:** plain files, no IDs, no required metadata, no lock-in

---

## Vault model

Pick any folder on disk as your vault:

```
<vault>/
├── Note.md         plain .md files, filename is the title
├── projects/       real folders containing more notes
└── .markd/         app data: todos, bookmarks, tags, pasted images
```

Notes are addressed by path, never by ID. Deletes go to the OS trash. Edit notes externally with vim, VS Code, or another editor. Markd picks up changes on window focus.

---

## Getting started

Requirements: [Bun](https://bun.sh), [Rust](https://rustup.rs), and the platform dependencies listed in the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/).

```bash
bun install
bun tauri dev      # run the app
```

Build a release bundle:

```bash
bun tauri build
```

Maintainers can follow [NOTARIZATION.md](./NOTARIZATION.md) to configure Developer ID signing and Apple notarization for releases.

See [AGENTS.md](./AGENTS.md) for architecture details, or [CONTRIBUTING.md](./CONTRIBUTING.md) to send a PR.

---

## Data & Privacy

- Notes are stored locally as user-owned files
- No analytics, tracking, accounts, or note-content uploads
- Markd connects to `usemarkd.app` on macOS or GitHub Releases on Linux to check for application updates
- Saving a bookmark fetches that page's title, preview image, and favicon
- Export your notes anytime because they are already just files

---

## Status

Markd is under active development.
Sync, encryption, and publishing may be added later without compromising local-first performance.

## License

[MIT](./LICENSE)

---

**Markd**
_Write at the speed of thought._
