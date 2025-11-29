"use client"

import { createContext, useContext, useState, useCallback, type ReactNode, type RefObject } from "react"
import type { MDXEditorMethods } from "@mdxeditor/editor"

interface EditorContextType {
    activeEditorRef: RefObject<MDXEditorMethods | null> | null
    setActiveEditor: (ref: RefObject<MDXEditorMethods | null> | null) => void
    activePageIndex: number | null
    setActivePageIndex: (index: number | null) => void
}

const EditorContext = createContext<EditorContextType | null>(null)

export function EditorProvider({ children }: { children: ReactNode }) {
    const [activeEditorRef, setActiveEditorRef] = useState<RefObject<MDXEditorMethods | null> | null>(null)
    const [activePageIndex, setActivePageIndex] = useState<number | null>(null)

    const setActiveEditor = useCallback((ref: RefObject<MDXEditorMethods | null> | null) => {
        setActiveEditorRef(ref)
    }, [])

    return (
        <EditorContext.Provider
            value={{
                activeEditorRef,
                setActiveEditor,
                activePageIndex,
                setActivePageIndex,
            }}
        >
            {children}
        </EditorContext.Provider>
    )
}

export function useEditorContext() {
    const context = useContext(EditorContext)
    if (!context) {
        throw new Error("useEditorContext must be used within an EditorProvider")
    }
    return context
}

