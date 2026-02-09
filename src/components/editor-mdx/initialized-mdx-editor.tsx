"use client"

import { useRef, useEffect, useCallback } from "react"
import type { ForwardedRef, CSSProperties } from "react"
import { MDXEditor, type MDXEditorMethods, type MDXEditorProps, headingsPlugin, listsPlugin, quotePlugin, thematicBreakPlugin, markdownShortcutPlugin, tablePlugin, toolbarPlugin, UndoRedo, BoldItalicUnderlineToggles, BlockTypeSelect, ListsToggle, CreateLink, InsertTable, InsertThematicBreak, Separator } from "@mdxeditor/editor"
import { cn } from "@/lib/utils"

// AFS markdown snippet templates
const AFS_FINANCIAL_TABLE = `\n| Description | Note | 2024 ($) | 2023 ($) |\n|-------------|------|----------|----------|\n| Item | | 0 | 0 |\n| **Total** | | **0** | **0** |\n`
const AFS_NOTE_TEMPLATE = `\n### N. Note Title\n\n| | 2024 ($) | 2023 ($) |\n|---|----------|----------|\n| Item | 0 | 0 |\n| **Total** | **0** | **0** |\n`
const AFS_STATEMENT_HEADER = `\n## Statement of ...\n*For the year ended December 31, 2024*\n\n`
const AFS_PAGE_BREAK = `\n\n---\n\n`

// Module-scope plugin array -- created once, shared across all instances.
// This prevents re-creating plugin objects on every render.
const BASE_PLUGINS = [
    headingsPlugin(),
    listsPlugin(),
    quotePlugin(),
    thematicBreakPlugin(),
    markdownShortcutPlugin(),
    tablePlugin(),
]

// Toolbar plugins (only used when hideToolbar is false)
const TOOLBAR_PLUGINS = [
    ...BASE_PLUGINS,
    toolbarPlugin({
        toolbarContents: () => (
            <>
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
                <InsertThematicBreak />
            </>
        ),
    }),
]

// Only import this to the next file
export default function InitializedMDXEditor({
    editorRef,
    containerClassName,
    contentEditableClassName,
    style,
    hideToolbar = false,
    onTextSelection,
    onBlockTypeChange,
    ...props
}: {
    editorRef: ForwardedRef<MDXEditorMethods> | null
    containerClassName?: string
    contentEditableClassName?: string
    style?: CSSProperties
    hideToolbar?: boolean
    onTextSelection?: (selection: any) => void
    onBlockTypeChange?: (blockType: string) => void
} & MDXEditorProps) {
    const wrapperRef = useRef<HTMLDivElement>(null)
    // Resolve the forwarded ref to get the actual MDXEditorMethods instance
    const internalRef = useRef<MDXEditorMethods>(null)

    // Use stable module-scope plugins -- no useMemo needed
    const plugins = hideToolbar ? BASE_PLUGINS : TOOLBAR_PLUGINS

    /**
     * AFS keyboard shortcuts:
     *   Ctrl+Shift+T -- insert financial table template
     *   Ctrl+Shift+N -- insert note template
     *   Ctrl+Shift+B -- insert page break (horizontal rule)
     *   Ctrl+Shift+S -- insert statement section header
     */
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!e.ctrlKey || !e.shiftKey) return
        if (!internalRef.current) return

        const editor = internalRef.current
        let handled = false

        switch (e.key.toUpperCase()) {
            case "T":
                editor.insertMarkdown(AFS_FINANCIAL_TABLE)
                handled = true
                break
            case "N":
                editor.insertMarkdown(AFS_NOTE_TEMPLATE)
                handled = true
                break
            case "B":
                editor.insertMarkdown(AFS_PAGE_BREAK)
                handled = true
                break
            case "S":
                editor.insertMarkdown(AFS_STATEMENT_HEADER)
                handled = true
                break
        }

        if (handled) {
            e.preventDefault()
            e.stopPropagation()
        }
    }, [])

    // Attach keyboard shortcut listener to the wrapper
    useEffect(() => {
        const el = wrapperRef.current
        if (!el) return
        el.addEventListener("keydown", handleKeyDown)
        return () => el.removeEventListener("keydown", handleKeyDown)
    }, [handleKeyDown])

    // Track selection changes to detect current block type
    useEffect(() => {
        const el = wrapperRef.current
        if (!el || !onBlockTypeChange) return

        const handleSelectionChange = () => {
            const selection = window.getSelection()
            if (!selection || selection.rangeCount === 0) return

            try {
                const range = selection.getRangeAt(0)
                let node: Node | null = range.startContainer

                // Walk up to find the block-level element
                while (node && node.nodeType !== Node.ELEMENT_NODE) {
                    node = node.parentNode
                }

                if (!node) return

                // Check if we're inside the editor
                if (!el.contains(node as Node)) return

                // Detect block type
                let currentBlockType = "paragraph"
                let element = node as Element

                // Walk up to find the block type
                while (element && el.contains(element)) {
                    const tagName = element.tagName?.toLowerCase()
                    if (tagName === "h1") {
                        currentBlockType = "heading1"
                        break
                    } else if (tagName === "h2") {
                        currentBlockType = "heading2"
                        break
                    } else if (tagName === "h3") {
                        currentBlockType = "heading3"
                        break
                    } else if (tagName === "h4") {
                        currentBlockType = "heading4"
                        break
                    } else if (tagName === "h5") {
                        currentBlockType = "heading5"
                        break
                    } else if (tagName === "h6") {
                        currentBlockType = "heading6"
                        break
                    } else if (tagName === "blockquote") {
                        currentBlockType = "quote"
                        break
                    } else if (tagName === "ul" || tagName === "ol" || tagName === "li") {
                        currentBlockType = tagName === "ol" ? "orderedList" : "unorderedList"
                        break
                    }
                    element = element.parentElement as Element
                }

                onBlockTypeChange(currentBlockType)
            } catch (error) {
                // Silently handle errors
                console.error("Error detecting block type:", error)
            }
        }

        // Listen to various events that might change selection
        document.addEventListener("selectionchange", handleSelectionChange)
        el.addEventListener("click", handleSelectionChange)
        el.addEventListener("keyup", handleSelectionChange)

        return () => {
            document.removeEventListener("selectionchange", handleSelectionChange)
            el.removeEventListener("click", handleSelectionChange)
            el.removeEventListener("keyup", handleSelectionChange)
        }
    }, [onBlockTypeChange])

    // Sync forwarded ref and internal ref
    const setRefs = useCallback((instance: MDXEditorMethods | null) => {
        internalRef.current = instance
        if (typeof editorRef === "function") {
            editorRef(instance)
        } else if (editorRef && typeof editorRef === "object") {
            (editorRef as React.MutableRefObject<MDXEditorMethods | null>).current = instance
        }
    }, [editorRef])

    return (
        <div
            ref={wrapperRef}
            className={cn(
                "mdx-editor-wrapper h-full border rounded-md",
                "bg-white",
                hideToolbar && "mdx-editor-no-toolbar",
                containerClassName,
            )}
            style={style}
        >
            <MDXEditor
                plugins={plugins}
                {...props}
                ref={setRefs}
                className="h-full"
                contentEditableClassName={cn(
                    "prose max-w-none min-h-full outline-none",
                    "text-gray-900 bg-white",
                    contentEditableClassName,
                )}
            />
        </div>
    )
}
