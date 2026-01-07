/**
 * useAIEdit Hook
 * Core hook for managing AI edit flow with streaming effects
 */

import { useState, useCallback } from "react";
import { LexicalEditor, RangeSelection } from "lexical";
import type { MDXEditorMethods } from "@mdxeditor/editor";
import { generateAIEdits, generateMarkdownAIEdits, sleep } from "@/lib/ai-service";
import { extractEditorContext, applyNodeEdit, highlightNode, removeHighlight, extractMarkdownEditorContext } from "@/lib/lexical-utils";
import { convertMarkdownEditToNodeEdits } from "@/lib/markdown-utils";
import { AIEditState, SelectionContext, MarkdownEditorContext, MarkdownSelection } from "@/types/ai-types";
import { toast } from "sonner";

export function useAIEdit() {
    const [aiEditState, setAIEditState] = useState<AIEditState>({
        isStreaming: false,
        highlightedNodes: [],
        currentEditNode: null,
        streamingText: "",
    });

    /**
     * Execute AI edit with streaming effects (NEW: markdown-based)
     */
    const executeAIEdit = useCallback(async (
        instruction: string,
        editor: LexicalEditor | null,
        currentMarkdown: string,
        markdownSelection?: MarkdownSelection
    ): Promise<boolean> => {
        if (!editor) {
            toast.error("No active editor found");
            return false;
        }

        if (!instruction.trim()) {
            toast.error("Please provide an instruction");
            return false;
        }

        setAIEditState(prev => ({ ...prev, isStreaming: true }));

        try {
            console.log("🎭 AI Demo Mode: currentMarkdown", currentMarkdown);
            console.log("🎭 AI Demo Mode: markdownSelection", markdownSelection);
            
            // 1. Build markdown-based context directly
            const context: MarkdownEditorContext = {
                fullMarkdown: currentMarkdown,
                selection: markdownSelection,
            };
            
            // Call AI service
            toast.info("AI is analyzing your request...");
            const response = await generateMarkdownAIEdits(instruction, context);
            console.log("🎭 AI Markdown Response:", response);

            if (!response.edits || response.edits.length === 0) {
                toast.info("No changes needed");
                setAIEditState(prev => ({ ...prev, isStreaming: false }));
                return false;
            }

            // 2. Convert markdown edits to node edits for streaming
            const nodeEdits = [];
            for (const markdownEdit of response.edits) {
                const converted = convertMarkdownEditToNodeEdits(
                    editor,
                    currentMarkdown,
                    markdownEdit
                );
                nodeEdits.push(...converted);
            }

            if (nodeEdits.length === 0) {
                toast.warning("Could not map edits to editor nodes");
                setAIEditState(prev => ({ ...prev, isStreaming: false }));
                return false;
            }

            // 3. Phase 1: Highlight nodes that will be edited (Canvas-style)
            const nodeKeysToEdit = nodeEdits.map(e => e.nodeKey);
            setAIEditState(prev => ({
                ...prev,
                highlightedNodes: nodeKeysToEdit,
            }));

            // Apply highlights
            for (const nodeKey of nodeKeysToEdit) {
                highlightNode(editor, nodeKey, "ai-highlight-pending");
            }

            // Wait for highlight phase
            await sleep(500);

            // 4. Phase 2: Stream edits one by one (Cursor-style)
            for (const edit of nodeEdits) {
                setAIEditState(prev => ({
                    ...prev,
                    currentEditNode: edit.nodeKey,
                }));

                // Remove pending highlight and add active highlight
                removeHighlight(editor, edit.nodeKey, "ai-highlight-pending");
                highlightNode(editor, edit.nodeKey, "ai-editing-active");

                // Stream the edit
                await applyNodeEdit(editor, edit, (nodeKey, progress) => {
                    setAIEditState(prev => ({
                        ...prev,
                        streamingText: edit.newContent.substring(0, Math.floor((progress / 100) * edit.newContent.length)),
                    }));
                });

                // Remove active highlight
                removeHighlight(editor, edit.nodeKey, "ai-editing-active");
                
                // Brief pause between edits
                await sleep(200);
            }

            // Cleanup
            setAIEditState({
                isStreaming: false,
                highlightedNodes: [],
                currentEditNode: null,
                streamingText: "",
            });

            toast.success(response.explanation || "Edits applied successfully");
            return true;

        } catch (error) {
            console.error("AI edit failed:", error);
            
            let errorMessage = "AI edit failed";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            
            toast.error(errorMessage);
            
            // Cleanup on error
            setAIEditState({
                isStreaming: false,
                highlightedNodes: [],
                currentEditNode: null,
                streamingText: "",
            });
            
            return false;
        }
    }, []);

    /**
     * Execute AI edit for MDX editors (markdown-based)
     */
    const executeMarkdownAIEdit = useCallback(async (
        instruction: string,
        editor: MDXEditorMethods | null,
        currentMarkdown: string,
        markdownSelection?: MarkdownSelection
    ): Promise<boolean> => {
        if (!editor) {
            toast.error("No active editor found");
            return false;
        }

        if (!instruction.trim()) {
            toast.error("Please provide an instruction");
            return false;
        }

        setAIEditState(prev => ({ ...prev, isStreaming: true }));

        try {
            console.log("🎭 AI Markdown Demo Mode: currentMarkdown", currentMarkdown);
            console.log("🎭 AI Markdown Demo Mode: markdownSelection", markdownSelection);

            // 1. Build markdown-based context directly
            const context: MarkdownEditorContext = {
                fullMarkdown: currentMarkdown,
                selection: markdownSelection,
            };

            // Call AI service
            toast.info("AI is analyzing your request...");
            const response = await generateMarkdownAIEdits(instruction, context);
            console.log("🎭 AI Markdown Response:", response);

            if (!response.edits || response.edits.length === 0) {
                toast.info("No changes needed");
                setAIEditState(prev => ({ ...prev, isStreaming: false }));
                return false;
            }

            // 2. Apply edits directly to markdown (MDX editor approach)
            let updatedMarkdown = currentMarkdown;

            // Sort edits by startOffset in reverse order to avoid offset shifting
            const sortedEdits = response.edits.sort((a, b) => b.startOffset - a.startOffset);

            for (const edit of sortedEdits) {
                // Apply each edit to the markdown string
                updatedMarkdown =
                    updatedMarkdown.substring(0, edit.startOffset) +
                    edit.newContent +
                    updatedMarkdown.substring(edit.endOffset);
            }

            // 3. Update the editor with the new markdown
            editor.setMarkdown(updatedMarkdown);

            // Cleanup
            setAIEditState({
                isStreaming: false,
                highlightedNodes: [],
                currentEditNode: null,
                streamingText: "",
            });

            toast.success(response.explanation || "Edits applied successfully");
            return true;

        } catch (error) {
            console.error("Markdown AI edit failed:", error);

            let errorMessage = "AI edit failed";
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);

            // Cleanup on error
            setAIEditState({
                isStreaming: false,
                highlightedNodes: [],
                currentEditNode: null,
                streamingText: "",
            });

            return false;
        }
    }, []);

    /**
     * Cancel ongoing AI edit
     */
    const cancelAIEdit = useCallback(() => {
        setAIEditState({
            isStreaming: false,
            highlightedNodes: [],
            currentEditNode: null,
            streamingText: "",
        });
    }, []);

    return {
        aiEditState,
        executeAIEdit,
        executeMarkdownAIEdit,
        cancelAIEdit,
    };
}

