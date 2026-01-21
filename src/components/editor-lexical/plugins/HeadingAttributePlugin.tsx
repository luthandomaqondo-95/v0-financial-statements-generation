"use client"

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode } from "@lexical/rich-text";

export function HeadingAttributePlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerMutationListener(
            HeadingNode,
            (mutatedNodes) => {
                editor.getEditorState().read(() => {
                    for (const [nodeKey, mutation] of mutatedNodes) {
                        if (mutation === "created" || mutation === "updated") {
                            const dom = editor.getElementByKey(nodeKey);
                            if (dom) {
                                dom.setAttribute("data-lexical-heading-key", nodeKey);
                            }
                        }
                    }
                });
            }
        );
    }, [editor]);

    return null;
}

