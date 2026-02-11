"use client"

import dynamic from "next/dynamic"
import { forwardRef, CSSProperties } from "react"
import type { MDXEditorMethods, MDXEditorProps } from "@mdxeditor/editor"
import "@mdxeditor/editor/style.css"

export interface EditorProps extends MDXEditorProps {
    containerClassName?: string
    contentEditableClassName?: string
    style?: CSSProperties
    hideToolbar?: boolean
    onTextSelection?: (selection: any) => void
    onBlockTypeChange?: (blockType: string) => void
}

// This is the only place InitializedMDXEditor is imported directly.
const Editor = dynamic(() => import("./initialized-mdx-editor"), {
    // Make sure we turn SSR off
    ssr: false,
})

// This is what is imported by other components. Pre-initialized with plugins, and ready
// to accept other props, including a ref.
const ForwardRefEditor = forwardRef<MDXEditorMethods, EditorProps>((props, ref) => (
    <Editor {...props} editorRef={ref} />
))

// TS complains without the following line
ForwardRefEditor.displayName = "ForwardRefEditor"

export default ForwardRefEditor
