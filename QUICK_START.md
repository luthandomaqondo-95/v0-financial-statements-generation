# Lexical Editor - Quick Start Guide

## 🚀 Getting Started

### 1. Start the Development Server
```bash
cd /home/appimate/Documents/GitHub/v0-financial-statements-generation
npm run dev
```

### 2. Navigate to the Editor
Open your browser and go to:
- Main Dashboard: `http://localhost:3000/dashboard`
- Lexical Editor: `http://localhost:3000/dashboard/editor/lexical`
- MDX Editor (old): `http://localhost:3000/dashboard/editor/mdx`

### 3. Start Editing
The Lexical editor is now the default editor in the `StepFullAFS` component!

## 📚 Component Structure

```
src/components/lexical-editor/
├── editor-context.tsx              # Context provider
├── markdown-converter-plugin.tsx   # Markdown conversion
├── editor-toolbar.tsx              # Standalone toolbar
├── sticky-lexical-toolbar.tsx      # Sticky toolbar
├── lexical-page-editor.tsx         # Page editor
└── index.tsx                       # Exports
```

## 🎯 Key Features

### Text Formatting
- **Bold**: Ctrl/Cmd + B
- **Italic**: Ctrl/Cmd + I
- **Underline**: Ctrl/Cmd + U

### Block Types
- **Paragraph**: Default
- **Heading 1**: Use block type selector
- **Heading 2**: Use block type selector
- **Heading 3**: Use block type selector

### Lists
- **Bullet List**: Click list button
- **Numbered List**: Click numbered list button

### Alignment
- Left, Center, Right, Justify buttons in toolbar

### Page Management
- **Add Page**: Click + button on page header or bottom
- **Delete Page**: Click trash icon (hover over page)
- **Move Page**: Click up/down arrows (hover over page)
- **Change Orientation**: Click portrait/landscape toggle

### Overflow Management
- **Auto-detect**: Red ring appears when content overflows
- **Manual Split**: Click scissors icon on overflow indicator
- **Auto-split**: Content automatically splits after 1 second
- **Batch Split**: Click "Split Overflows" in toolbar

## 🎨 Styling

The editor uses light mode styling for the paper/page:
- White background
- Dark text
- Professional typography
- Clean, modern look

## 💾 Data Storage

Content is stored as Markdown:
- Real-time conversion from Lexical to Markdown
- Loads Markdown on page load
- Compatible with existing data format

## 🔧 Customization

### Adding New Plugins
Edit `lexical-page-editor.tsx`:
```tsx
import { YourPlugin } from "@lexical/your-plugin"

// Add to the component
<YourPlugin />
```

### Adding New Toolbar Buttons
Edit `sticky-lexical-toolbar.tsx`:
```tsx
<Button onClick={yourHandler}>
    <YourIcon className="h-4 w-4" />
</Button>
```

### Modifying Styles
Edit `src/styles/globals.css`:
```css
.lexical-editor-wrapper {
    /* Your custom styles */
}
```

## 🐛 Troubleshooting

### Editor Not Loading
1. Check browser console for errors
2. Verify all dependencies installed: `npm install`
3. Clear cache and rebuild: `rm -rf .next && npm run build`

### Formatting Not Working
1. Ensure you've clicked inside the editor
2. Check that toolbar is visible
3. Try selecting text first

### Content Not Saving
1. Check browser console for errors
2. Verify auto-save is working
3. Check network tab for API calls

### Overflow Not Detected
1. Add more content to the page
2. Check that page dimensions are correct
3. Verify overflow detection code is running

## 📖 API Reference

### LexicalPageEditor Props
```tsx
interface LexicalPageEditorProps {
    content: string                    // Markdown content
    onChange: (content: string) => void // Content change handler
    pageNumber: number                 // Current page number
    totalPages: number                 // Total pages
    onDelete: () => void               // Delete handler
    onAddNext: () => void              // Add page handler
    onMoveUp?: () => void              // Move up handler
    onMoveDown?: () => void            // Move down handler
    settings: PageSettings             // Page settings
    onSettingsChange: (settings: PageSettings) => void
    hideToolbar?: boolean              // Hide inline toolbar
    onEditorFocus?: (ref, index) => void
    onSplitOverflow?: (current, overflow) => void
}
```

### PageSettings
```tsx
interface PageSettings {
    orientation: "portrait" | "landscape"
    margins: {
        top: number
        right: number
        bottom: number
        left: number
    }
}
```

## 🎓 Examples

### Basic Usage
```tsx
import { LexicalPageEditor } from "@/components/lexical-editor"

<LexicalPageEditor
    content="# Hello World\n\nThis is my content."
    onChange={(content) => console.log(content)}
    pageNumber={1}
    totalPages={1}
    onDelete={() => {}}
    onAddNext={() => {}}
    settings={{
        orientation: "portrait",
        margins: { top: 10, right: 15, bottom: 10, left: 15 }
    }}
    onSettingsChange={(settings) => console.log(settings)}
/>
```

### With Context
```tsx
import { LexicalEditorProvider } from "@/components/lexical-editor"

<LexicalEditorProvider>
    <YourComponent />
</LexicalEditorProvider>
```

### Accessing Active Editor
```tsx
import { useLexicalEditorContext } from "@/components/lexical-editor"

function YourComponent() {
    const { activeEditorRef, activePageIndex } = useLexicalEditorContext()
    
    // Use activeEditorRef.current to access the editor
}
```

## 📦 Dependencies

All required packages are already installed:
- lexical ^0.39.0
- @lexical/* packages ^0.39.0

## 🎉 You're Ready!

Start the dev server and begin editing:
```bash
npm run dev
```

Navigate to your AFS editor and enjoy the new Lexical editing experience!

## 📞 Need Help?

- Check `LEXICAL_IMPLEMENTATION.md` for detailed documentation
- Check `IMPLEMENTATION_SUMMARY.md` for testing checklist
- Review the source code in `src/components/lexical-editor/`
- Check browser console for errors
- Verify all dependencies are installed

Happy editing! 🎨✨

