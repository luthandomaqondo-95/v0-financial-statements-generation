"use client"

import { createContext, useContext, useState, useCallback, type ReactNode, type RefObject } from "react";
import type { LexicalEditor } from "lexical";
import { PageData } from "@/types/afs-types";

interface PageHistoryEntry {
    pages: PageData[];
    hasTableOfContents: boolean;
}

interface EditorContextType {
    activeEditorRef: RefObject<LexicalEditor | null> | null;
    setActiveEditor: (ref: RefObject<LexicalEditor | null> | null) => void;
    activePageIndex: number | null;
    setActivePageIndex: (index: number | null) => void;
    // Page-level history
    pushHistory: (pages: PageData[], hasTableOfContents: boolean) => void;
    undo: () => PageHistoryEntry | null;
    redo: () => PageHistoryEntry | null;
    canUndo: boolean;
    canRedo: boolean;
    clearHistory: () => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

const MAX_HISTORY = 50;

export function LexicalEditorProvider({ children }: { children: ReactNode }) {
    const [activeEditorRef, setActiveEditorRef] = useState<RefObject<LexicalEditor | null> | null>(null);
    const [activePageIndex, setActivePageIndex] = useState<number | null>(null);
    
    // Page-level history management
    const [history, setHistory] = useState<PageHistoryEntry[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const setActiveEditor = useCallback((ref: RefObject<LexicalEditor | null> | null) => {
        setActiveEditorRef(ref);
    }, []);

    const pushHistory = useCallback((pages: PageData[], hasTableOfContents: boolean) => {
        setHistory((prev) => {
            // Remove any redo history when a new action is performed
            const newHistory = prev.slice(0, historyIndex + 1);
            // Deep clone the pages to prevent mutations
            const entry: PageHistoryEntry = {
                pages: JSON.parse(JSON.stringify(pages)),
                hasTableOfContents,
            };
            const updatedHistory = [...newHistory, entry];
            // Keep only the last MAX_HISTORY entries
            return updatedHistory.slice(-MAX_HISTORY);
        });
        setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
    }, [historyIndex]);

    const undo = useCallback((): PageHistoryEntry | null => {
        if (historyIndex <= 0) return null;
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        return history[newIndex];
    }, [history, historyIndex]);

    const redo = useCallback((): PageHistoryEntry | null => {
        if (historyIndex >= history.length - 1) return null;
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        return history[newIndex];
    }, [history, historyIndex]);

    const clearHistory = useCallback(() => {
        setHistory([]);
        setHistoryIndex(-1);
    }, []);

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    return (
        <EditorContext.Provider
            value={{
                activeEditorRef,
                setActiveEditor,
                activePageIndex,
                setActivePageIndex,
                pushHistory,
                undo,
                redo,
                canUndo,
                canRedo,
                clearHistory,
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

