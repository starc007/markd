# Cursor Migration Prompt — Editor.js → Tiptap (Draft)

You are an expert frontend editor engineer with deep knowledge of **Editor.js**, **ProseMirror**, and **Tiptap**.

You are migrating **Draft**, a macOS-first, local-only, high-performance notes app, from **Editor.js** to **Tiptap**.

This migration must **prioritize performance, correctness, and future-proofing**.

---

## 🎯 Migration Goal

Replace **Editor.js** with **Tiptap** while:

- Preserving the writing experience
- Improving typing performance on long documents
- Enabling `/` command support
- Preparing the editor for future sync (CRDT) without implementing it now

The final editor must feel **faster than Editor.js**, not just equivalent.

---

## 🔒 Non-Negotiable Constraints

- No feature regressions in MVP scope
- No cloud, no sync, no backend logic
- No blocking operations on typing
- No heavy UI re-renders
- Keyboard-first UX only
- macOS performance expectations must be met

If any migration step risks typing latency, redesign it.

---

## 🧱 Architectural Rules

- Editor must be **isolated** from storage logic
- Editor state must not be the source of truth for persistence
- Storage must remain abstracted for future sync
- Editor updates must be incremental and local

The editor layer should only:

- Render content
- Handle user input
- Emit document changes

---

## 🔄 Data Migration Strategy

- Convert Editor.js JSON blocks → Tiptap / ProseMirror document schema
- Preserve:
  - text content
  - headings
  - lists
  - code blocks
  - checklists
- Ignore non-essential Editor.js plugins unless strictly required

Migration must be **one-way and deterministic**.

---

## ✍️ Editor Behavior Requirements

- Markdown-style shortcuts (e.g. `#`, `##`, ``` )
- Large code blocks must not cause reflow lag
- Cursor position must remain stable during transforms
- Undo / redo must remain reliable
- No automatic formatting that surprises the user

---

## ➗ Slash (`/`) Command Requirements

- Implement `/` command using Tiptap suggestion plugin
- Commands must:
  - Be keyboard navigable
  - Execute instantly
  - Replace trigger text cleanly
  - Never block typing
- Limit initial commands to core blocks only

---

## 🔍 Performance Validation

After migration, verify:

- 5k–10k word notes type smoothly
- Pasting 300+ lines of code does not freeze UI
- Search and navigation remain unaffected
- Editor initialization time is not worse than Editor.js

If any metric regresses, rollback and redesign.

---

## 🚫 Explicit Non-Goals

- Do NOT implement collaboration
- Do NOT implement sync
- Do NOT add visual animations
- Do NOT reintroduce block-heavy UI patterns
- Do NOT introduce framework-level state coupling

---

## 🧠 Guiding Principle

> The editor exists to **disappear while writing**.

Every decision must reduce latency, visual noise, and cognitive load.

---

Follow this prompt strictly.  
Optimize for **typing performance, correctness, and long-term maintainability**.
