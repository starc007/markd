# Codebase Analysis: Draft (usedraft)

**Last Updated:** January 10, 2026  
**Analysis Version:** 2.0 - Comprehensive Update

## Project Overview

**Draft** is a desktop note-taking application built with modern web technologies and Rust. It provides a rich text editing experience with hierarchical page organization, cross-page linking, folders, search, sticky notes, and a command palette.

**Tech Stack:**

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Rust + Tauri 2
- **Editor**: TipTap (ProseMirror-based rich text editor)
- **State Management**: Zustand
- **Database**: SQLite (rusqlite) with FTS5 full-text search
- **Styling**: Tailwind CSS 4
- **UI Components**: Headless UI, Framer Motion
- **Notifications**: Sonner (toast notifications)
- **Error Handling**: React ErrorBoundary

---

## Architecture

### Frontend Structure (`src/`)

```
src/
├── components/
│   ├── layout/                      # Application layout & navigation
│   │   ├── AppShell.tsx            # Main app container
│   │   ├── Sidebar.tsx             # Sidebar container
│   │   ├── TitleBar.tsx            # Window title bar
│   │   ├── NotesList.tsx           # Flat note list view
│   │   ├── HierarchicalNotesList.tsx  # ⭐ NEW: Tree view with expand/collapse
│   │   ├── NoteListItem.tsx        # Individual note item
│   │   ├── SidebarNavigation.tsx  # Navigation controls
│   │   ├── SidebarSearch.tsx      # Search UI
│   │   └── SidebarSettings.tsx    # Settings UI
│   ├── editor/                     # Rich text editor
│   │   ├── Editor.tsx              # Editor container
│   │   ├── EditorTitle.tsx         # Editable title
│   │   ├── EditorContent.tsx       # TipTap editor (400+ lines, complex)
│   │   ├── SlashCommandMenu.tsx    # Slash commands UI
│   │   ├── PageLinkMenu.tsx        # ⭐ NEW: @ mention menu for pages
│   │   ├── PageLinkSuggestion.tsx  # Page link autocomplete
│   │   └── floating-toolbar/       # Selection toolbar
│   ├── notes/                      # Sticky notes feature
│   │   ├── NotesGrid.tsx          # Grid layout
│   │   ├── StickyNote.tsx         # Individual sticky note
│   │   └── DeleteNoteModal.tsx    # Confirmation dialog
│   ├── ui/                         # Reusable UI primitives
│   │   ├── Button.tsx, Input.tsx, Modal.tsx, etc.
│   ├── command-palette/            # Cmd+K interface
│   │   └── CommandPalette.tsx     # Search & commands
│   ├── settings/                   # Settings view
│   ├── search/                     # Search components
│   ├── tiptap-icons/               # 119+ editor icons
│   ├── tiptap-ui-utils/            # TipTap UI helpers
│   ├── ErrorBoundary.tsx           # ⭐ NEW: React error boundary
│   └── welcome.tsx                 # Welcome screen
├── stores/                         # Zustand state management
│   ├── noteStore.ts               # ⭐ UPDATED: Notes + hierarchy state (800+ lines)
│   ├── uiStore.ts                 # UI state (sidebar, focus mode, etc.)
│   ├── stickyNotesStore.ts       # Sticky notes state
│   └── settingsStore.ts          # User preferences
├── hooks/                          # Custom React hooks
│   ├── useKeyboardShortcuts.ts   # Global keyboard shortcuts
│   ├── usePageCommand.ts          # ⭐ NEW: Page creation via slash command
│   ├── usePageLinkSuggestion.ts  # ⭐ NEW: Page link suggestions
│   ├── useNotes.ts               # Notes data fetching
│   ├── useTheme.ts               # Theme management
│   ├── useWindowFocus.ts         # Window focus detection
│   └── tiptap/                   # TipTap-specific hooks
├── lib/
│   ├── tauri/
│   │   └── commands.ts           # ⭐ UPDATED: Tauri command bindings (30+ commands)
│   ├── tiptap/
│   │   └── json-to-markdown.ts  # JSON to Markdown conversion
│   └── tiptap-extension/         # Custom TipTap extensions
│       ├── page-link-extension.ts    # ⭐ NEW: Page link node
│       ├── ui-state-extension.ts
│       ├── node-alignment-extension.ts
│       ├── node-background-extension.ts
│       └── list-normalization-extension.ts
└── context/                        # React context (minimal usage)
```

### Backend Structure (`src-tauri/src/`)

```
src-tauri/src/
├── commands/                       # Tauri command handlers
│   ├── mod.rs                     # Command exports
│   ├── notes.rs                   # ⭐ UPDATED: Note CRUD + hierarchy (400+ lines)
│   ├── page_links.rs              # ⭐ NEW: Page linking commands
│   ├── folders.rs                 # Folder management
│   ├── sticky_notes.rs           # Sticky notes CRUD
│   ├── search.rs                  # Full-text search
│   └── export.rs                  # Export to Markdown
├── services/                       # Business logic layer
│   ├── database.rs                # ⭐ UPDATED: SQLite operations (1000+ lines)
│   ├── file_service.rs           # ⚠️ LEGACY: File operations (unused)
│   └── search_service.rs         # Search indexing
├── models/                         # Data structures
│   ├── note.rs                    # Note & NoteMetadata structs
│   ├── folder.rs                  # Folder struct
│   └── sticky_note.rs            # StickyNote struct
├── utils/                          # Utility functions
│   ├── json_utils.rs             # JSON parsing & preview generation
│   └── validation.rs             # Input validation
├── state.rs                       # AppState (shared app state)
├── lib.rs                         # Library entry point
└── main.rs                        # Application entry point
```

---

## Key Features

### 1. Rich Text Editor (TipTap)

- **Extensions**: Markdown, task lists, highlighting, links, underline, placeholder
- **Custom Extensions**:
  - Node alignment (left/center/right)
  - Node background colors
  - List normalization
  - **⭐ Page links** (@ mentions to link pages)
  - UI state tracking
- **Commands**: Slash commands (/, creates dropdown menu)
- **Toolbar**: Floating selection toolbar
- **Auto-save**: Debounced saves (500ms delay) with race condition protection

### 2. Page Hierarchy ⭐ NEW MAJOR FEATURE

- **Tree Structure**: Notes can have parent-child relationships
- **Visual Representation**: Indented tree view with expand/collapse
- **Sub-pages**: Create child notes under any note
- **Navigation**: Click to expand/collapse, navigate hierarchy
- **Database**: `parent_id` foreign key with recursive deletion
- **Cycle Detection**: Prevents circular references when moving pages

### 3. Page Linking ⭐ NEW MAJOR FEATURE

- **Bi-directional Links**: Link pages with `@PageName` syntax
- **Backlinks**: Track which pages link to a page
- **Link Sync**: Automatically sync links when content changes
- **Title Updates**: When page renamed, all links update automatically
- **Link Database**: Dedicated `page_links` table with source/target tracking

### 4. Command Palette (`Cmd+K` / `Cmd+P`)

- Unified search and commands interface
- Real-time note search with FTS5
- Keyboard shortcuts for all actions
- Similar to Spotlight/VS Code

### 5. Organization Features

- **Folders**: Hierarchical folder structure
- **Pinned Notes**: Pin important notes to top
- **Sticky Notes**: Separate feature with color coding
- **Search**: Full-text search across all notes

### 6. Full-Text Search (FTS5)

- Virtual table: `notes_fts` with Porter stemming
- BM25 ranking algorithm
- Searches title + content
- Highlighted snippets in results
- Unicode support (unicode61 tokenizer)

### 7. Export/Import

- Export notes to Markdown
- Import Markdown files as notes
- File dialog integration via Tauri

### 8. Keyboard Shortcuts

- `Cmd+N`: New note
- `Cmd+Shift+N`: New sticky note
- `Cmd+K` / `Cmd+P`: Command palette
- `Cmd+\`: Toggle sidebar
- `Cmd+Shift+T`: Settings
- `Escape`: Close modals/palette

### 9. Error Handling & Notifications ⭐ NEW

- **ErrorBoundary**: Catches React errors, displays user-friendly UI
- **Toast Notifications**: Sonner integration for notifications
- **Reload Button**: ErrorBoundary provides app reload option

---

## Data Storage

### Database Schema (SQLite)

**Tables:**

```sql
-- Notes with hierarchy support
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,              -- TipTap JSON
  preview TEXT,                        -- First 150 chars
  file_path TEXT,                      -- ⚠️ DEPRECATED (not used)
  folder_id TEXT,                      -- Foreign key to folders
  parent_id TEXT,                      -- ⭐ NEW: Foreign key to notes (hierarchy)
  pinned INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,         -- Unix timestamp (ms)
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES notes(id) ON DELETE SET NULL
);

-- ⭐ NEW: Page linking table
CREATE TABLE page_links (
  id TEXT PRIMARY KEY,
  source_page_id TEXT NOT NULL,
  target_page_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (source_page_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (target_page_id) REFERENCES notes(id) ON DELETE CASCADE,
  UNIQUE(source_page_id, target_page_id)
);

-- Folders with hierarchy
CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT,                      -- Nested folders
  created_at INTEGER NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE SET NULL
);

-- Sticky notes with colors
CREATE TABLE sticky_notes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  color_id TEXT NOT NULL DEFAULT 'default',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Tags (schema exists, minimal usage)
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE note_tags (
  note_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Full-text search index
CREATE VIRTUAL TABLE notes_fts USING fts5(
  id UNINDEXED,
  title,
  content,                             -- Plain text extracted from JSON
  tags,
  tokenize='porter unicode61'          -- Stemming + Unicode
);
```

**Indexes for Performance:**
- `idx_notes_folder` on `notes(folder_id)`
- `idx_notes_updated` on `notes(updated_at DESC)`
- `idx_notes_parent` on `notes(parent_id)` ⭐ NEW
- `idx_folders_parent` on `folders(parent_id)`
- `idx_page_links_source` on `page_links(source_page_id)` ⭐ NEW
- `idx_page_links_target` on `page_links(target_page_id)` ⭐ NEW

**Database Optimizations:**
- **WAL Mode**: Write-Ahead Logging for concurrent access
- **LRU Cache**: 1000-entry cache for note metadata
- **Pragma Settings**: 64MB cache, memory temp store, 256MB mmap
- **Recursive CTEs**: Cycle detection for page hierarchy moves

**Storage Location:**
- Database: `~/Documents/Draft/draft.db`
- Legacy notes folder: `~/Documents/Draft/notes/` (⚠️ not actively used)

### Data Flow

1. **Content Storage**: Notes stored as TipTap JSON in SQLite `content` column
2. **Search Indexing**: Plain text extracted from JSON → inserted into `notes_fts`
3. **Preview Generation**: First 150 characters extracted for list views
4. **Page Links**: Extracted from TipTap JSON → synced to `page_links` table
5. **Hierarchy**: `parent_id` references create tree structure

---

## Bugs Found 🐛

### Critical Issues

#### 1. **Race Condition in Content Saving** (noteStore.ts:480-570)
- **Issue**: Multiple simultaneous saves could conflict despite module-level tracker
- **Location**: `saveCurrentNoteContent` function
- **Severity**: HIGH - Could cause data loss
- **Details**:
  - Uses module-level `activeSaveOperation` tracker
  - Has safety timeout (5s) but timeout doesn't prevent new saves
  - `isSaving` flag checked after `await`, state could change
- **Fix**: Add save queue or mutex lock pattern

#### 2. **Missing Cleanup in EditorContent** (EditorContent.tsx:280-310)
- **Issue**: Window blur event listener not properly cleaned up
- **Location**: `useEffect` for window blur handler
- **Severity**: MEDIUM - Memory leak on unmount
- **Details**: `window.removeEventListener("blur")` exists but reference might not match
- **Fix**: Store handler reference in ref

#### 3. **Unsafe Await in usePageCommand** (usePageCommand.ts:88-150)
- **Issue**: Multiple async operations without proper error boundaries
- **Location**: Page link insertion after subpage creation
- **Severity**: MEDIUM - Navigation could happen before link saves
- **Details**:
  - Creates subpage → inserts link → saves → navigates
  - If save fails, link lost but navigation occurs
  - No rollback mechanism
- **Fix**: Transaction-like behavior or proper error recovery

### Medium Issues

#### 4. **Timeout Race in listNotes** (noteStore.ts:75-95)
- **Issue**: Promise.race with timeout but result not checked
- **Location**: `loadNotes` function
- **Severity**: MEDIUM
- **Details**: 5s timeout but no handling of which promise won
- **Fix**: Check which promise resolved

#### 5. **Optimistic Update Rollback Gap** (noteStore.ts:120-180)
- **Issue**: Optimistic updates rolled back but UI might flash
- **Location**: `createNote` function
- **Severity**: LOW - UX issue
- **Details**: Creates temp note with `temp-${Date.now()}` ID, replaces on success
- **Improvement**: Add loading state indicator

#### 6. **Page Link Title Update Race** (noteStore.ts:210-245)
- **Issue**: Updates page link titles but doesn't wait for completion
- **Location**: `updateNote` function
- **Severity**: MEDIUM
- **Details**:
  ```typescript
  await commands.updatePageLinkTitles(id, note.title);
  // If current note is affected, reload it
  if (currentNote && backlinks.includes(currentNote.id)) {
    await get().loadNote(currentNote.id);
  }
  ```
  - Doesn't handle if title update fails
- **Fix**: Add error handling, retry logic

#### 7. **Children Count Inconsistency** (noteStore.ts:380-410)
- **Issue**: `children_count` manually tracked and could desync
- **Location**: Multiple places in noteStore
- **Severity**: LOW - Display issue
- **Details**: Frontend tracks count, backend doesn't compute it
- **Fix**: Compute count in SQL query: `SELECT COUNT(*) FROM notes WHERE parent_id = ?`

### Low Priority Issues

#### 8. **Unused FileService** (file_service.rs)
- **Issue**: Entire service exists but notes stored in DB only
- **Location**: `src-tauri/src/services/file_service.rs`
- **Severity**: LOW - Code bloat
- **Fix**: Remove or repurpose for backups

#### 9. **Tags Feature Incomplete** (database.rs)
- **Issue**: Schema exists but no UI/commands
- **Location**: `tags` and `note_tags` tables
- **Severity**: LOW - Dead code
- **Fix**: Complete feature or remove schema

#### 10. **Hard-coded Preview Length** (notes.rs:16)
- **Issue**: `PREVIEW_MAX_LENGTH = 150` not configurable
- **Severity**: TRIVIAL
- **Fix**: Move to settings or config

#### 11. **Type Safety: `any` Usage**
Found in several locations:
- `EditorContent.tsx:82`: `extractAndSyncPageLinks(json: any)`
- `usePageCommand.ts`: Similar `any` for JSON
- **Fix**: Define TipTap JSON schema type

#### 12. **Error Messages Not User-Friendly**
- Backend returns technical errors: `"Failed to update note content: {e}"`
- **Fix**: Map technical errors to user-friendly messages

---

## Improvements & Recommendations 💡

### High Priority

#### 1. **Implement Proper Save Queue**
```typescript
// Replace module-level activeSaveOperation with queue
class SaveQueue {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;
  
  async enqueue(fn: () => Promise<void>) {
    this.queue.push(fn);
    if (!this.processing) {
      await this.process();
    }
  }
  
  private async process() {
    this.processing = true;
    while (this.queue.length > 0) {
      const fn = this.queue.shift()!;
      await fn();
    }
    this.processing = false;
  }
}
```

#### 2. **Add Database Migrations System**
- Currently uses `CREATE TABLE IF NOT EXISTS` with `ALTER TABLE` attempts
- **Recommendation**: Use proper migration framework (e.g., `refinery`, `rusqlite-migration`)
- **Benefits**: Versioned schema, rollback support, safer upgrades

#### 3. **Compute Children Count in SQL**
Replace manual tracking with computed query:
```sql
SELECT n.*, 
  (SELECT COUNT(*) FROM notes WHERE parent_id = n.id) as children_count
FROM notes n
```

#### 4. **Add Batch Re-indexing**
Currently re-indexes on every save:
```rust
// In save_note_content - REMOVED re-indexing
// Recommendation: Batch index updates every N seconds
```

#### 5. **Add Comprehensive Error Boundary**
- Wrap each major section (Sidebar, Editor, Notes Grid)
- Provide contextual error messages
- Add error reporting/logging

### Medium Priority

#### 6. **Implement Undo/Redo for Hierarchy**
- Track hierarchy changes (move page, delete page)
- Allow undo within session
- Store in memory, not DB

#### 7. **Add Conflict Resolution for Concurrent Edits**
- Detect if note modified since last load
- Show diff/merge UI
- Operational Transform or CRDT approach

#### 8. **Virtualize Long Lists**
- Already using `react-virtuoso` for sticky notes
- Apply to hierarchical notes list if > 100 notes
- Performance improvement for large note collections

#### 9. **Add Bulk Operations**
- Select multiple notes
- Bulk delete, move, tag
- UI: Checkbox selection mode

#### 10. **Enhance Search**
- Search within folder
- Filter by date range
- Sort options (relevance, date, title)
- Search history

#### 11. **Add Backlinks Panel**
- Show which pages link to current page
- Click to navigate
- Real-time updates

#### 12. **Improve Page Link UX**
- Show page preview on hover
- Broken link detection (deleted pages)
- Orphaned page warnings

### Low Priority

#### 13. **Add Tests**
**Backend:**
- Unit tests for database operations
- Integration tests for commands
- Test circular reference detection

**Frontend:**
- Component tests (React Testing Library)
- E2E tests (Playwright/Tauri test framework)
- Test keyboard shortcuts

#### 14. **Add Telemetry/Analytics**
- Track feature usage (privacy-respecting)
- Crash reporting
- Performance metrics

#### 15. **Add Keyboard Shortcut Customization**
- Let users remap shortcuts
- Store in settings
- Conflict detection

#### 16. **Add Note Templates**
- Pre-defined note structures
- Meeting notes, daily journal, etc.
- Stored in DB or files

#### 17. **Add Export to Multiple Formats**
- PDF export
- HTML export
- Rich text (RTF)

#### 18. **Add Import from Other Apps**
- Notion import
- Evernote import
- Obsidian vault import

#### 19. **Add Note Encryption**
- Encrypt sensitive notes
- Password/biometric unlock
- Use SQLCipher or encrypt content field

#### 20. **Add Collaborative Features**
- Sync via cloud (optional)
- Conflict resolution
- Version history

---

## Performance Optimizations

### Current Optimizations ✅

1. **LRU Cache**: 1000-entry cache for note metadata
2. **WAL Mode**: Concurrent reads during writes
3. **Debounced Saves**: 500ms delay prevents excessive writes
4. **FTS5 Index**: Fast full-text search
5. **Lazy Loading**: Children loaded on expansion only
6. **React Virtualization**: For sticky notes grid
7. **Memory-Mapped I/O**: 256MB mmap for SQLite

### Potential Optimizations

1. **Index Cleanup**: Remove `file_path` index (column deprecated)
2. **Batch Index Updates**: Queue FTS updates every 5s
3. **Memoize Preview Generation**: Cache in memory
4. **Reduce Re-renders**: Use React.memo for NoteListItem
5. **Code Splitting**: Lazy load Settings, Command Palette
6. **Web Workers**: Parse TipTap JSON in worker thread
7. **Image Optimization**: If adding images, use lazy loading

---

## Security Considerations

### Current Security

1. **SQL Injection**: ✅ Uses parameterized queries throughout
2. **XSS**: ✅ React escapes content by default
3. **File Path Traversal**: ⚠️ Import file path not validated
4. **TipTap JSON Validation**: ✅ Validates JSON structure before save

### Recommendations

1. **Validate Import Paths**: Ensure file paths within allowed directories
2. **Content Security Policy**: Add CSP headers in Tauri
3. **Sanitize User Input**: Already good, maintain this
4. **Rate Limiting**: Add limits on search queries
5. **Encrypt Sensitive Data**: Option to encrypt note content

---

## Code Quality Assessment

### ✅ Strengths

1. **Type Safety**: Strong TypeScript + Rust typing throughout
2. **Separation of Concerns**: Clear frontend/backend boundaries
3. **State Management**: Well-organized Zustand stores
4. **Error Handling**: Proper `Result` types in Rust
5. **Performance**: LRU cache, WAL mode, debouncing
6. **Modern Stack**: Latest React, Tauri, Tailwind
7. **Custom Extensions**: Well-architected TipTap extensions
8. **Hierarchy Implementation**: Solid recursive structure
9. **Page Linking**: Comprehensive bi-directional link system

### ⚠️ Areas for Improvement

1. **Test Coverage**: No tests currently
2. **Error Messages**: Too technical for end users
3. **Race Conditions**: Some save/update conflicts possible
4. **Unused Code**: FileService, incomplete tags feature
5. **Documentation**: Limited inline documentation
6. **Cleanup Handlers**: Some event listeners could leak
7. **Type Safety**: Some `any` types in JSON handling
8. **Migration System**: No formal database migrations

---

## File Structure Summary

### Frontend Components (60+ components)

**Layout (12 files):**
- AppShell, Sidebar, TitleBar
- NotesList, HierarchicalNotesList (tree view)
- NoteListItem, SidebarNavigation, SidebarSearch, SidebarSettings

**Editor (8 files):**
- Editor, EditorTitle, EditorContent
- SlashCommandMenu, PageLinkMenu, PageLinkSuggestion
- FloatingToolbar, SlashDropdownMenu

**Notes (3 files):**
- NotesGrid, StickyNote, DeleteNoteModal

**UI Components (15+ files):**
- Button, Input, Modal, Dropdown, IconButton, etc.

**TipTap Icons (119+ files):**
- Complete icon set for editor toolbar

**Other:**
- CommandPalette, Settings, ErrorBoundary, Welcome

### Backend Commands (7 files)

- `notes.rs` - Note CRUD + hierarchy (15 commands)
- `page_links.rs` - Page linking (6 commands) ⭐ NEW
- `folders.rs` - Folder management (5 commands)
- `sticky_notes.rs` - Sticky notes (5 commands)
- `search.rs` - Full-text search (1 command)
- `export.rs` - Export functionality (2 commands)
- `mod.rs` - Module exports

### State Management (4 stores)

- `noteStore.ts` - Notes + hierarchy + page links (800+ lines)
- `uiStore.ts` - UI state (sidebar, focus, palette)
- `stickyNotesStore.ts` - Sticky notes state
- `settingsStore.ts` - User preferences

### Custom Hooks (15+ hooks)

- `useKeyboardShortcuts`, `useNotes`, `useTheme`, `useWindowFocus`
- `usePageCommand`, `usePageLinkSuggestion` ⭐ NEW
- TipTap hooks: `use-window-size`, `use-cursor-visibility`, etc.

### TipTap Extensions (6 extensions)

- `page-link-extension` ⭐ NEW
- `ui-state-extension`
- `node-alignment-extension`
- `node-background-extension`
- `list-normalization-extension`

---

## Dependencies

### Frontend (package.json)

**Core:**
- react: 19.1.0
- react-dom: 19.1.0
- typescript: 5.8.3
- vite: 7.0.4

**Tauri:**
- @tauri-apps/api: ^2
- @tauri-apps/plugin-dialog: ^2.4.2
- @tauri-apps/plugin-fs: ^2.4.4
- @tauri-apps/plugin-opener: ^2

**Editor:**
- @tiptap/react: ^3.15.3
- @tiptap/starter-kit: ^3.15.3
- @tiptap/extension-*: Multiple extensions

**UI:**
- @headlessui/react: ^2.2.9
- @hugeicons/react: ^1.1.4
- tailwindcss: ^4.1.18
- framer-motion: ^12.24.7
- sonner: ^2.0.7 ⭐ (toast notifications)

**State & Utils:**
- zustand: ^5.0.9
- cmdk: ^1.1.1 (command palette)
- react-virtuoso: ^4.18.1
- lodash.throttle: ^4.1.1

### Backend (Cargo.toml)

**Core:**
- tauri: 2
- serde: 1
- serde_json: 1

**Database:**
- rusqlite: 0.32 (bundled)
- lru: 0.12

**Utilities:**
- uuid: 1.11 (v4, serde)
- dirs: 6
- chrono: 0.4 (serde)

**Plugins:**
- tauri-plugin-opener: 2
- tauri-plugin-fs: 2
- tauri-plugin-dialog: 2

---

## Recent Changes (Git History)

### Latest 5 Commits

1. **f9711ee** - Refactor: Remove console logs, streamline subpage creation
2. **80ec7d5** - Feat: Enhanced editor content management, better note switching
3. **1df020e** - Feat: Page link command handling + title synchronization
4. **7420b32** - Feat: Sonner toasts + ErrorBoundary + UI refactor
5. **a1c9374** - Feat: Hierarchical page structure + linking feature (MAJOR)

### Major Features Added

- ✅ Page hierarchy with parent-child relationships
- ✅ Page linking with @ mentions
- ✅ Backlinks tracking
- ✅ Title synchronization across links
- ✅ Error boundary for React errors
- ✅ Toast notifications (Sonner)
- ✅ Hierarchical tree view with expand/collapse

---

## Overall Assessment

**Rating: 8.5/10** ⭐ (Up from 8/10)

**Significant Improvements:**
- Hierarchical page structure is well-implemented
- Page linking feature is comprehensive
- Error handling improved with ErrorBoundary
- Toast notifications ready for use
- Code organization is excellent

**This is a production-ready desktop note-taking application** with:

- ✅ Modern, maintainable tech stack
- ✅ Rich editing features (TipTap)
- ✅ Hierarchical page organization
- ✅ Cross-page linking (bi-directional)
- ✅ Fast full-text search (FTS5)
- ✅ Good keyboard navigation
- ✅ Clean code organization
- ✅ Error boundaries for resilience

**Main Gaps:**
- ⚠️ No test coverage
- ⚠️ Some race conditions in save logic
- ⚠️ Unused code (FileService, tags)
- ⚠️ No formal migration system
- ⚠️ User-facing errors too technical

**Recommended Next Steps:**

### Immediate (High Priority)
1. Fix race condition in `saveCurrentNoteContent` (add proper queue)
2. Clean up unused FileService code
3. Add database migration system
4. Fix window blur event listener cleanup
5. Compute `children_count` in SQL instead of manual tracking

### Short-term (Medium Priority)
6. Complete tags feature or remove schema
7. Add backlinks panel in UI
8. Improve page link UX (previews, broken link detection)
9. Add user-friendly error messages
10. Add comprehensive tests (unit + integration)

### Long-term (Low Priority)
11. Add undo/redo for hierarchy operations
12. Implement conflict resolution for concurrent edits
13. Add bulk operations (multi-select)
14. Add note templates
15. Add encryption option for sensitive notes

---

## Conclusion

**UseDraft is a well-architected, feature-rich note-taking application** that successfully combines hierarchical organization with rich text editing and cross-page linking. The recent additions (page hierarchy, page linking, error boundaries) significantly enhance the application's capabilities.

The codebase demonstrates:
- Strong architectural decisions
- Good separation of concerns
- Modern best practices
- Performance optimizations
- Comprehensive feature set

With the recommended bug fixes and improvements, this application would be **excellent** for production use.

---

_Analysis Date: January 10, 2026_  
_Analyzed By: Claude Code (Comprehensive Review)_  
_Project: Draft (usedraft)_  
_Version: 0.1.0_
