# Codebase Analysis: Draft (usedraft)

## Project Overview

**Draft** is a desktop note-taking application built with modern web technologies and Rust. It provides a rich text editing experience with features like folders, search, sticky notes, and a command palette.

**Tech Stack:**

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Rust + Tauri 2
- **Editor**: TipTap (ProseMirror-based rich text editor)
- **State Management**: Zustand
- **Database**: SQLite (rusqlite) with FTS5 full-text search
- **Styling**: Tailwind CSS 4

---

## Architecture

### Frontend Structure (`src/`)

```
src/
├── components/          # React components
│   ├── layout/         # AppShell, Sidebar, TitleBar
│   ├── editor/         # TipTap editor implementation
│   ├── command-palette/ # Unified search/command interface
│   ├── notes/          # NotesGrid, StickyNote components
│   └── ui/             # Reusable UI components
├── stores/              # Zustand state management
│   ├── noteStore.ts    # Main notes state
│   └── stickyNotesStore.ts
├── hooks/              # Custom React hooks
│   ├── useKeyboardShortcuts.ts
│   └── tiptap/         # TipTap-specific hooks
├── lib/
│   ├── tauri/commands.ts  # Tauri command bindings
│   └── tiptap/         # TipTap utilities
└── context/            # React context providers
```

### Backend Structure (`src-tauri/src/`)

```
src-tauri/src/
├── commands/           # Tauri command handlers
│   ├── notes.rs       # CRUD operations
│   ├── folders.rs     # Folder management
│   ├── search.rs      # Full-text search
│   └── sticky_notes.rs
├── services/          # Business logic
│   ├── database.rs    # SQLite operations
│   ├── file_service.rs # File system operations
│   └── search_service.rs
├── models/            # Data structures
└── state.rs          # AppState (shared state)
```

---

## Key Features

### 1. Rich Text Editor (TipTap)

- Markdown support, task lists, highlighting, links
- Custom extensions (alignment, background, UI state)
- Slash commands and floating toolbar
- Real-time content saving with debouncing

### 2. Command Palette (`Cmd+K` / `Cmd+P`)

- Unified search and commands interface
- Real-time note search as you type
- Keyboard shortcuts for all actions
- Similar to Spotlight/VS Code command palette

### 3. Organization Features

- **Folders**: Hierarchical folder structure
- **Pinned Notes**: Pin important notes to top
- **Sticky Notes**: Separate sticky notes feature with colors

### 4. Full-Text Search

- FTS5 virtual table for fast search
- BM25 ranking algorithm
- Highlighted snippets in results
- Searches both title and content

### 5. Export/Import

- Export notes to Markdown format
- Import from Markdown files
- File dialog integration

### 6. Keyboard Shortcuts

- `Cmd+N`: New note
- `Cmd+Shift+N`: New sticky note
- `Cmd+K` / `Cmd+P`: Command palette
- `Cmd+\`: Toggle sidebar
- `Cmd+Shift+T`: Settings
- `Escape`: Close modals/palette

---

## Data Storage

### Database Schema

**Tables:**

- `notes`: Metadata + content (JSON TipTap format)
- `folders`: Hierarchical folder structure
- `sticky_notes`: Sticky notes with colors
- `notes_fts`: FTS5 virtual table for search
- `tags` / `note_tags`: Tag system (schema exists but limited usage)

**Storage Location:**

- Database: `~/Documents/Draft/draft.db`
- Notes: `~/Documents/Draft/notes/` (legacy, not actively used)

### Data Flow

1. **Content Storage**: Notes stored as JSON (TipTap format) in SQLite
2. **Search Indexing**: Plain text extracted from JSON and indexed in FTS5
3. **Preview Generation**: Extracted from content for list views
4. **File Operations**: Legacy file service exists but notes are primarily in DB

---

## Code Quality Assessment

### ✅ Strengths

1. **Type Safety**: Strong TypeScript + Rust typing throughout
2. **Separation of Concerns**: Clear frontend/backend boundaries
3. **State Management**: Well-organized Zustand stores with typed actions
4. **Error Handling**: Proper Rust `Result` types in backend
5. **Performance**: Debounced saves, efficient FTS5 search
6. **Modern Stack**: Latest versions of React, Tauri, Tailwind

### ⚠️ Areas for Improvement

1. **Unused Code**: `FileService` exists but notes stored in DB
2. **Incomplete Features**: Tags schema exists but no UI/commands
3. **Preview Generation**: Could be optimized/cached
4. **Error Handling**: Some frontend errors could be more user-friendly
5. **Migration Strategy**: Database migrations handled with `ALTER TABLE` attempts

---

## Potential Issues

### 1. Content Storage Inconsistency

- Notes stored as JSON in SQLite (good for TipTap)
- `FileService` writes `.md` files but they're not used
- **Recommendation**: Remove file service or use it for backups

### 2. Search Indexing

- Indexes plain text extracted from JSON
- Re-indexes on every content save (could be throttled)
- **Recommendation**: Batch indexing or debounce re-indexing

### 3. State Synchronization

- Frontend state may drift from backend
- No optimistic updates visible
- **Recommendation**: Add state sync mechanism or optimistic updates

### 4. Focus Mode Implementation

- `toggleFocusMode` and `toggleSidebar` do the same thing (line 306-309 in noteStore.ts)
- **Recommendation**: Make focus mode distinct (e.g., hide all UI chrome)

---

## Recommendations

### High Priority

1. **Remove or Repurpose FileService**

   - Either remove unused file operations
   - Or use for exports/backups

2. **Implement Tags Feature**

   - Add UI for existing tag schema
   - Add commands for tag management

3. **Fix Focus Mode**
   - Make `toggleFocusMode` distinct from sidebar toggle
   - Consider hiding title bar, menu, etc. in true focus mode

### Medium Priority

4. **Add Data Validation**

   - Validate TipTap JSON before saving
   - Sanitize search queries

5. **Improve Error Messages**

   - User-friendly error dialogs
   - Retry mechanisms for failed saves

6. **Performance Optimizations**
   - Batch search indexing
   - Virtualize long note lists
   - Lazy load note content

### Low Priority

7. **Add Tests**

   - Unit tests for Rust commands
   - Integration tests for critical flows
   - Frontend component tests

8. **Documentation**
   - API documentation
   - Architecture diagrams
   - Contributing guidelines

---

## Overall Assessment

**Rating: 8/10**

This is a **well-structured desktop note-taking application** with:

- ✅ Modern, maintainable tech stack
- ✅ Rich editing features
- ✅ Fast, full-text search
- ✅ Good keyboard navigation
- ✅ Clean code organization

The codebase is **production-ready** with some minor cleanup needed. Main gaps are unused code (`FileService`), incomplete features (tags), and some UX polish.

**Recommended Next Steps:**

1. Clean up unused `FileService` code
2. Implement tags feature or remove schema
3. Fix focus mode to be distinct from sidebar toggle
4. Add user-facing error handling improvements

---

## File Structure Summary

### Frontend Components

- **Layout**: `AppShell`, `Sidebar`, `TitleBar`
- **Editor**: `Editor`, `EditorContent`, `EditorTitle`, `FloatingToolbar`, `SlashCommandMenu`
- **Notes**: `NotesGrid`, `StickyNote`, `DeleteNoteModal`
- **UI**: `CommandPalette`, `Settings`, `Welcome`, various UI primitives

### Backend Commands

- **Notes**: `create_note`, `get_note`, `update_note`, `delete_note`, `list_notes`, `save_note_content`, `import_file`, `toggle_note_pinned`
- **Folders**: `create_folder`, `get_folder`, `update_folder`, `delete_folder`, `list_folders`, `move_note_to_folder`
- **Search**: `search_notes`
- **Export**: `export_note`, `get_note_content_for_export`
- **Sticky Notes**: `create_sticky_note`, `get_sticky_note`, `update_sticky_note`, `delete_sticky_note`, `list_sticky_notes`

### State Management

- **noteStore**: Main application state (notes, folders, UI state, search)
- **stickyNotesStore**: Sticky notes state

---

_Analysis Date: 2024_
_Project: Draft (usedraft)_
