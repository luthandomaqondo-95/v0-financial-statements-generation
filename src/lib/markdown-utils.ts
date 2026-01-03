/**
 * Markdown Utilities
 * Helper functions for mapping between Lexical selections and markdown positions
 */

import { LexicalEditor, RangeSelection, $getRoot, $getSelection, $isRangeSelection, $isTextNode, $isElementNode } from "lexical";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { MarkdownSelection, MarkdownEdit, AIEdit } from "@/types/ai-types";

/**
 * Find text in markdown and return its position
 * Uses a hint from Lexical selection to find the correct occurrence
 */
export function findTextInMarkdown(
    markdown: string,
    searchText: string,
    hint?: { start: number; end: number }
): { startOffset: number; endOffset: number } | null {
    if (!searchText) return null;

    // Try exact match first
    let startOffset = markdown.indexOf(searchText);
    
    // If not found, try with normalized whitespace
    if (startOffset === -1) {
        const normalizedSearch = searchText.replace(/\s+/g, ' ').trim();
        const normalizedMarkdown = markdown.replace(/\s+/g, ' ');
        const normalizedOffset = normalizedMarkdown.indexOf(normalizedSearch);
        
        if (normalizedOffset !== -1) {
            // Map back to original markdown position
            let charCount = 0;
            for (let i = 0; i < markdown.length; i++) {
                if (markdown[i].match(/\S/)) charCount++;
                if (charCount === normalizedOffset) {
                    startOffset = i;
                    break;
                }
            }
        }
    }

    if (startOffset === -1) return null;

    const endOffset = startOffset + searchText.length;

    return { startOffset, endOffset };
}

/**
 * Extract markdown selection from Lexical editor
 * Returns markdown-based selection with character positions
 */
export function extractMarkdownSelection(
    editor: LexicalEditor,
    markdownContent: string
): MarkdownSelection | null {
    let selection: MarkdownSelection | null = null;

    editor.getEditorState().read(() => {
        const lexicalSelection = $getSelection();
        
        if (!$isRangeSelection(lexicalSelection)) {
            return;
        }

        const selectedText = lexicalSelection.getTextContent();
        if (!selectedText) return;

        // Find position in markdown
        const position = findTextInMarkdown(markdownContent, selectedText);
        
        if (!position) return;

        const { startOffset, endOffset } = position;

        // Extract context before and after
        const contextBefore = markdownContent.slice(Math.max(0, startOffset - 50), startOffset);
        const contextAfter = markdownContent.slice(endOffset, Math.min(markdownContent.length, endOffset + 50));

        selection = {
            text: selectedText,
            startOffset,
            endOffset,
            contextBefore,
            contextAfter,
        };
    });

    return selection;
}

/**
 * Find Lexical node by markdown position
 * Converts a character offset in markdown to a node key and offset in Lexical
 */
export function findNodeByMarkdownPosition(
    editor: LexicalEditor,
    markdownContent: string,
    markdownOffset: number
): { nodeKey: string; nodeOffset: number } | null {
    let result: { nodeKey: string; nodeOffset: number } | null = null;

    editor.getEditorState().read(() => {
        const root = $getRoot();
        let currentMarkdownOffset = 0;
        
        // Get current markdown from editor
        const currentMarkdown = $convertToMarkdownString(TRANSFORMERS);
        
        // Find which part of the text we're looking for
        const targetText = markdownContent.slice(markdownOffset, markdownOffset + 20);
        
        // Get all text nodes and find the one containing our target position
        const allTextNodes = root.getAllTextNodes();
        
        for (const textNode of allTextNodes) {
            const nodeText = textNode.getTextContent();
            const nodeTextLength = nodeText.length;
            
            // Check if our target offset falls within this node
            const nodeMarkdownText = $convertToMarkdownString(TRANSFORMERS);
            const nodeIndexInMarkdown = currentMarkdown.indexOf(nodeText, currentMarkdownOffset);
            
            if (nodeIndexInMarkdown !== -1 && 
                markdownOffset >= nodeIndexInMarkdown && 
                markdownOffset < nodeIndexInMarkdown + nodeTextLength) {
                
                const parent = textNode.getParent();
                const nodeOffset = markdownOffset - nodeIndexInMarkdown;
                
                if (parent) {
                    result = {
                        nodeKey: parent.getKey(),
                        nodeOffset: nodeOffset,
                    };
                    return;
                }
            }
            
            currentMarkdownOffset += nodeTextLength;
        }
    });

    return result;
}

/**
 * Convert markdown edit to node-based edits for streaming
 * This allows us to use markdown positions from AI but still stream with Lexical UX
 */
export function convertMarkdownEditToNodeEdits(
    editor: LexicalEditor,
    markdownContent: string,
    markdownEdit: MarkdownEdit
): AIEdit[] {
    const edits: AIEdit[] = [];

    editor.getEditorState().read(() => {
        const root = $getRoot();
        const { startOffset, endOffset, newContent } = markdownEdit;
        
        // Get the text being replaced
        const textToReplace = markdownContent.slice(startOffset, endOffset);
        
        // Find all text nodes and determine which ones contain the text to replace
        const allTextNodes = root.getAllTextNodes();
        let charCount = 0;
        
        for (const textNode of allTextNodes) {
            const nodeText = textNode.getTextContent();
            const nodeStart = charCount;
            const nodeEnd = charCount + nodeText.length;
            
            // Check if this node overlaps with the edit range
            if (nodeStart < endOffset && nodeEnd > startOffset) {
                const parent = textNode.getParent();
                
                if (parent) {
                    // For simplicity, if a node overlaps with the edit, we replace the entire parent node
                    // This works well for block-level edits
                    edits.push({
                        nodeKey: parent.getKey(),
                        action: "replace",
                        newContent: newContent,
                    });
                    break; // For now, handle single node replacement
                }
            }
            
            charCount += nodeText.length;
        }
        
        // Fallback: if we couldn't map to nodes, try finding by text content
        if (edits.length === 0 && textToReplace) {
            for (const textNode of allTextNodes) {
                const nodeText = textNode.getTextContent();
                if (nodeText.includes(textToReplace)) {
                    const parent = textNode.getParent();
                    if (parent) {
                        // Replace the matching text within the node
                        const replacedText = nodeText.replace(textToReplace, newContent);
                        edits.push({
                            nodeKey: parent.getKey(),
                            action: "replace",
                            newContent: replacedText,
                        });
                        break;
                    }
                }
            }
        }
    });

    return edits;
}

/**
 * Extract current markdown from Lexical editor
 */
export function extractMarkdownFromEditor(editor: LexicalEditor): string {
    let markdown = "";
    
    editor.getEditorState().read(() => {
        markdown = $convertToMarkdownString(TRANSFORMERS);
    });
    
    return markdown;
}

