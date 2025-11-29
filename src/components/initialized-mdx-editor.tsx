"use client"

import type { ForwardedRef, CSSProperties } from "react"
import {
    MDXEditor,
    type MDXEditorMethods,
    type MDXEditorProps,
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    thematicBreakPlugin,
    markdownShortcutPlugin,
    tablePlugin,
    toolbarPlugin,
    UndoRedo,
    BoldItalicUnderlineToggles,
    BlockTypeSelect,
    ListsToggle,
    CreateLink,
    InsertTable,
    InsertThematicBreak,
    Separator,
} from "@mdxeditor/editor"
import { cn } from "@/lib/utils"

// Only import this to the next file
export default function InitializedMDXEditor({
    editorRef,
    containerClassName,
    contentEditableClassName,
    style,
    ...props
}: {
    editorRef: ForwardedRef<MDXEditorMethods> | null
    containerClassName?: string
    contentEditableClassName?: string
    style?: CSSProperties
} & MDXEditorProps) {
    return (
        <div
            className={cn(
                "mdx-editor-wrapper h-full border rounded-md",
                // Force light mode styling for the editor container
                "bg-white",
                containerClassName,
            )}
            style={style}
        >
            <MDXEditor
                plugins={[
                    headingsPlugin(),
                    listsPlugin(),
                    quotePlugin(),
                    thematicBreakPlugin(),
                    markdownShortcutPlugin(),
                    tablePlugin(),
                    toolbarPlugin({
                        toolbarContents: () => (
                            <>
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
                                <InsertThematicBreak />{" "}
                            </>
                        ),
                    }),
                ]}
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
