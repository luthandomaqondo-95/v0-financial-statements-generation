"use client"

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { $isHeadingNode, HeadingNode } from "@lexical/rich-text";
import { $isTableOfContentsNode, TableOfContentsNode } from "../nodes/TableOfContentsNode";

export function TableOfContentsPlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        // Function to extract all headings from the editor
        const extractHeadings = (): Array<{ key: string; text: string; level: number }> => {
            const headings: Array<{ key: string; text: string; level: number }> = [];

            const root = $getRoot();
            const children = root.getChildren();

            children.forEach((node) => {
                if ($isHeadingNode(node)) {
                    const headingNode = node as HeadingNode;
                    const text = headingNode.getTextContent();
                    const tag = headingNode.getTag();
                    const level = parseInt(tag.replace("h", ""), 10);

                    headings.push({
                        key: headingNode.getKey(),
                        text,
                        level,
                    });
                }
            });

            return headings;
        };

        // Function to update all TOC nodes
        const updateTableOfContents = () => {
            editor.update(() => {
                const headings = extractHeadings();
                const root = $getRoot();
                const children = root.getChildren();

                children.forEach((node) => {
                    if ($isTableOfContentsNode(node)) {
                        const tocNode = node as TableOfContentsNode;
                        tocNode.setHeadings(headings);
                    }
                });
            });
        };

        // Register listener for editor changes
        const unregister = editor.registerUpdateListener(() => {
            editor.getEditorState().read(() => {
                updateTableOfContents();
            });
        });

        // Initial update
        updateTableOfContents();

        return () => {
            unregister();
        };
    }, [editor]);

    return null;
}

