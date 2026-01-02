"use client"

import { createContext, useContext, useState, useCallback, type ReactNode, type RefObject } from "react";
import type { LexicalEditor } from "lexical";

interface EditorContextType {
    activeEditorRef: RefObject<LexicalEditor | null> | null;
    setActiveEditor: (ref: RefObject<LexicalEditor | null> | null) => void;
    activePageIndex: number | null;
    setActivePageIndex: (index: number | null) => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

export function LexicalEditorProvider({ children }: { children: ReactNode }) {
    const [activeEditorRef, setActiveEditorRef] = useState<RefObject<LexicalEditor | null> | null>(null);
    const [activePageIndex, setActivePageIndex] = useState<number | null>(null);

    const setActiveEditor = useCallback((ref: RefObject<LexicalEditor | null> | null) => {
        setActiveEditorRef(ref);
    }, []);

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
    );
}

export function useLexicalEditorContext() {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error("useLexicalEditorContext must be used within a LexicalEditorProvider");
    }
    return context;
}

