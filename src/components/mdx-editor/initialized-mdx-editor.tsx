"use client"

import type { ForwardedRef, CSSProperties } from "react"
import { useMemo } from "react"
import { MDXEditor, type MDXEditorMethods, type MDXEditorProps, headingsPlugin, listsPlugin, quotePlugin, thematicBreakPlugin, markdownShortcutPlugin, tablePlugin, toolbarPlugin, UndoRedo, BoldItalicUnderlineToggles, BlockTypeSelect, ListsToggle, CreateLink, InsertTable, InsertThematicBreak, Separator, InsertImage, InsertCodeBlock, DiffSourceToggleWrapper, diffSourcePlugin } from "@mdxeditor/editor"
import { cn } from "@/lib/utils"

// Only import this to the next file
export default function InitializedMDXEditor({
    editorRef,
    containerClassName,
    contentEditableClassName,
    style,
    hideToolbar = false,
    ...props
}: {
    editorRef: ForwardedRef<MDXEditorMethods> | null
    containerClassName?: string
    contentEditableClassName?: string
    style?: CSSProperties
    hideToolbar?: boolean
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
