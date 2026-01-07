"use client"

import { useMemo, useEffect } from "react"
import type { ForwardedRef, CSSProperties } from "react"
import { MDXEditor, type MDXEditorMethods, type MDXEditorProps, headingsPlugin, listsPlugin, quotePlugin, thematicBreakPlugin, markdownShortcutPlugin, tablePlugin, toolbarPlugin, UndoRedo, BoldItalicUnderlineToggles, BlockTypeSelect, ListsToggle, CreateLink, InsertTable, InsertThematicBreak, Separator, InsertImage, InsertCodeBlock, DiffSourceToggleWrapper, diffSourcePlugin } from "@mdxeditor/editor"
import { cn } from "@/lib/utils"

// Only import this to the next file
export default function InitializedMDXEditor({
    editorRef,
    containerClassName,
    contentEditableClassName,
    style,
    hideToolbar = false,
    onTextSelection,
    ...props
}: {
    editorRef: ForwardedRef<MDXEditorMethods> | null
    containerClassName?: string
    contentEditableClassName?: string
    style?: CSSProperties
    hideToolbar?: boolean
    onTextSelection?: (selection: any) => void
} & MDXEditorProps) {
    const plugins = useMemo(() => {
        const basePlugins = [
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            thematicBreakPlugin(),
            markdownShortcutPlugin(),
            tablePlugin(),
        ]


        // Only add toolbar plugin if not hidden
        if (!hideToolbar) {
            basePlugins.push(
                diffSourcePlugin({ diffMarkdown: 'An older version', viewMode: 'rich-text', readOnlyDiff: true }),
            )
            basePlugins.push(
                toolbarPlugin({
                    toolbarContents: () => (
                        <DiffSourceToggleWrapper>
                            {" "}
                            <UndoRedo />
                            <Separator />
                            <BlockTypeSelect />
                            <Separator />
                            <BoldItalicUnderlineToggles />
                            <Separator />
                            <ListsToggle />
                            <Separator />
                            <CreateLink />
                            <InsertTable />
                            <InsertImage />
                            <InsertCodeBlock />
                            <InsertThematicBreak />{" "}
                        </DiffSourceToggleWrapper>
                    ),
                }),
            )
        }

        return basePlugins
    }, [hideToolbar])

    // Handle text selection
    useEffect(() => {
        if (!onTextSelection) return

        const handleSelection = () => {
            const selection = window.getSelection()
            if (selection && selection.toString().trim()) {
                // Check if the selection is within our editor
                const editorElement = document.querySelector('[contenteditable="true"]')
                if (editorElement && editorElement.contains(selection.anchorNode)) {
                    // Create a simple selection object that matches the expected interface
                    const mockSelection = {
                        getTextContent: () => selection.toString(),
                        anchor: { offset: selection.anchorOffset },
                        focus: { offset: selection.focusOffset },
                    }

                    onTextSelection(mockSelection)
                }
            }
        }

        const handleMouseUp = () => {
            // Small delay to ensure selection is updated
            setTimeout(handleSelection, 10)
        }

        const editorElement = document.querySelector('[contenteditable="true"]')
        if (editorElement) {
            editorElement.addEventListener('mouseup', handleMouseUp)
            // Also listen for selection changes
            document.addEventListener('selectionchange', handleSelection)

            return () => {
                editorElement.removeEventListener('mouseup', handleMouseUp)
                document.removeEventListener('selectionchange', handleSelection)
            }
        }
    }, [onTextSelection])

    return (
        <div
            className={cn(
                "mdx-editor-wrapper h-full border rounded-md",
                // Force light mode styling for the editor container
                "bg-white",
                hideToolbar && "mdx-editor-no-toolbar",
                containerClassName,
            )}
            style={style}
        >
            <MDXEditor
                plugins={plugins}
                {...props}
                ref={editorRef}
                className="h-full"
                contentEditableClassName={cn(
                    "prose max-w-none min-h-full outline-none",
                    // Force light mode text colors
                    "text-gray-900 bg-white",
                    contentEditableClassName,
                )}
            />
        </div>
    )
}
