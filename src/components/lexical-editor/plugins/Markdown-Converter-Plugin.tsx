"use client"

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useRef } from "react";
import { $convertToMarkdownString, $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";

interface MarkdownConverterPluginProps {
    onMarkdownChange?: (markdown: string) => void;
    initialMarkdown?: string;
}

export function MarkdownConverterPlugin({ onMarkdownChange, initialMarkdown }: MarkdownConverterPluginProps) {
    const [editor] = useLexicalComposerContext();
    const isInitialized = useRef(false);

    // Convert editor content to markdown on every change
    useEffect(() => {
        if (!onMarkdownChange) return;

        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                const markdown = $convertToMarkdownString(TRANSFORMERS);
                onMarkdownChange(markdown);
            });
        });
    }, [editor, onMarkdownChange]);

    // Load initial markdown content ONCE on mount
    useEffect(() => {
        if (!initialMarkdown || isInitialized.current) return;

        editor.update(() => {
            $convertFromMarkdownString(initialMarkdown, TRANSFORMERS);
        });
        
        isInitialized.current = true;
    }, [editor, initialMarkdown]);

    return null;
}

