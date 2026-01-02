# Table of Contents Feature

## Overview

The Lexical Editor now supports a dynamic Table of Contents (TOC) feature that automatically tracks and updates based on the headings in your document.

## How to Use

### Inserting a Table of Contents

1. Open the Lexical editor
2. Click the **Book icon** (📖) in the toolbar
3. A Table of Contents block will be inserted at the cursor position

### Automatic Updates

The Table of Contents automatically updates when you:
- Add new headings (H1, H2, H3)
- Modify existing heading text
- Delete headings
- Reorder content

### Navigation

Click on any heading in the Table of Contents to:
- Automatically scroll to that heading in the document
- Smooth scrolling animation for better UX

## Features

### Visual Hierarchy

The TOC displays headings with visual indicators:
- **H1**: Bold text with `•` bullet
- **H2**: Regular text with `◦` bullet (indented)
- **H3**: Regular text with `▪` bullet (more indented)

### Empty State

When no headings exist in the document:
- Shows a placeholder message
- Styled with dashed border
- Provides guidance to add headings

### Styling

The TOC comes with:
- Clean, modern design
- Border and shadow for visual separation
- Hover effects on heading links
- Responsive indentation based on heading level

## Technical Details

### Files Created

1. **TableOfContentsNode.tsx** - Custom Lexical DecoratorNode
   - Stores heading data
   - Renders the TOC component
   - Handles serialization/deserialization

2. **TableOfContentsPlugin.tsx** - Auto-update plugin
   - Monitors heading changes
   - Updates all TOC nodes in the document
   - Extracts heading text and levels

3. **HeadingAttributePlugin.tsx** - Adds data attributes
   - Adds `data-lexical-heading-key` to heading elements
   - Enables smooth scrolling to headings

### Integration

The TOC is integrated into:
- **lexical-page-editor.tsx** - Node registration and plugin activation
- **editor-toolbar.tsx** - Insert TOC button

### Node Registration

```typescript
nodes: [
    HeadingNode, 
    ListNode, 
    ListItemNode, 
    QuoteNode, 
    CodeNode, 
    LinkNode, 
    TableNode, 
    TableCellNode, 
    TableRowNode,
    TableOfContentsNode, // ← New custom node
]
```

### Plugins

```tsx
<TableOfContentsPlugin />      {/* Auto-updates TOC */}
<HeadingAttributePlugin />     {/* Enables scroll-to-heading */}
```

## API

### Creating a TOC Node

```typescript
import { $createTableOfContentsNode } from "./nodes/TableOfContentsNode";

editor.update(() => {
    const tocNode = $createTableOfContentsNode();
    $insertNodes([tocNode]);
});
```

### Type Guards

```typescript
import { $isTableOfContentsNode } from "./nodes/TableOfContentsNode";

if ($isTableOfContentsNode(node)) {
    // node is a TableOfContentsNode
}
```

## Future Enhancements

Potential improvements:
- Support for H4, H5, H6 headings
- Customizable TOC title
- Option to exclude specific headings
- TOC placement options (top, sidebar, etc.)
- Numbered headings in TOC
- Collapsible sections
- TOC export to markdown/HTML

## Troubleshooting

### TOC not updating

- Ensure `TableOfContentsPlugin` is registered
- Check that headings are properly created using Lexical's HeadingNode

### Scroll-to-heading not working

- Verify `HeadingAttributePlugin` is registered
- Check browser console for errors
- Ensure headings are rendered in the DOM

### Multiple TOCs

You can have multiple TOC blocks in the same document - they will all update independently and show the same headings.

## Examples

### Basic Document Structure

```markdown
# Introduction

[Table of Contents inserted here]

## Overview
Content here...

## Getting Started
Content here...

### Prerequisites
Content here...

### Installation
Content here...

# Advanced Topics
Content here...
```

The TOC will display:
```
Table of Contents
• Introduction
  ◦ Overview
  ◦ Getting Started
    ▪ Prerequisites
    ▪ Installation
• Advanced Topics
```

---

**Note**: This feature requires Lexical editor version with decorator node support.

