import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalEditor } from "lexical";
import { useEffect } from "react";

// Internal plugin to capture editor ref and notify parent on focus
export function EditorRefPlugin({
    editorRef,
    onEditorFocus,
    pageIndex,
}: {
    editorRef: React.MutableRefObject<LexicalEditor | null>;
    onEditorFocus?: (ref: React.RefObject<LexicalEditor | null>, pageIndex: number) => void;
    pageIndex: number;
}) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        // Assign editor instance to parent ref
        editorRef.current = editor;

        // Notify parent that editor is ready and focused
        if (onEditorFocus) {
            onEditorFocus(editorRef as React.RefObject<LexicalEditor | null>, pageIndex);
        }

        // Register focus listener to update active editor when user clicks
        const handleFocus = () => {
            if (onEditorFocus) {
                onEditorFocus(editorRef as React.RefObject<LexicalEditor | null>, pageIndex);
            }
        };

        const rootElement = editor.getRootElement();
        if (rootElement) {
            rootElement.addEventListener('focus', handleFocus, true);
            return () => {
                rootElement.removeEventListener('focus', handleFocus, true);
            };
        }

        // Cleanup: clear ref when component unmounts
        return () => {
            editorRef.current = null;
        };
    }, [editor, editorRef, onEditorFocus, pageIndex]);

    return null;
}