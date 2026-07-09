# Markd — agent guide

Local-first markdown notes app for macOS. Tauri 2 (Rust) + React 19 + Vite + Tailwind v4 + Tiptap 3 + Zustand.

## Commands

- `bun tauri dev` — run the app (vite on port 1420 + cargo)
- `bun run build` — typecheck (tsc) + vite production build
- `bunx tsc --noEmit` — typecheck only
- `cd src-tauri && cargo test` — Rust unit tests
- `bun run release` — full signed release (scripts/release.sh)

## Architecture

Rust owns the filesystem; the frontend is UI + state only. All IO goes through typed Tauri commands (`src/lib/ipc.ts` is the only file that touches `invoke`).

### Vault model

User picks any folder as a vault:

- `<vault>/notes/` — plain `.md` files, filename = title, no IDs. Folders are real folders. Obsidian-compatible. The app never *authors* frontmatter, but preserves and renders any that external tools (e.g. Obsidian clippings) added — see below.
- `<vault>/.markd/` — app data: `todos.json`, `bookmarks.json`, `assets/` (pasted images).
- Vault path + theme persist in the app config dir (`config.json`).

Notes are addressed by path relative to `notes/` (e.g. `projects/app.md`), never by ID. Deletes go to OS trash. External edits are picked up on window focus (dirty editor wins).

### Rust (`src-tauri/src/`)

One module per concern, each with unit tests; keep files under ~300 lines:

- `error.rs` — `AppError`/`AppResult`, serialized as `{kind, message}` to the frontend
- `vault.rs` — layout, tree scan, rel-path resolution (rejects traversal)
- `notes.rs` — CRUD, rename/move with collision suffixing ("name 2")
- `search.rs` — case-insensitive title+content search, title hits ranked first
- `todos.rs` / `bookmarks.rs` — JSON stores in `.markd/`
- `link_meta.rs` — fetch page title / og:image / favicon (reqwest + scraper)
- `assets.rs` — save pasted images into `.markd/assets/`
- `commands.rs` — thin `#[tauri::command]` wrappers only; `lib.rs` — wiring only

Blocking dialogs (`blocking_pick_folder`) must run in async commands via `spawn_blocking` — on the main thread they deadlock the app.

### Frontend (`src/`)

- `stores/` — zustand: `vault` (tree, view, theme, recents), `tabs` (open note tabs; active = derived from `vault.view`), `todos`, `bookmarks`, `ui`
- `components/` — by feature: `layout/`, `tree/`, `editor/`, `todos/`, `bookmarks/`, `palette/`, `settings/`, `welcome/`, `ui/`
- Editor: Tiptap with `contentType: "markdown"`; autosave debounced 500ms, flush on unmount; images stored as vault-relative paths, rendered via asset protocol
- Tabs: `NotesWorkspace` keeps one live editor per open tab, inactive panes hidden via `display:none` — tab switch is a CSS toggle, never a remount/re-parse. Keep it that way.
- Session: `lib/session.ts` persists per-vault UI layout (open tabs, active view, todo/bookmark tag filters) to localStorage keyed by vault root, restoring it on launch. Tag filters live in the `todos`/`bookmarks` stores (not component state) so they're subscribable.
- Page links: internal note links are plain markdown links whose href is a vault-relative note path (`[Title](projects/app.md)`). `lib/noteLinks.ts` converts href↔rel and rewrites `[[wiki]]`/`[[target|alias]]` syntax (on type + on load) into those markdown links; clicking one opens the note; `/link` slash command + `NoteLinkPicker` also insert them.
- Frontmatter: `lib/frontmatter.ts` splits a leading `---` YAML block off the body on load and re-attaches it verbatim on save (so metadata round-trips), and parses it for the read-only `NoteProperties` panel shown above the editor. The editor body never contains the raw YAML.

## UI conventions

- Strict monochrome: only the semantic tokens in `styles.css` (`bg`, `panel`, `sunken`, `ink`, `muted`, `faint`, `line`, `hover`, `active`, `invert`…). `sunken` is the recessed surface (tab strip), darker than `panel`. Never hardcode colors; `danger` is the sole exception, for destructive actions.
- Dark mode = `.dark` class on `<html>`; themes: system/light/dark.
- Active/selected rows use inverted style (`bg-invert text-invert-ink`) — the signature look.
- Motion: 100–160ms ease-out only. Fonts: Inter Variable (UI), JetBrains Mono (code).
- No autocorrect anywhere: global `focusin` hook in `main.tsx` handles inputs; editor sets its own attrs.

## Adding beui components

Animated components come from the beui registry (the user's own library). A compatibility layer is already in place so pulled components inherit our monochrome theme unchanged:

- `src/lib/utils.ts` exports `cn()` (clsx + tailwind-merge) — what beui/shadcn files import. Our own components use `cx()`.
- `src/lib/ease.ts` — shared motion tokens (`SPRING_PANEL`, `EASE_OUT`, …). `styles.css` mirrors `--ease-out` and defines the `.press` utility.
- `styles.css` maps shadcn semantic tokens (`--color-background`, `--color-foreground`, `--color-card`, `--color-border`, `--color-muted-foreground`, `--color-destructive`, `--color-border-strong`, …) onto our palette, so `bg-background`, `border-border`, `text-muted-foreground` etc. resolve to our monochrome look in both themes.
- `components.json` registers the `@beui` registry (`https://beui.dev/r/{name}.json`).

Two ways to add one:
1. **beui MCP** (preferred): `get_component <slug>` returns every file's contents; write them under `src/components/…`. Shared files (`lib/ease.ts`, `lib/utils.ts`) already exist — don't overwrite.
2. **shadcn CLI**: `bunx --bun shadcn add @beui/<slug>`.

Our `Modal` (`components/ui/Modal.tsx`) is built on the same tokens; keep new dialogs on it for one motion language.

## Rules

- Never add "Co-Authored-By" or any AI attribution to commits or PRs.
- Commit messages: conventional commits, subject ≤50 chars where possible.
- Don't reintroduce: sticky notes, note IDs, plugin-fs. Don't *author* frontmatter (external frontmatter is preserved/rendered, not written by us). `[[wiki]]` is accepted as input but stored as standard markdown `[title](path.md)` links.
