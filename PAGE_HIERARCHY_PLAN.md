# Page Hierarchy & Linking Feature - Implementation Plan

## Overview

Implement Notion-like hierarchical pages where:

- Pages can have sub-pages (parent-child relationships)
- Pages can be linked/referenced within other pages using @ mentions
- Zero-lag performance with efficient queries and lazy loading

## Architecture

### Database Schema Changes

#### 1. Add `parent_id` to notes table

```sql
ALTER TABLE notes ADD COLUMN parent_id TEXT;
-- Foreign key to self for hierarchy
-- NULL means top-level page
```

#### 2. Create `page_links` table

```sql
CREATE TABLE page_links (
    id TEXT PRIMARY KEY,
    source_page_id TEXT NOT NULL,
    target_page_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (source_page_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_page_id) REFERENCES notes(id) ON DELETE CASCADE,
    UNIQUE(source_page_id, target_page_id)
);
CREATE INDEX idx_page_links_source ON page_links(source_page_id);
CREATE INDEX idx_page_links_target ON page_links(target_page_id);
```

### Backend Changes

#### Models

- Update `Note` and `NoteMetadata` to include `parent_id: Option<String>`
- Add `children_count: Option<u32>` to `NoteMetadata` for efficient UI rendering
- Create `PageLink` model for tracking references

#### Commands

1. **create_subpage** - Create a page with a parent
2. **move_page** - Change a page's parent (move in hierarchy)
3. **get_page_hierarchy** - Get children of a page (lazy loaded)
4. **link_page** - Create a page link reference
5. **unlink_page** - Remove a page link
6. **get_linked_pages** - Get all pages linked from/to a page
7. **get_page_backlinks** - Get pages that link to this page

### Frontend Changes

#### TipTap Extension

- Create `PageLinkExtension` that:
  - Detects `@` mentions
  - Shows autocomplete dropdown with pages
  - Renders as clickable page links
  - Stores page ID in node attributes

#### Components

1. **PageLink** - Renders page links in editor (clickable, shows title)
2. **PageHierarchy** - Shows page tree in sidebar with indentation
3. **SubPageButton** - Button to create sub-pages
4. **PageMentionMenu** - Autocomplete menu for @ mentions

#### State Management

- Add `parentId` to note store
- Add `children` map for lazy-loaded children
- Add `pageLinks` map for tracking references

## Performance Optimizations

1. **Lazy Loading**

   - Only load children when parent is expanded
   - Cache loaded children
   - Load page links on-demand

2. **Efficient Queries**

   - Use indexes on parent_id
   - Batch queries for multiple pages
   - Cache hierarchy structure

3. **Virtualization**

   - Use existing virtualization for large hierarchies
   - Render only visible items

4. **Debouncing**
   - Debounce page link updates
   - Batch database writes

## Implementation Order

### Phase 1: Database & Backend Foundation

1. Database migrations
2. Update models
3. Add basic commands (create_subpage, move_page)

### Phase 2: Backend Linking

4. Page linking commands
5. Backlink queries

### Phase 3: Frontend Hierarchy UI

6. Update Sidebar to show hierarchy
7. Add sub-page creation UI
8. Add drag-and-drop for moving pages

### Phase 4: Page Linking in Editor

9. TipTap page link extension
10. @ mention autocomplete
11. Page link rendering

### Phase 5: Performance & Polish

12. Lazy loading implementation
13. Caching layer
14. Testing & optimization

## Data Flow

### Creating a Sub-Page

1. User clicks "New Sub-Page" on parent
2. Frontend calls `create_subpage(parent_id, title)`
3. Backend creates note with parent_id
4. Frontend updates hierarchy tree
5. New page opens in editor

### Linking a Page

1. User types `@` in editor
2. TipTap extension shows autocomplete
3. User selects page
4. Extension inserts page link node
5. On save, extract page links from content
6. Backend updates page_links table

### Rendering Hierarchy

1. Load top-level pages (parent_id IS NULL)
2. For each page, check if it has children (children_count > 0)
3. Load children only when expanded (lazy)
4. Render with indentation based on depth

## Edge Cases

1. **Circular References** - Prevent linking page to itself or creating circular parent chains
2. **Deleted Pages** - Handle orphaned links gracefully
3. **Moving Pages** - Prevent moving page into its own descendants
4. **Performance** - Handle very deep hierarchies (limit depth if needed)

## Testing Checklist

- [ ] Create top-level page
- [ ] Create sub-page
- [ ] Create nested sub-pages (3+ levels)
- [ ] Move page to different parent
- [ ] Move page to top-level
- [ ] Link page in content
- [ ] Click page link to navigate
- [ ] View backlinks
- [ ] Delete page with children (should handle gracefully)
- [ ] Delete page with links (should handle gracefully)
- [ ] Performance with 100+ pages
- [ ] Performance with deep hierarchy (10+ levels)
