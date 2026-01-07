import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, RangeSelection } from "lexical";
import { useEffect } from "react";

export function TextSelectionPlugin({
    onTextSelection,
}: {
    onTextSelection?: (selection: RangeSelection) => void;
}) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (!onTextSelection) return;

        const handleMouseUp = () => {
            editor.getEditorState().read(() => {
                const selection = $getSelection();

                // Check if the selection is a RangeSelection
                if ($isRangeSelection(selection)) {
                    onTextSelection(selection);
                }
            });
        };

        const rootElement = editor.getRootElement();
        if (rootElement) {
            rootElement.addEventListener('mouseup', handleMouseUp);
            return () => {
                rootElement.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [editor, onTextSelection]);

    return null;
}
