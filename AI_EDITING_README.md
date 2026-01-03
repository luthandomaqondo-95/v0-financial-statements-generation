# AI-Powered Editing for Financial Statements

This document describes the AI editing feature implementation for the Lexical editor in the financial statements generation application.

## Overview

The AI editing feature allows users to make natural language edits to their financial documents with visual streaming effects similar to Canvas and Cursor AI editors.

## Features

- ✨ **Natural Language Editing**: Ask AI to modify content using plain English
- 🎯 **Selection-Based Edits**: Select text and ask AI to edit just that portion
- 📄 **Document-Wide Edits**: Make changes across the entire document
- 🌊 **Streaming Effects**: Visual feedback with Canvas-style highlighting and Cursor-style character streaming
- 🎨 **Node-Based Precision**: Uses Lexical's node keys for accurate targeting
- 🔄 **Undo/Redo Support**: Full history integration

## Setup

### Demo Mode (No API Key Required!)

The AI editing feature includes a **demo mode** that works without an API key! This is perfect for:
- Testing the UX and visual effects
- Demos and presentations
- Development without API costs

**Demo mode is automatically enabled when:**
- No `NEXT_PUBLIC_OPENAI_API_KEY` is set, OR
- `NEXT_PUBLIC_AI_DEMO_MODE=true` is set in `.env.local`

In demo mode, the system generates simulated AI responses locally, showing all the streaming effects without making real API calls.

### Production Mode (With OpenAI)

For production use with real AI, create a `.env.local` file with:

```bash
# AI Provider Configuration
NEXT_PUBLIC_AI_PROVIDER=openai

# OpenAI API Key
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional: AI Model (defaults to gpt-4o-mini)
NEXT_PUBLIC_AI_MODEL=gpt-4o-mini

# Optional: Force demo mode even with API key
# NEXT_PUBLIC_AI_DEMO_MODE=true
```

**Get your OpenAI API key**: https://platform.openai.com/api-keys

### Installation

The feature is already integrated into the codebase. No additional installation required.

## Usage

### Opening the AI Chat

1. Navigate to the Financial Statements editor (Step 5: Finalize)
2. Look for the chat toggle button on the right side
3. Click to open the AI assistant panel

### Making Edits

#### Option 1: Selection-Based Editing

1. Select text in the editor
2. Type your instruction in the chat (e.g., "Increase this by $50,000")
3. Press Enter or click Send
4. Watch as AI applies the edit with streaming effects

#### Option 2: Document-Wide Editing

1. Without selecting any text, type your instruction
2. Example: "Update all cash values to reflect 10% growth"
3. AI will analyze the entire document and make relevant changes

### Example Commands

**For Selected Text (Works in Demo Mode!):**
- "Increase this" - Increases numeric values by 50%
- "Double this" - Doubles all numbers
- "Reduce this" - Reduces values by 25%
- "Uppercase" - Converts to UPPERCASE
- "Title case" - Converts To Title Case

**For Document-Wide (Production Mode):**
- "Increase all asset values by 10%"
- "Update the reporting date to December 31, 2024"
- "Round all financial figures to the nearest thousand"
- "Add 'USD' suffix to all currency values"

**Demo Mode Features:**
- ✅ Selection-based edits with visual effects
- ✅ Number manipulation (increase, double, reduce)
- ✅ Text case conversion
- ✅ Full streaming animation
- ⚠️ Limited document-wide analysis (use production mode for complex edits)

## Architecture

### Components

1. **AI Service** (`src/lib/ai-service.ts`)
    - Handles API calls to OpenAI
    - Formats prompts and parses responses
    - Returns structured edit instructions

2. **Lexical Utilities** (`src/lib/lexical-utils.ts`)
    - Extracts editor context with node keys
    - Applies edits to specific nodes
    - Manages streaming text insertion

3. **AI Edit Hook** (`src/hooks/useAIEdit.ts`)
    - Orchestrates the edit flow
    - Manages streaming state
    - Coordinates visual effects

4. **AI Edit Plugin** (`src/components/lexical-editor/plugins/AIEditPlugin.tsx`)
    - Lexical plugin for visual effects
    - Applies CSS classes during streaming
    - Integrates with editor lifecycle

5. **Chat Component** (`src/components/chat-component.tsx`)
    - User interface for AI interaction
    - Displays selection context
    - Shows message history

### Data Flow

```
User Input → Chat Component
    ↓
Extract Editor Context (nodes, selection)
    ↓
Call AI Service (OpenAI API)
    ↓
Parse AI Response (edits with node keys)
    ↓
Phase 1: Highlight Nodes (yellow, Canvas-style)
    ↓
Phase 2: Stream Edits (blue, Cursor-style)
    ↓
Update Lexical State
    ↓
Auto-save
```

### Visual Effects

**Phase 1 - Highlighting (500ms)**
- Yellow background (`#fef3c7`)
- Orange left border (`#f59e0b`)
- Pulsing animation

**Phase 2 - Streaming (character-by-character)**
- Blue background (`#dbeafe`)
- Blue left border (`#3b82f6`)
- Cursor blink animation
- 20ms delay per 3 characters

**Phase 3 - Completion**
- Fade out animation (500ms)
- Returns to normal state

## Customization

### Adjust Streaming Speed

Edit `src/lib/lexical-utils.ts`:

```typescript
const CHARS_PER_TICK = 3; // Increase for faster streaming
const DELAY_MS = 20;      // Decrease for faster streaming
```

### Change Highlight Colors

Edit `src/styles/globals.css`:

```css
.ai-highlight-pending {
    background-color: #your-color !important;
    border-left-color: #your-color !important;
}
```

### Modify AI Prompt

Edit `src/lib/ai-service.ts` in the `buildSystemPrompt()` function to customize AI behavior.

## API Cost Management

The feature uses OpenAI's API which incurs costs based on usage:

- **Model**: gpt-4o-mini (default, most cost-effective)
- **Alternative**: gpt-4o (more capable, higher cost)

**Cost Optimization Tips:**
1. Use gpt-4o-mini for most edits
2. Switch to gpt-4o only for complex financial logic
3. Monitor usage in OpenAI dashboard
4. Set usage limits in your OpenAI account

## Demo Mode Details

When running in demo mode, you'll see:
- 🎭 Console message: "AI Demo Mode: Generating simulated response"
- Same visual effects as production mode
- 800ms simulated "API" delay
- Intelligent text manipulation based on commands

**Demo Mode Supported Commands:**
- **Numeric operations**: "increase", "double", "reduce", "decrease"
- **Text case**: "uppercase", "lowercase", "title case"
- **Generic edits**: Any other instruction adds " [Edited by AI]"

**Switching Between Modes:**
- Demo → Production: Add `NEXT_PUBLIC_OPENAI_API_KEY` to `.env.local`
- Production → Demo: Remove API key or set `NEXT_PUBLIC_AI_DEMO_MODE=true`
- Restart dev server after changing environment variables

## Troubleshooting

### AI Not Responding

1. **Demo Mode**: Check browser console for "AI Demo Mode" message
2. **Production Mode**: Check `.env.local` has correct API key
3. Verify API key is valid in OpenAI dashboard
4. Check browser console for errors
5. Ensure you have OpenAI credits available

### Edits Not Applying

1. Ensure text is selected (for selection-based edits)
2. Try document-wide edit instead
3. Check that editor is focused
4. Look for errors in browser console

### Streaming Too Fast/Slow

Adjust `CHARS_PER_TICK` and `DELAY_MS` in `src/lib/lexical-utils.ts`

### Highlights Not Showing

1. Check that `src/styles/globals.css` is loaded
2. Verify `.ai-highlight-pending` and `.ai-editing-active` classes exist
3. Check browser DevTools for CSS conflicts

## Security Considerations

- API keys are client-side only (use with caution in production)
- Consider implementing a backend API route to secure keys
- Never commit `.env.local` to version control
- Implement rate limiting for production use

## Future Enhancements

Potential improvements for future versions:

- [ ] Backend API route to secure API keys
- [ ] Support for Anthropic Claude
- [ ] Multi-language support
- [ ] Custom AI instructions per document type
- [ ] Edit history and rollback
- [ ] Batch operations across pages
- [ ] AI suggestions without manual prompting
- [ ] Voice input for commands

## Support

For issues or questions:
1. Check this README first
2. Review browser console for errors
3. Check the plan document: `/ai-edit.plan.md`
4. Review implementation details in source files

## License

Same as parent project.

