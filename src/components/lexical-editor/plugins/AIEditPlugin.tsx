/**
 * AI Edit Plugin
 * Lexical plugin for AI editing with visual effects
 */

"use client"

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditorContext } from "../editor-context";

export function AIEditPlugin() {
    const [editor] = useLexicalComposerContext();
    const { aiEditState } = useLexicalEditorContext();

    useEffect(() => {
        if (!aiEditState) return;

        const { highlightedNodes, currentEditNode } = aiEditState;

        // Apply highlight classes to DOM elements
        highlightedNodes.forEach(nodeKey => {
            const element = editor.getElementByKey(nodeKey);
            if (element && nodeKey !== currentEditNode) {
                element.classList.add("ai-highlight-pending");
            }
        });

        // Apply active editing class to current node
        if (currentEditNode) {
            const element = editor.getElementByKey(currentEditNode);
            if (element) {
                element.classList.remove("ai-highlight-pending");
                element.classList.add("ai-editing-active");
            }
        }

        // Cleanup function
        return () => {
            highlightedNodes.forEach(nodeKey => {
                const element = editor.getElementByKey(nodeKey);
                if (element) {
                    element.classList.remove("ai-highlight-pending");
                    element.classList.remove("ai-editing-active");
                }
            });
        };
    }, [editor, aiEditState]);

    return null;
}

