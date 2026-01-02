# Lexical Editor Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         StepFullAFS                              │
│                  (Main Component Wrapper)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   LexicalEditorProvider                          │
│                    (Context Provider)                            │
│  • Manages active editor reference                              │
│  • Tracks active page index                                     │
│  • Provides context to all children                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    StepFullAFSContent                            │
│                   (Main Content Component)                       │
│  • Manages pages array                                          │
│  • Handles page operations (add, delete, move)                  │
│  • Manages zoom, orientation, TOC                               │
│  • Auto-save functionality                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│ StickyLexicalEditorToolbar│  │   Pages Container        │
│  • Shared toolbar         │  │  • Renders all pages     │
│  • Context-aware          │  │  • Zoom controls         │
│  • Updates on focus       │  │  • Scroll container      │
└──────────────────────────┘  └────────┬─────────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────┐
                        │   LexicalPageEditor      │
                        │   (One per page)         │
                        │  • A4 page rendering     │
                        │  • Overflow detection    │
                        │  • Page controls         │
                        └────────┬─────────────────┘
                                 │
                                 ▼
                ┌────────────────────────────────┐
                │      LexicalComposer           │
                │   (Lexical Root Component)     │
                │  • Editor configuration        │
                │  • Node definitions            │
                │  • Theme                       │
                └────────┬───────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ RichTextPlugin│  │HistoryPlugin │  │  ListPlugin  │
│• Content edit │  │• Undo/Redo   │  │• Lists       │
│• Placeholder  │  │• History     │  │• Bullets     │
└──────────────┘  └──────────────┘  └──────────────┘
        │                │                │
        └────────────────┼────────────────┘
                         ▼
        ┌────────────────────────────────┐
        │   Additional Plugins           │
        │  • LinkPlugin                  │
        │  • MarkdownShortcutPlugin      │
        │  • OnChangePlugin              │
        │  • MarkdownConverterPlugin     │
        └────────────────────────────────┘
```

## 🔄 Data Flow

### Content Update Flow
```
User Types
    ↓
ContentEditable (Lexical)
    ↓
OnChangePlugin
    ↓
MarkdownConverterPlugin
    ↓
onChange Handler
    ↓
updatePage(index, content)
    ↓
setPages (State Update)
    ↓
Auto-save Trigger
    ↓
performAutoSave()
    ↓
API / LocalStorage
```

### Editor Focus Flow
```
User Clicks Page
    ↓
onFocus Handler
    ↓
handleEditorFocus(ref, index)
    ↓
setActiveEditor(ref)
    ↓
setActivePageIndex(index)
    ↓
Context Update
    ↓
StickyToolbar Re-renders
    ↓
Toolbar Updates State
```

### Overflow Detection Flow
```
Content Changes
    ↓
ResizeObserver Triggers
    ↓
checkOverflow()
    ↓
Calculate Page Height
    ↓
Compare with Content Height
    ↓
Set isOverflowing State
    ↓
Calculate Split Points
    ↓
Auto-split Timer (1s)
    ↓
handleSplitOverflow()
    ↓
findBreakPoint()
    ↓
Split Content
    ↓
Create New Page
```

## 📦 Component Hierarchy

```
StepFullAFS
└── LexicalEditorProvider
    └── StepFullAFSContent
        ├── Chat Panel (Collapsible)
        │   └── AI Assistant (Future)
        │
        └── Editor/Preview Area
            ├── Toolbar Section
            │   ├── Chat Toggle Button
            │   ├── StickyLexicalEditorToolbar
            │   └── Controls (Split, TOC, Zoom)
            │
            └── Pages Section
                ├── Loading Skeleton (Conditional)
                │
                └── Pages Container
                    ├── LexicalPageEditor (Page 1)
                    │   ├── Page Header
                    │   │   ├── Page Number
                    │   │   └── Controls
                    │   │       ├── Move Up/Down
                    │   │       ├── Orientation Toggle
                    │   │       ├── Add Page
                    │   │       └── Delete Page
                    │   │
                    │   ├── Page Container
                    │   │   ├── LexicalComposer
                    │   │   │   ├── RichTextPlugin
                    │   │   │   ├── HistoryPlugin
                    │   │   │   ├── ListPlugin
                    │   │   │   ├── LinkPlugin
                    │   │   │   ├── MarkdownShortcutPlugin
                    │   │   │   ├── OnChangePlugin
                    │   │   │   └── MarkdownConverterPlugin
                    │   │   │
                    │   │   └── Page Footer
                    │   │
                    │   └── Overflow Indicator (Conditional)
                    │       ├── Alert Icon
                    │       └── Split Button
                    │
                    ├── LexicalPageEditor (Page 2)
                    ├── LexicalPageEditor (Page 3)
                    ├── ...
                    │
                    └── Add Page Button
```

## 🎯 State Management

### Global State (Context)
```typescript
LexicalEditorContext {
    activeEditorRef: RefObject<LexicalEditor | null> | null
    setActiveEditor: (ref) => void
    activePageIndex: number | null
    setActivePageIndex: (index) => void
}
```

### Component State (StepFullAFSContent)
```typescript
State {
    currentPage: number                    // Current page in view
    zoom: string                           // Zoom level (50-150%)
    activeTab: string                      // Active tab (editor/preview)
    isChatOpen: boolean                    // Chat panel visibility
    pages: PageData[]                      // Array of page data
    hasTableOfContents: boolean            // TOC exists flag
    hasUnsavedChanges: boolean             // Unsaved changes flag
}
```

### Page State (LexicalPageEditor)
```typescript
State {
    isOverflowing: boolean                 // Overflow status
    estimatedLines: number                 // Estimated line count
    maxLines: number                       // Max lines allowed
    effectiveLimit: number                 // Effective line limit
    canSplit: boolean                      // Can split content
}
```

## 🔌 Plugin System

### Core Plugins (Lexical)
```
RichTextPlugin
├── Provides: Rich text editing
├── Features: Headings, paragraphs, formatting
└── Required: Yes

HistoryPlugin
├── Provides: Undo/Redo functionality
├── Features: Command history
└── Required: Yes

ListPlugin
├── Provides: List support
├── Features: Ordered/unordered lists
└── Required: Yes

LinkPlugin
├── Provides: Link support
├── Features: URL handling
└── Required: No

MarkdownShortcutPlugin
├── Provides: Markdown shortcuts
├── Features: Auto-formatting
└── Required: No

OnChangePlugin
├── Provides: Change detection
├── Features: State updates
└── Required: Yes
```

### Custom Plugins
```
MarkdownConverterPlugin
├── Provides: Markdown conversion
├── Features: Bidirectional conversion
├── Input: Lexical EditorState
├── Output: Markdown string
└── Required: Yes (for this implementation)
```

## 🎨 Styling Architecture

### CSS Layers
```
Global Styles (globals.css)
├── Theme Variables
│   ├── Colors (oklch)
│   ├── Spacing
│   └── Typography
│
├── Base Styles
│   ├── Reset
│   ├── Typography
│   └── Layout
│
├── Component Styles
│   ├── .lexical-editor-wrapper
│   ├── .lexical-page-editor-container
│   └── .sticky-lexical-toolbar-light
│
└── Utility Classes (Tailwind)
    ├── Spacing
    ├── Colors
    └── Layout
```

### Style Cascade
```
1. Global CSS Variables
2. Tailwind Base Styles
3. Component-specific Styles
4. Inline Styles (for dynamic values)
5. State-based Classes (cn utility)
```

## 🔐 Type Safety

### Type Definitions
```typescript
// Core Types
LexicalEditor                  // From 'lexical'
EditorState                    // From 'lexical'
LexicalNode                    // From 'lexical'

// Custom Types
PageData {
    id: string
    content: string
    settings: PageSettings
    isTableOfContents?: boolean
}

PageSettings {
    orientation: "portrait" | "landscape"
    margins: {
        top: number
        right: number
        bottom: number
        left: number
    }
}

// Context Types
EditorContextType {
    activeEditorRef: RefObject<LexicalEditor | null> | null
    setActiveEditor: (ref) => void
    activePageIndex: number | null
    setActivePageIndex: (index) => void
}
```

## 🚀 Performance Optimizations

### React Optimizations
```
useCallback
├── Memoizes functions
├── Prevents unnecessary re-renders
└── Used for: handlers, callbacks

useMemo
├── Memoizes computed values
├── Prevents expensive calculations
└── Used for: fullContent, derived state

React.memo
├── Memoizes components
├── Prevents unnecessary re-renders
└── Used for: (future optimization)
```

### Lexical Optimizations
```
Editor State
├── Immutable state
├── Efficient updates
└── Minimal re-renders

Plugin System
├── Lazy loading
├── Conditional activation
└── Modular architecture

Virtual Scrolling
├── (Future enhancement)
├── Render visible pages only
└── Improve large document performance
```

## 🔄 Lifecycle

### Component Lifecycle
```
Mount
├── Initialize Context
├── Load Initial Content
├── Setup Observers
└── Register Listeners

Update
├── Content Changes
├── State Updates
├── Re-render Affected Components
└── Trigger Auto-save

Unmount
├── Cleanup Observers
├── Unregister Listeners
├── Clear Timers
└── Save State
```

### Editor Lifecycle
```
Initialize
├── Create Editor Instance
├── Load Plugins
├── Apply Theme
└── Load Initial Content

Active
├── Handle User Input
├── Update State
├── Convert to Markdown
└── Trigger Callbacks

Destroy
├── Save Content
├── Cleanup Plugins
├── Remove Listeners
└── Dispose Editor
```

## 📊 Data Model

### Page Data Structure
```json
{
    "id": "page-1234567890",
    "content": "# Heading\n\nContent here...",
    "settings": {
        "orientation": "portrait",
        "margins": {
            "top": 10,
            "right": 15,
            "bottom": 10,
            "left": 15
        }
    },
    "isTableOfContents": false
}
```

### Document Structure
```json
{
    "pages": [
        { /* Page 1 */ },
        { /* Page 2 */ },
        { /* Page 3 */ }
    ],
    "savedAt": "2025-01-02T12:00:00.000Z",
    "version": "1.0.0"
}
```

## 🎯 Key Design Decisions

1. **Context for Editor Management**
   - Allows toolbar to work across pages
   - Centralized state management
   - Easy to extend

2. **Markdown as Storage Format**
   - Human-readable
   - Version control friendly
   - Easy to migrate
   - Portable

3. **Plugin-based Architecture**
   - Modular and extensible
   - Easy to add features
   - Clean separation of concerns

4. **Page-based Editing**
   - Natural for documents
   - Easy overflow management
   - Print-friendly

5. **Light Mode for Pages**
   - Professional appearance
   - Print-ready
   - Better readability

This architecture provides a solid foundation for a professional document editing experience with room for future enhancements!

