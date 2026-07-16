# Contributing to Markd

Thanks for considering a contribution. Markd stays small on purpose — please open an issue before starting on anything beyond a bug fix, so we can agree on the approach first.

## Setup

Requirements: [Bun](https://bun.sh), [Rust](https://rustup.rs), Xcode Command Line Tools.

```bash
bun install
bun tauri dev
```

## Before opening a PR

```bash
bunx tsc --noEmit          # typecheck
cd src-tauri && cargo test # Rust unit tests
```

Both must pass clean. There's no separate lint step — `tsc` and `cargo test` are the gate.

## Code conventions

See [AGENTS.md](./AGENTS.md) for the full architecture guide. The short version:

- **Rust owns the filesystem.** The frontend is UI + state only — all IO goes through typed Tauri commands in `src/lib/ipc.ts`.
- **One Rust module per concern**, each under ~300 lines, with its own unit tests. Don't collapse everything into `lib.rs`.
- **Strict monochrome UI.** Only the semantic tokens in `src/styles.css` (`bg`, `panel`, `ink`, `muted`, `faint`, `line`, `hover`, `invert`…). Never hardcode a color — `danger` is the one exception, for destructive actions only.
- Keep motion subtle: 100–160ms ease-out, nothing bouncier.

## Commit messages

[Conventional commits](https://www.conventionalcommits.org/), subject line ≤50 chars where possible (`feat: ...`, `fix: ...`, `chore: ...`).

## What we won't merge

- Sticky notes, wiki-links, note IDs/frontmatter, or a plugin system — these were deliberately cut, see AGENTS.md.
- Anything that adds a color outside the monochrome token set.
- Cloud sync / accounts — out of scope for now (see README status).

## Reporting bugs

Open an issue with your operating system, Markd version, and reproduction steps. If it is a vault or data issue, mention whether it reproduces with a fresh vault folder.
