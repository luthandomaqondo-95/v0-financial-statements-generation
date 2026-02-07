"use client"

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Save, FileText, ChevronLeft, Check, Loader, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TiptapEditorProvider, useTiptapEditorContext, TiptapPageEditor, StickyTiptapToolbar } from "@/components/editor-tiptap";
import { PageData, PageSettings } from "@/types/afs-types";
import { generateId, processPageOverflows } from "@/lib/utils/afs-utils";
import type { Editor } from "@tiptap/react";

const DEFAULT_PAGE_SETTINGS: PageSettings = {
    orientation: "portrait",
    margins: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
    },
};

const INITIAL_CONTENT = `<h1>Welcome to TipTap Editor</h1>
<p>This is a <strong>page-based</strong> document editor built with TipTap.</p>
<h2>Features</h2>
<ul>
    <li>Rich text formatting (bold, italic, underline, etc.)</li>
    <li>Headings and paragraphs</li>
    <li>Lists (bullet, numbered, task)</li>
    <li>Tables with resizable columns</li>
    <li>Links and images</li>
    <li>Text alignment</li>
    <li>Code blocks</li>
</ul>
<h2>Page Management</h2>
<p>Each page simulates an A4 document with automatic overflow detection. When content exceeds the page boundaries, you can split it to the next page.</p>
<blockquote>
    <p>Try typing more content to see the overflow detection in action!</p>
</blockquote>`;

function TiptapEditorContent() {
    const router = useRouter();
    const { setActiveEditor, setActivePageIndex, pushHistory, undo, redo, canUndo, canRedo } = useTiptapEditorContext();

    const [projectName, setProjectName] = useState("Untitled Document");
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [pages, setPages] = useState<PageData[]>([
        {
            id: generateId(),
            content: INITIAL_CONTENT,
            settings: { ...DEFAULT_PAGE_SETTINGS },
        },
    ]);

    const isSavingRef = useRef(false);

    // Handle editor focus
    const handleEditorFocus = useCallback((ref: React.RefObject<Editor | null>, pageIndex: number) => {
        setActiveEditor(ref);
        setActivePageIndex(pageIndex);
    }, [setActiveEditor, setActivePageIndex]);

    // Handle page content change
    const handlePageChange = useCallback((pageIndex: number, newContent: string) => {
        setPages((prevPages) => {
            const updatedPages = [...prevPages];
            updatedPages[pageIndex] = {
                ...updatedPages[pageIndex],
                content: newContent,
            };
            return updatedPages;
        });
        setHasUnsavedChanges(true);
    }, []);

    // Handle page settings change
    const handlePageSettingsChange = useCallback((pageIndex: number, newSettings: PageSettings) => {
        setPages((prevPages) => {
            const updatedPages = [...prevPages];
            updatedPages[pageIndex] = {
                ...updatedPages[pageIndex],
                settings: newSettings,
            };
            return updatedPages;
        });
        setHasUnsavedChanges(true);
    }, []);

    // Handle add page
    const handleAddPage = useCallback((afterIndex: number) => {
        const newPage: PageData = {
            id: generateId(),
            content: "<p>New page content...</p>",
            settings: { ...DEFAULT_PAGE_SETTINGS },
        };

        setPages((prevPages) => {
            const updatedPages = [...prevPages];
            updatedPages.splice(afterIndex + 1, 0, newPage);
            return updatedPages;
        });
        setHasUnsavedChanges(true);
        toast.success("Page added");
    }, []);

    // Handle delete page
    const handleDeletePage = useCallback((pageIndex: number) => {
        if (pages.length <= 1) {
            toast.error("Cannot delete the only page");
            return;
        }

        setPages((prevPages) => {
            const updatedPages = [...prevPages];
            updatedPages.splice(pageIndex, 1);
            return updatedPages;
        });
        setHasUnsavedChanges(true);
        toast.success("Page deleted");
    }, [pages.length]);

    // Handle move page up
    const handleMoveUp = useCallback((pageIndex: number) => {
        if (pageIndex <= 0) return;

        setPages((prevPages) => {
            const updatedPages = [...prevPages];
            [updatedPages[pageIndex - 1], updatedPages[pageIndex]] = [updatedPages[pageIndex], updatedPages[pageIndex - 1]];
            return updatedPages;
        });
        setHasUnsavedChanges(true);
    }, []);

    // Handle move page down
    const handleMoveDown = useCallback((pageIndex: number) => {
        if (pageIndex >= pages.length - 1) return;

        setPages((prevPages) => {
            const updatedPages = [...prevPages];
            [updatedPages[pageIndex], updatedPages[pageIndex + 1]] = [updatedPages[pageIndex + 1], updatedPages[pageIndex]];
            return updatedPages;
        });
        setHasUnsavedChanges(true);
    }, [pages.length]);

    // Handle split overflow
    const handleSplitOverflow = useCallback((pageIndex: number, currentContent: string, overflowContent: string) => {
        setPages((prevPages) => {
            const updatedPages = [...prevPages];
            
            // Update current page with kept content
            updatedPages[pageIndex] = {
                ...updatedPages[pageIndex],
                content: `<p>${currentContent.replace(/\n/g, "</p><p>")}</p>`,
            };

            // Create new page with overflow content
            const newPage: PageData = {
                id: generateId(),
                content: `<p>${overflowContent.replace(/\n/g, "</p><p>")}</p>`,
                settings: { ...updatedPages[pageIndex].settings },
            };

            updatedPages.splice(pageIndex + 1, 0, newPage);
            return updatedPages;
        });
        setHasUnsavedChanges(true);
        toast.success("Content split to new page");
    }, []);

    // Handle manual save
    const handleSave = useCallback(async () => {
        if (isSavingRef.current) return;

        setIsSaving(true);
        isSavingRef.current = true;

        try {
            // Simulate save operation
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Save to localStorage as placeholder
            localStorage.setItem("tiptap-document", JSON.stringify({
                name: projectName,
                pages: pages,
                savedAt: new Date().toISOString(),
            }));

            setLastSaved(new Date());
            setHasUnsavedChanges(false);
            toast.success("Document saved");
        } catch (error) {
            console.error("Save failed:", error);
            toast.error("Failed to save document");
        } finally {
            setIsSaving(false);
            isSavingRef.current = false;
        }
    }, [projectName, pages]);

    // Handle page-level undo
    const handlePageUndo = useCallback(() => {
        const historyEntry = undo();
        if (historyEntry) {
            setPages(historyEntry.pages);
        }
    }, [undo]);

    // Handle page-level redo
    const handlePageRedo = useCallback(() => {
        const historyEntry = redo();
        if (historyEntry) {
            setPages(historyEntry.pages);
        }
    }, [redo]);

    // Push to history when pages change significantly (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (pages.length > 0) {
                pushHistory(pages, false);
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, [pages, pushHistory]);

    // Auto-save effect
    useEffect(() => {
        if (hasUnsavedChanges) {
            const timer = setTimeout(() => {
                handleSave();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [hasUnsavedChanges, handleSave]);

    // Load saved document on mount
    useEffect(() => {
        try {
            const savedData = localStorage.getItem("tiptap-document");
            if (savedData) {
                const parsed = JSON.parse(savedData);
                if (parsed.pages && parsed.pages.length > 0) {
                    setPages(parsed.pages);
                    setProjectName(parsed.name || "Untitled Document");
                    setLastSaved(new Date(parsed.savedAt));
                }
            }
        } catch (error) {
            console.error("Failed to load saved document:", error);
        }
    }, []);

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="flex h-14 items-center gap-4 border-b bg-background px-4 shrink-0">
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.back()}>
                    <ChevronLeft className="h-4 w-4" />
                    Back
                </Button>
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <input
                        type="text"
                        value={projectName}
                        onChange={(e) => {
                            setProjectName(e.target.value);
                            setHasUnsavedChanges(true);
                        }}
                        className="text-lg font-medium bg-transparent border-none outline-none focus:outline-none px-2 py-1 rounded hover:bg-muted/50 focus:bg-muted/50"
                        placeholder="Untitled Document"
                    />
                </div>

                {/* Save status */}
                <div className="flex items-center gap-2 ml-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 cursor-pointer"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save
                    </Button>
                    {isSaving ? (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Loader className="h-4 w-4 animate-spin" />
                            <span>Saving...</span>
                        </div>
                    ) : hasUnsavedChanges ? (
                        <div className="flex items-center gap-2 text-amber-500 text-sm">
                            <div className="h-2 w-2 rounded-full bg-amber-500" />
                            <span>Unsaved changes</span>
                        </div>
                    ) : lastSaved ? (
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                            <Check className="h-4 w-4" />
                            <span>Saved {lastSaved.toLocaleTimeString()}</span>
                        </div>
                    ) : null}
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        {pages.length} page{pages.length !== 1 ? "s" : ""}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => handleAddPage(pages.length - 1)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Page
                    </Button>
                </div>
            </header>

            {/* Sticky Toolbar */}
            <StickyTiptapToolbar
                className="sticky top-0 z-50"
                onPageUndo={handlePageUndo}
                onPageRedo={handlePageRedo}
                canPageUndo={canUndo}
                canPageRedo={canRedo}
            />

            {/* Editor Content */}
            <div className="flex-1 overflow-auto bg-muted/30">
                <div className="py-8 px-4 flex flex-col items-center">
                    {pages.map((page, index) => (
                        <TiptapPageEditor
                            key={page.id}
                            content={page.content}
                            onChange={(content) => handlePageChange(index, content)}
                            pageNumber={index + 1}
                            totalPages={pages.length}
                            onDelete={() => handleDeletePage(index)}
                            onAddNext={() => handleAddPage(index)}
                            onMoveUp={index > 0 ? () => handleMoveUp(index) : undefined}
                            onMoveDown={index < pages.length - 1 ? () => handleMoveDown(index) : undefined}
                            settings={page.settings}
                            onSettingsChange={(settings) => handlePageSettingsChange(index, settings)}
                            hideToolbar={true}
                            onEditorFocus={handleEditorFocus}
                            onSplitOverflow={(current, overflow) => handleSplitOverflow(index, current, overflow)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function TiptapEditorPage() {
    return (
        <TiptapEditorProvider>
            <TiptapEditorContent />
        </TiptapEditorProvider>
    );
}
