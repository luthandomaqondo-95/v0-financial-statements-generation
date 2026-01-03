/**
 * Lexical Utilities
 * Helper functions for Lexical node traversal and manipulation
 */

import { $getRoot, $createTextNode, $getSelection, $isRangeSelection, $isTextNode, $isParagraphNode, $isElementNode, LexicalEditor, LexicalNode, TextNode, RangeSelection } from "lexical";
import { $isHeadingNode } from "@lexical/rich-text";
import { $isListNode, $isListItemNode } from "@lexical/list";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { EditorContext, EditorNode, AIEdit, SelectionContext, MarkdownEditorContext, MarkdownSelection } from "@/types/ai-types";
import { sleep } from "./ai-service";
import { extractMarkdownSelection as extractMdSelection } from "./markdown-utils";

/**
 * Extract editor context including all nodes with keys
 */
export function extractEditorContext(editor: LexicalEditor, selection?: RangeSelection): EditorContext {
    let context: EditorContext = {
        nodes: [],
        fullText: "",
    };

    editor.getEditorState().read(() => {
        const root = $getRoot();
        const nodes = extractNodes(root);
        context.nodes = nodes;
        context.fullText = root.getTextContent();

        if (selection) {
            const selectedText = selection.getTextContent();
            const nodeKeys = getSelectedNodeKeys(selection);
            
            context.selection = {
                text: selectedText,
                nodeKeys,
                anchorOffset: selection.anchor.offset,
                focusOffset: selection.focus.offset,
            };
        }
    });

    return context;
}

/**
 * Recursively extract nodes from Lexical tree
 */
function extractNodes(node: LexicalNode): EditorNode[] {
    const nodes: EditorNode[] = [];
    
    // Only ElementNodes have children
    if (!$isElementNode(node)) {
        return nodes;
    }

    const children = node.getChildren();

    for (const child of children) {
        const editorNode: EditorNode = {
            key: child.getKey(),
            type: child.getType(),
            text: child.getTextContent(),
        };

        if ($isTextNode(child)) {
            editorNode.format = child.getFormat();
        }

        // Recursively extract children if this is an ElementNode
        if ($isElementNode(child)) {
            const childNodes = extractNodes(child);
            if (childNodes.length > 0) {
                editorNode.children = childNodes;
            }
        }

        nodes.push(editorNode);
    }

    return nodes;
}

/**
 * Get node keys of selected nodes
 */
function getSelectedNodeKeys(selection: RangeSelection): string[] {
    const nodes = selection.getNodes();
    const keys: string[] = [];

    for (const node of nodes) {
        // Get the parent block node if it's a text node
        if ($isTextNode(node)) {
            const parent = node.getParent();
            if (parent) {
                keys.push(parent.getKey());
            }
        } else {
            keys.push(node.getKey());
        }
    }

    // Remove duplicates
    return Array.from(new Set(keys));
}

/**
 * Find nodes by text content (fallback method)
 */
export function findNodesByContent(editor: LexicalEditor, searchText: string): string[] {
    const nodeKeys: string[] = [];

    editor.getEditorState().read(() => {
        const root = $getRoot();
        const allNodes = root.getAllTextNodes();

        for (const node of allNodes) {
            if (node.getTextContent().includes(searchText)) {
                const parent = node.getParent();
                if (parent) {
                    nodeKeys.push(parent.getKey());
                }
            }
        }
    });

    return nodeKeys;
}

/**
 * Apply an edit to a specific node
 */
export async function applyNodeEdit(
    editor: LexicalEditor,
    edit: AIEdit,
    onProgress?: (nodeKey: string, progress: number) => void
): Promise<void> {
    const { nodeKey, action, newContent, formatting } = edit;

    if (action === "replace") {
        await streamTextIntoNode(editor, nodeKey, newContent, formatting, onProgress);
    } else if (action === "insert") {
        // TODO: Implement insert logic
        console.warn("Insert action not yet implemented");
    } else if (action === "delete") {
        // TODO: Implement delete logic
        console.warn("Delete action not yet implemented");
    }
}

/**
 * Stream text into a node character by character
 */
export async function streamTextIntoNode(
    editor: LexicalEditor,
    nodeKey: string,
    newContent: string,
    formatting?: { bold?: boolean; italic?: boolean; underline?: boolean },
    onProgress?: (nodeKey: string, progress: number) => void
): Promise<void> {
    const CHARS_PER_TICK = 3; // Stream 3 characters at a time for smoother effect
    const DELAY_MS = 20;

    for (let i = 0; i <= newContent.length; i += CHARS_PER_TICK) {
        const partialContent = newContent.substring(0, Math.min(i + CHARS_PER_TICK, newContent.length));
        
        editor.update(() => {
            const node = editor.getEditorState()._nodeMap.get(nodeKey);
            
            if (node) {
                // If it's a text node, update it directly
                if ($isTextNode(node)) {
                    node.setTextContent(partialContent);
                    if (formatting) {
                        if (formatting.bold && !node.hasFormat('bold')) node.toggleFormat('bold');
                        if (formatting.italic && !node.hasFormat('italic')) node.toggleFormat('italic');
                        if (formatting.underline && !node.hasFormat('underline')) node.toggleFormat('underline');
                    }
                } 
                // If it's an ElementNode, clear children and add new text
                else if ($isElementNode(node)) {
                    const children = node.getChildren();
                    for (const child of children) {
                        child.remove();
                    }
                    
                    // Create new text node with content
                    const newTextNode = $createTextNode(partialContent);
                    if (formatting) {
                        if (formatting.bold) newTextNode.toggleFormat('bold');
                        if (formatting.italic) newTextNode.toggleFormat('italic');
                        if (formatting.underline) newTextNode.toggleFormat('underline');
                    }
                    node.append(newTextNode);
                }
            }
        });

        if (onProgress) {
            const progress = Math.min((i / newContent.length) * 100, 100);
            onProgress(nodeKey, progress);
        }

        await sleep(DELAY_MS);
    }
}

/**
 * Helper to create text node in parent (deprecated, keeping for compatibility)
 */
function createTextNodeInParent(parentNode: LexicalNode, text: string): TextNode | null {
    const textNode = $isTextNode(parentNode) ? parentNode : null;
    
    if (!textNode && $isElementNode(parentNode)) {
        // Clear children and append new text
        const children = parentNode.getChildren();
        for (const child of children) {
            child.remove();
        }
        
        // Import TextNode class
        const newTextNode = $createTextNode(text);
        parentNode.append(newTextNode);
        return newTextNode;
    }
    
    if (textNode) {
        textNode.setTextContent(text);
        return textNode;
    }
    
    return null;
}

/**
 * Highlight a node by adding a CSS class
 */
export function highlightNode(editor: LexicalEditor, nodeKey: string, className: string): void {
    const element = editor.getElementByKey(nodeKey);
    if (element) {
        element.classList.add(className);
    }
}

/**
 * Remove highlight from a node
 */
export function removeHighlight(editor: LexicalEditor, nodeKey: string, className: string): void {
    const element = editor.getElementByKey(nodeKey);
    if (element) {
        element.classList.remove(className);
    }
}

/**
 * Get selection context with node keys
 */
export function getSelectionContext(editor: LexicalEditor): SelectionContext | null {
    let context: SelectionContext | null = null;

    editor.getEditorState().read(() => {
        const selection = $getSelection();
        
        if ($isRangeSelection(selection)) {
            const text = selection.getTextContent();
            const nodeKeys = getSelectedNodeKeys(selection);
            
            context = {
                text,
                nodeKeys,
                start: selection.anchor.offset,
                end: selection.focus.offset,
            };
        }
    });

    return context;
}

/**
 * Get current markdown from Lexical editor
 */
export function extractMarkdownFromEditor(editor: LexicalEditor): string {
    let markdown = "";
    editor.getEditorState().read(() => {
        markdown = $convertToMarkdownString(TRANSFORMERS);
    });
    return markdown;
}

/**
 * Enhanced context extraction using markdown
 * This is the new markdown-based approach for AI editing
 */
export function extractMarkdownEditorContext(
    editor: LexicalEditor,
    currentMarkdown: string,
    selection?: RangeSelection
): MarkdownEditorContext {
    let context: MarkdownEditorContext = {
        fullMarkdown: currentMarkdown,
    };

    if (selection) {
        // Use the markdown-utils function to extract selection with positions
        const markdownSelection = extractMdSelection(editor, currentMarkdown);
        if (markdownSelection) {
            context.selection = markdownSelection;
        }
    }

    return context;
}

