# Notion-Like Editor Project Prompt

## Project Overview

Build a comprehensive Notion-like rich text editor using React, TypeScript, Vite, and Tiptap. The editor should support real-time collaboration, AI-powered features, and a modern, polished UI similar to Notion.

## Tech Stack & Dependencies

### Core Framework

- **React 19.2.0** with TypeScript
- **Vite 7.2.4** as build tool
- **Tiptap 3.15.3** as the rich text editor framework

### Key Dependencies

- `@tiptap/react` - React bindings for Tiptap
- `@tiptap/starter-kit` - Basic editor extensions
- `@tiptap/extension-collaboration` & `@tiptap/extension-collaboration-caret` - Real-time collaboration
- `@tiptap-pro/extension-ai` & `@tiptap-pro/provider` - AI features and collaboration provider
- `yjs` - CRDT for collaborative editing
- `@floating-ui/react` - Floating UI positioning
- `@radix-ui/react-dropdown-menu` & `@radix-ui/react-popover` - UI primitives
- `react-textarea-autosize` - Auto-resizing textareas
- `is-hotkey` & `react-hotkeys-hook` - Keyboard shortcuts
- `lodash.throttle` - Throttling utilities
- `sass-embedded` - SCSS compilation

### Tiptap Extensions Required

- `@tiptap/extension-mention` - @mentions
- `@tiptap/extension-emoji` - Emoji support
- `@tiptap/extension-list` - Lists (TaskList, TaskItem)
- `@tiptap/extension-color` & `@tiptap/extension-text-style` - Text colors
- `@tiptap/extension-highlight` - Text highlighting
- `@tiptap/extension-subscript` & `@tiptap/extension-superscript` - Sub/superscript
- `@tiptap/extension-text-align` - Text alignment
- `@tiptap/extension-mathematics` - Math equations
- `@tiptap/extension-typography` - Typography improvements
- `@tiptap/extension-unique-id` - Unique IDs for nodes
- `@tiptap/extension-image` - Image support
- `@tiptap/extension-table` - Table support
- `@tiptap/extension-horizontal-rule` - Horizontal rules
- `@tiptap/extension-drag-handle-react` - Drag handles

## Project Structure

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Root component (renders NotionEditor)
├── index.css                   # Global styles
├── App.css                     # App-specific styles
│
├── components/
│   ├── tiptap-templates/
│   │   └── notion-like/
│   │       ├── notion-like-editor.tsx          # Main editor component
│   │       ├── notion-like-editor-header.tsx   # Editor header
│   │       ├── notion-like-editor-toolbar-floating.tsx  # Floating toolbar
│   │       ├── notion-like-editor-mobile-toolbar.tsx   # Mobile toolbar
│   │       ├── notion-like-editor-theme-toggle.tsx     # Theme toggle
│   │       └── notion-like-editor.scss         # Editor styles
│   │
│   ├── tiptap-node/            # Custom Tiptap node implementations
│   │   ├── blockquote-node/
│   │   ├── code-block-node/
│   │   ├── heading-node/
│   │   ├── horizontal-rule-node/
│   │   ├── image-node/          # Custom image node with alignment, caption
│   │   ├── image-upload-node/   # Image upload with progress
│   │   ├── list-node/
│   │   ├── paragraph-node/
│   │   └── table-node/          # Advanced table with resizing, selection
│   │
│   ├── tiptap-extension/       # Custom Tiptap extensions
│   │   ├── ui-state-extension.ts        # UI state management
│   │   ├── node-background-extension.ts # Node background colors
│   │   ├── node-alignment-extension.ts  # Node alignment
│   │   └── list-normalization-extension.ts # List normalization
│   │
│   ├── tiptap-ui/              # Editor UI components
│   │   ├── slash-dropdown-menu/         # Slash command menu (/)
│   │   ├── mention-dropdown-menu/        # @mention menu
│   │   ├── emoji-dropdown-menu/          # Emoji picker
│   │   ├── ai-menu/                      # AI command menu
│   │   ├── drag-context-menu/            # Drag handle context menu
│   │   ├── ai-ask-button/                 # AI ask button
│   │   ├── heading-button/                # Heading selector
│   │   ├── list-button/                   # List type selector
│   │   ├── mark-button/                   # Text formatting (bold, italic, etc.)
│   │   ├── text-button/                   # Text style buttons
│   │   ├── color-text-button/             # Text color picker
│   │   ├── color-highlight-button/        # Highlight color picker
│   │   ├── text-align-button/             # Text alignment
│   │   ├── blockquote-button/              # Blockquote toggle
│   │   ├── code-block-button/             # Code block toggle
│   │   ├── image-upload-button/           # Image upload trigger
│   │   ├── image-align-button/            # Image alignment
│   │   ├── image-caption-button/          # Image caption toggle
│   │   ├── image-download-button/         # Image download
│   │   ├── link-popover/                  # Link editor
│   │   ├── undo-redo-button/              # Undo/redo
│   │   ├── copy-to-clipboard-button/      # Copy content
│   │   ├── copy-anchor-link-button/       # Copy anchor link
│   │   ├── delete-node-button/             # Delete node
│   │   ├── duplicate-button/              # Duplicate node
│   │   ├── move-node-button/              # Move node
│   │   ├── turn-into-dropdown/            # Convert node type
│   │   ├── improve-dropdown/              # AI improve options
│   │   └── reset-all-formatting-button/   # Reset formatting
│   │
│   ├── tiptap-ui-primitive/    # Reusable UI primitives
│   │   ├── button/              # Button component
│   │   ├── card/                # Card component
│   │   ├── dropdown-menu/       # Dropdown menu
│   │   ├── popover/             # Popover component
│   │   ├── tooltip/             # Tooltip component
│   │   ├── input/               # Input component
│   │   ├── textarea-autosize/   # Auto-resizing textarea
│   │   ├── combobox/            # Combobox component
│   │   ├── menu/                # Menu component
│   │   ├── separator/           # Separator component
│   │   ├── badge/               # Badge component
│   │   ├── avatar/              # Avatar component
│   │   ├── label/               # Label component
│   │   ├── toolbar/             # Toolbar component
│   │   ├── sidebar/             # Sidebar component
│   │   └── spacer/              # Spacer component
│   │
│   ├── tiptap-ui-utils/         # UI utility components
│   │   ├── floating-element/    # Floating element positioning
│   │   └── suggestion-menu/    # Reusable suggestion menu (for slash, mention, emoji)
│   │
│   └── tiptap-icons/            # Icon components (97 icon files)
│
├── contexts/                    # React contexts for state management
│   ├── user-context.tsx         # User state (name, color, avatar, ID)
│   ├── collab-context.tsx       # Collaboration state (provider, ydoc)
│   ├── ai-context.tsx           # AI state (token, availability)
│   └── app-context.tsx          # App-level state
│
├── hooks/                       # Custom React hooks
│   ├── use-tiptap-editor.ts     # Get editor instance
│   ├── use-ui-editor-state.ts   # Get UI state from editor
│   ├── use-floating-element.ts  # Floating UI positioning
│   ├── use-floating-toolbar-visibility.ts  # Toolbar visibility logic
│   ├── use-element-rect.ts      # Element bounding rect
│   ├── use-window-size.ts       # Window size tracking
│   ├── use-is-breakpoint.ts     # Responsive breakpoints
│   ├── use-menu-navigation.ts   # Keyboard navigation for menus
│   ├── use-on-click-outside.ts # Click outside detection
│   ├── use-scrolling.ts         # Scroll detection
│   ├── use-throttled-callback.ts # Throttled callbacks
│   ├── use-cursor-visibility.ts # Cursor visibility
│   ├── use-composed-ref.ts      # Composed refs
│   ├── use-isomorphic-layout-effect.ts # SSR-safe layout effect
│   └── use-unmount.ts           # Unmount detection
│
├── lib/                         # Utility libraries
│   ├── tiptap-utils.ts          # Core Tiptap utilities
│   ├── tiptap-advanced-utils.ts # Advanced Tiptap utilities
│   └── tiptap-collab-utils.ts   # Collaboration utilities
│
└── styles/                      # Global styles
    ├── _variables.scss          # CSS variables (colors, spacing, etc.)
    └── _keyframe-animations.scss # Keyframe animations
```

## Core Features to Implement

### 1. Editor Setup

- Create a `NotionEditor` component that accepts a `room` prop (for collaboration)
- Set up provider hierarchy: `UserProvider` → `AppProvider` → `CollabProvider` → `AiProvider`
- Initialize Tiptap editor with all required extensions
- Configure collaboration using `TiptapCollabProvider` and `yjs`
- Set up AI extension with proper token handling

### 2. Custom Extensions

#### UI State Extension

- Create a custom extension that manages UI state (AI generation status, drag state, etc.)
- Store state in extension storage
- Provide commands to update UI state
- Default state includes:
  - `aiGenerationIsSelection`, `aiGenerationIsLoading`, `aiGenerationActive`, `aiGenerationHasMessage`
  - `commentInputVisible`, `lockDragHandle`, `isDragging`

#### Node Background Extension

- Allow setting background colors on block nodes
- Support color picker integration

#### Node Alignment Extension

- Support left, center, right alignment for nodes
- Apply to headings, paragraphs, images

#### List Normalization Extension

- Normalize list structures for consistent rendering

### 3. Custom Nodes

#### Image Node

- Custom image node with:
  - Alignment (left, center, right)
  - Caption support
  - Resizing
  - Download functionality
  - Custom styling

#### Image Upload Node

- Upload progress indicator
- File size validation (5MB max)
- Multiple file upload support (limit: 3)
- Error handling

#### Table Node

- Resizable columns and rows
- Cell selection
- Table handle menu
- Extend row/column buttons
- Cell handle menu
- Selection overlay
- Custom styling

#### Horizontal Rule Node

- Custom styled horizontal rule
- Custom extension implementation

### 4. UI Components

#### Slash Command Menu (/)

- Triggered by typing "/"
- Grouped menu items (Basic blocks, Media, Advanced, etc.)
- Keyboard navigation (arrow keys, enter)
- Filter/search functionality
- Icons for each command
- Commands include: headings, lists, quotes, code blocks, tables, images, etc.

#### Mention Menu (@)

- User mention support
- Dropdown with user list
- Avatar display

#### Emoji Menu

- Emoji picker
- GitHub emoji set
- Search/filter

#### AI Menu

- AI command menu
- Options: improve, expand, shorten, change tone, etc.
- Loading states
- Selection-based AI operations

#### Floating Toolbar

- Appears on text selection
- Formatting buttons (bold, italic, underline, strikethrough)
- Link button
- Color pickers
- Alignment options
- Context-aware visibility

#### Drag Context Menu

- Appears on node hover
- Options: duplicate, delete, turn into, move up/down
- Custom styling

#### Mobile Toolbar

- Responsive toolbar for mobile
- Essential formatting options
- Portal rendering to body

### 5. Context Providers

#### User Context

- Manage user state (ID, name, color, avatar)
- Persist to localStorage
- Generate random username/color if not set
- Avatar generation from name hash

#### Collaboration Context

- Initialize `TiptapCollabProvider`
- Create Yjs document
- Handle connection state
- Support `?noCollab=1` URL parameter to disable

#### AI Context

- Fetch AI token
- Handle AI availability
- Support `?noAi=1` URL parameter to disable

#### App Context

- App-level state management

### 6. Utility Functions

#### Tiptap Utils (`lib/tiptap-utils.ts`)

- `isMac()` - Detect macOS
- `formatShortcutKey()` - Format keyboard shortcuts
- `parseShortcutKeys()` - Parse shortcut strings
- `isMarkInSchema()` / `isNodeInSchema()` - Check schema
- `focusNextNode()` - Navigation
- `isValidPosition()` - Position validation
- `isExtensionAvailable()` - Extension check
- `findNodeAtPosition()` - Find node by position
- `findNodePosition()` - Find position of node
- `isNodeTypeSelected()` - Check selection
- `selectionWithinConvertibleTypes()` - Type conversion check
- `handleImageUpload()` - Image upload handler
- `isAllowedUri()` / `sanitizeUrl()` - URL validation
- `updateNodesAttr()` - Update node attributes
- `selectCurrentBlockContent()` - Select block content
- `getSelectedNodesOfType()` - Get selected nodes

#### Advanced Utils (`lib/tiptap-advanced-utils.ts`)

- `chunkArray()` - Array chunking
- `hasContentAbove()` - Content detection
- `getActiveMarkAttrs()` - Get mark attributes
- `findSelectionPosition()` - Find selection position
- `getSelectedDOMElement()` - Get DOM element
- `getClosestNode()` - Find closest node
- `getClosestNodeByPos()` - Find node by position
- `getAllMatchingNodes()` - Find all matching nodes
- `getAnchorNodeAndPos()` - Get anchor node
- `selectionHasText()` - Check for text
- `getEditorExtension()` - Get extension instance

#### Collaboration Utils (`lib/tiptap-collab-utils.ts`)

- `getUrlParam()` - URL parameter parsing
- `getNodeDisplayName()` - Node display name
- `removeEmptyParagraphs()` - Clean content
- `getElementOverflowPosition()` - Overflow detection
- `isSelectionValid()` - Selection validation
- `isTextSelectionValid()` - Text selection check
- `getSelectionBoundingRect()` - Selection bounds
- `getAvatar()` - Avatar URL generation
- `fetchCollabToken()` - Fetch collaboration token
- `fetchAiToken()` - Fetch AI token

### 7. Styling System

#### CSS Variables (`styles/_variables.scss`)

- Color system:
  - Gray scale (light/dark mode, alpha variants)
  - Brand colors (purple theme)
  - Text colors (gray, brown, orange, yellow, green, blue, purple, pink, red)
  - Highlight colors (all text colors with contrast variants)
- Spacing: radius variables (xxs to xl)
- Transitions: duration and easing functions
- Shadows: elevated shadow for cards/modals
- Global colors: background, border, sidebar, scrollbar, cursor, selection

#### Component Styles

- SCSS files for each major component
- BEM-like naming convention
- Dark mode support via `.dark` class
- Responsive design considerations

### 8. Hooks Implementation

#### Editor Hooks

- `useTiptapEditor()` - Get editor from context
- `useUiEditorState()` - Get UI state from editor storage

#### UI Hooks

- `useFloatingElement()` - Floating UI positioning with `@floating-ui/react`
- `useFloatingToolbarVisibility()` - Show/hide floating toolbar based on selection
- `useElementRect()` - Track element bounding rect with ResizeObserver
- `useWindowSize()` - Track window dimensions
- `useIsBreakpoint()` - Responsive breakpoint detection
- `useMenuNavigation()` - Keyboard navigation (arrow keys, enter, escape)
- `useOnClickOutside()` - Click outside detection
- `useScrolling()` - Scroll event detection
- `useThrottledCallback()` - Throttle function calls
- `useCursorVisibility()` - Cursor visibility tracking
- `useComposedRef()` - Combine multiple refs
- `useIsomorphicLayoutEffect()` - SSR-safe layout effect
- `useUnmount()` - Component unmount detection

### 9. Environment Variables

Required environment variables:

- `VITE_TIPTAP_COLLAB_DOC_PREFIX` - Document prefix for collaboration
- `VITE_TIPTAP_COLLAB_APP_ID` - Collaboration app ID
- `VITE_TIPTAP_COLLAB_TOKEN` - Collaboration JWT token (dev only)
- `VITE_TIPTAP_AI_APP_ID` - AI app ID
- `VITE_TIPTAP_AI_TOKEN` - AI JWT token (dev only)
- `VITE_USE_JWT_TOKEN_API_ENDPOINT` - Use API endpoint for tokens (optional)

### 10. Key Implementation Details

#### Editor Configuration

- Use `immediatelyRender: false` for better performance
- Configure StarterKit with custom settings (disable undoRedo, custom dropcursor)
- Set up placeholder with "with-slash" class for slash command hint
- Configure table with resizable columns (min width: 120px)
- Set up image upload with file size limits and error handling
- Configure UniqueID for specific node types
- Set up AI extension with proper callbacks for loading states

#### Collaboration Setup

- Create Yjs document per room
- Initialize TiptapCollabProvider with document name, app ID, token
- Configure CollaborationCaret with user info (ID, name, color)
- Handle provider lifecycle (destroy on unmount)

#### AI Integration

- Configure AI extension with app ID and token
- Set up callbacks: `onLoading`, `onChunk`, `onSuccess`
- Manage AI generation state in UI state extension
- Auto-accept AI generation when selection-based and message received

#### Keyboard Shortcuts

- Use `is-hotkey` for shortcut detection
- Support Mac/Windows key symbols
- Common shortcuts: Cmd/Ctrl+B (bold), Cmd/Ctrl+I (italic), etc.

#### Responsive Design

- Mobile toolbar for small screens
- Breakpoint-based UI changes
- Touch-friendly interactions

### 11. Component Patterns

#### Suggestion Menu Pattern

- Reusable `SuggestionMenu` component for slash, mention, emoji menus
- Character-based triggering (`/`, `@`, `:`)
- Filter/search functionality
- Keyboard navigation
- Scroll management for overflow

#### Button Pattern

- Consistent button styling
- Icon + text layout
- Active/inactive states
- Ghost/primary variants
- Tooltip support

#### Card Pattern

- Card container with body
- Group labels for categorized items
- Separators between groups
- Max height with scrolling

### 12. File Organization Principles

- **Components**: Grouped by functionality (ui, node, extension, primitive, utils)
- **Hooks**: One hook per file, descriptive names
- **Utils**: Grouped by domain (tiptap-utils, tiptap-advanced-utils, tiptap-collab-utils)
- **Styles**: SCSS with variables, component-specific styles co-located
- **Contexts**: One context per file, provider + hook export
- **Icons**: Individual icon components in `tiptap-icons/` directory

### 13. TypeScript Configuration

- Strict mode enabled
- Path aliases: `@/` maps to `src/`
- React 19 types
- Proper typing for Tiptap extensions and commands
- Module augmentation for custom commands

### 14. Build Configuration

- Vite with React plugin
- SCSS compilation
- Path alias resolution
- TypeScript compilation
- ESLint configuration

## Implementation Checklist

- [ ] Set up Vite + React + TypeScript project
- [ ] Install all required dependencies
- [ ] Configure path aliases (`@/` → `src/`)
- [ ] Set up SCSS compilation
- [ ] Create CSS variable system
- [ ] Implement context providers (User, Collab, AI, App)
- [ ] Create utility functions (tiptap-utils, tiptap-advanced-utils, tiptap-collab-utils)
- [ ] Implement custom extensions (UI State, Node Background, Node Alignment, List Normalization)
- [ ] Create custom nodes (Image, Image Upload, Table, Horizontal Rule)
- [ ] Build UI primitives (Button, Card, Dropdown, Popover, etc.)
- [ ] Implement suggestion menu system
- [ ] Create slash command menu
- [ ] Create mention menu
- [ ] Create emoji menu
- [ ] Create AI menu
- [ ] Build floating toolbar
- [ ] Build drag context menu
- [ ] Create mobile toolbar
- [ ] Implement all UI buttons (heading, list, mark, color, etc.)
- [ ] Set up editor with all extensions
- [ ] Configure collaboration
- [ ] Configure AI integration
- [ ] Implement all custom hooks
- [ ] Add keyboard shortcuts
- [ ] Implement responsive design
- [ ] Add dark mode support
- [ ] Style all components
- [ ] Test collaboration features
- [ ] Test AI features
- [ ] Add error handling
- [ ] Optimize performance

## Notes

- The editor uses a provider pattern for state management
- Collaboration requires Tiptap Cloud or self-hosted collaboration server
- AI features require Tiptap AI subscription
- Image upload handler is a placeholder - implement actual upload logic
- Token fetching should use API endpoints in production (not hardcoded tokens)
- The project uses a modular, component-based architecture
- All styles use CSS variables for theming
- Dark mode is supported via `.dark` class on root element
- The editor supports both desktop and mobile interfaces
- Keyboard navigation is essential for accessibility
