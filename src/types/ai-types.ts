/**
 * AI Edit Types
 * TypeScript definitions for AI-powered editing functionality
 */

export type AIEditAction = "replace" | "insert" | "delete";

export interface AIEdit {
    nodeKey: string;
    action: AIEditAction;
    newContent: string;
    formatting?: {
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
    };
}

export interface AIEditResponse {
    edits: AIEdit[];
    explanation?: string;
}

export interface EditorNode {
    key: string;
    type: string;
    text: string;
    format?: number;
    children?: EditorNode[];
}

export interface EditorContext {
    nodes: EditorNode[];
    fullText: string;
    selection?: {
        text: string;
        nodeKeys: string[];
        anchorOffset: number;
        focusOffset: number;
    };
}

export interface AIEditState {
    isStreaming: boolean;
    highlightedNodes: string[];
    currentEditNode: string | null;
    streamingText: string;
}

export interface AIServiceConfig {
    provider: "openai" | "anthropic";
    apiKey: string;
    model?: string;
}

export interface SelectionContext {
    text: string;
    nodeKeys: string[];
    start: number;
    end: number;
}

// Markdown-based types for future-proof AI editing
export interface MarkdownSelection {
    text: string;
    startOffset: number;  // Character position in markdown
    endOffset: number;    // Character position in markdown
    contextBefore: string; // 50 chars before for AI context
    contextAfter: string;  // 50 chars after for AI context
}

export interface MarkdownEdit {
    startOffset: number;
    endOffset: number;
    newContent: string;
    explanation?: string;
}

export interface MarkdownAIResponse {
    edits: MarkdownEdit[];
    explanation: string;
}

export interface MarkdownEditorContext {
    fullMarkdown: string;
    selection?: MarkdownSelection;
    documentMetadata?: {
        pageCount: number;
        currentPage: number;
    };
}

