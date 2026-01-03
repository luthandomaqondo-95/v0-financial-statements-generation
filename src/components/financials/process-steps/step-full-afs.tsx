import { Activity, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { ChevronsLeft, ChevronsRight, List, Plus, Scissors, ZoomIn, ZoomOut } from "lucide-react";
import type { LexicalEditor, RangeSelection } from "lexical";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PageData, PageSettings } from "@/types/afs-types";
import { LexicalEditorProvider, useLexicalEditorContext, LexicalPageEditor } from "@/components/lexical-editor";
import { generateId, processPageOverflows } from "@/lib/utils/afs-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StickyLexicalEditorToolbar } from "@/components/lexical-editor/sticky-lexical-toolbar";
import { A4Preview } from "@/components/financials/preview/a4-preview";
import { ChatComponent } from "@/components/chat-component";
import { findTextInMarkdown } from "@/lib/markdown-utils";



const defaultPageSettings: PageSettings = {
    orientation: "portrait",
    margins: { top: 10, right: 15, bottom: 10, left: 15 },
}


export function StepFullAFS({ project_id, setIsSaving, setHasUnsavedChanges }: { project_id: string | number, setIsSaving: (isSaving: boolean) => void, setHasUnsavedChanges: (hasUnsavedChanges: boolean) => void }) {
    return (
        <LexicalEditorProvider>
            <StepFullAFSContent project_id={project_id} setIsSaving={setIsSaving} setHasUnsavedChanges={setHasUnsavedChanges} />
        </LexicalEditorProvider>
    )
}
function StepFullAFSContent({
    project_id,
    setIsSaving, setHasUnsavedChanges
}: { project_id: string | number, setIsSaving: (isSaving: boolean) => void, setHasUnsavedChanges: (hasUnsavedChanges: boolean) => void }) {
    // const [documentSettings, setDocumentSettings] = useState<DocumentSettings>({
    // 	orientation: "portrait",
    // 	pages: 
    // })
    const { activeEditorRef, setActiveEditor, setActivePageIndex, pushHistory, undo, redo, canUndo, canRedo } = useLexicalEditorContext();

    const [currentPage, setCurrentPage] = useState(1)
    const [zoom, setZoom] = useState("100")
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [pages, setPages] = useState<PageData[]>([])
    const [hasTableOfContents, setHasTableOfContents] = useState(false);
    const [hasUnsavedChangesInThisStep, setHasUnsavedChangesInThisStep] = useState(false);
    const [selection, setSelection] = useState<{ text: string, start: number, end: number } | null>(null);
    const [editingRange, setEditingRange] = useState<{ start: number, end: number } | null>(null);


    // Computed full content for preview/export
    const fullContent = useMemo(() => pages.map((p) => p.content).join("\n\n---\n\n"), [pages]);

    const { data: initialContent, isLoading, isError } = useQuery({
        queryKey: ["afs-default-content"],
        queryFn: async () => {
            const res = await fetch(`/api/afs?project_id=${project_id}`)
            if (!res.ok) throw new Error("Failed to fetch")
            const { content } = await res.json()
            return content as string
        },
        staleTime: Number.POSITIVE_INFINITY,
    })

    // Handle text selection (markdown-based positions)
    const handleMouseUp = (selection: RangeSelection) => {
        // Extract actual text content from selection
        const selectedText = selection.getTextContent();
        const currentPageMarkdown = pages[currentPage - 1]?.content || "";

        // Find position in markdown
        const markdownPos = findTextInMarkdown(
            currentPageMarkdown,
            selectedText,
            { start: selection.anchor.offset, end: selection.focus.offset }
        );

        if (markdownPos) {
            setSelection({
                text: selectedText,
                start: markdownPos.startOffset,
                end: markdownPos.endOffset,
            });
        } else {
            // Fallback to lexical positions if markdown mapping fails
            setSelection({
                text: selectedText,
                start: selection.anchor.offset,
                end: selection.focus.offset,
            });
        }
    };
    const clearSelection = () => {
        setSelection(null);
        window.getSelection()?.removeAllRanges();
    };

    const performAutoSave = useCallback(async () => {
        setIsSaving(true)
        try {
            const saveData = {
                content: fullContent,
                pages: pages,
                savedAt: new Date().toISOString(),
            }
            // localStorage.setItem("afs-draft", JSON.stringify(saveData));

            setHasUnsavedChanges(false)
            setHasUnsavedChangesInThisStep(false);
        } catch (error) {
            console.error("Auto-save failed:", error)
        } finally {
            setIsSaving(false)
        }
    }, [fullContent, pages]);
    const handleTemplateSelect = (templateContent: string) => {
        const initialPages = templateContent.split(/\n---\n/).map((p) => ({
            id: generateId(),
            content: p.trim(),
            settings: { ...defaultPageSettings },
        }))

        const { pages: processedPages, splitCount } = processPageOverflows(initialPages)
        pushHistory(pages, hasTableOfContents); // Save current state before change
        setPages(processedPages)
        setHasUnsavedChanges(true);
        setHasUnsavedChangesInThisStep(true);
        setHasTableOfContents(false)

        if (splitCount > 0) {
            toast.success(`Template loaded and split into ${processedPages.length} pages (${splitCount} splits)`)
        } else {
            toast.success("Template loaded successfully")
        }
    }
    const updatePageSettings = (index: number, settings: PageSettings) => {
        setPages((prev) => {
            const newPages = [...prev]
            newPages[index] = { ...newPages[index], settings }
            return newPages
        })
        setHasUnsavedChanges(true);
        setHasUnsavedChangesInThisStep(true);
    }
    const updatePage = (index: number, content: string) => {
        setPages((prev) => {
            const newPages = [...prev]
            newPages[index] = { ...newPages[index], content }
            return newPages
        })
        setHasUnsavedChanges(true);
        setHasUnsavedChangesInThisStep(true);
    }


    const addPage = (afterIndex: number) => {
        pushHistory(pages, hasTableOfContents); // Save current state before change

        const newPage: PageData = {
            id: generateId(),
            content: "# New Page\n\nStart writing here...",
            settings: { ...defaultPageSettings },
        }

        setPages((prev) => {
            const newPages = [...prev]
            // Insert new page after the specified index
            newPages.splice(afterIndex + 1, 0, newPage)
            return newPages
        })
        setHasUnsavedChanges(true);
        setHasUnsavedChangesInThisStep(true);
        toast.success(`New page added after page ${afterIndex + 1}`)
    }

    const deletePage = (index: number) => {
        if (pages.length <= 1) {
            toast.error("Cannot delete the last page")
            return
        }

        pushHistory(pages, hasTableOfContents); // Save current state before change

        // Check if this is the table of contents page
        if (pages[index].isTableOfContents) {
            setHasTableOfContents(false)
        }

        setPages((prev) => prev.filter((_, i) => i !== index))
        setHasUnsavedChanges(true);
        setHasUnsavedChangesInThisStep(true);
        toast.success("Page deleted")
    }

    const movePage = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= pages.length) return

        pushHistory(pages, hasTableOfContents); // Save current state before change

        setPages((prev) => {
            const newPages = [...prev]
            const [movedPage] = newPages.splice(fromIndex, 1)
            newPages.splice(toIndex, 0, movedPage)
            return newPages
        })
        setHasUnsavedChanges(true);
        setHasUnsavedChangesInThisStep(true);
        toast.success(`Page moved ${toIndex < fromIndex ? "up" : "down"}`)
    }

    // Handle splitting overflow content to a new page
    const handleSplitOverflow = useCallback((pageIndex: number, currentContent: string, overflowContent: string) => {
        pushHistory(pages, hasTableOfContents); // Save current state before change

        setPages((prev) => {
            const newPages = [...prev]
            // Update current page with trimmed content
            newPages[pageIndex] = { ...newPages[pageIndex], content: currentContent }
            // Insert new page with overflow content
            const newPage: PageData = {
                id: generateId(),
                content: overflowContent,
                settings: { ...newPages[pageIndex].settings },
            }
            newPages.splice(pageIndex + 1, 0, newPage)
            return newPages
        })
        setHasUnsavedChanges(true);
        setHasUnsavedChangesInThisStep(true);
        toast.success("Content split to new page")
    }, [pages, hasTableOfContents, pushHistory])

    // Split all overflowing pages
    const splitAllOverflows = useCallback(() => {
        pushHistory(pages, hasTableOfContents); // Save current state before change

        setPages((prevPages) => {
            const { pages: newPages, splitCount } = processPageOverflows(prevPages)

            if (splitCount > 0) {
                toast.success(`Split ${splitCount} page${splitCount > 1 ? 's' : ''} to fix overflows`)
            } else {
                toast.info("No overflowing pages to split")
            }

            return newPages
        })
        setHasUnsavedChanges(true);
        setHasUnsavedChangesInThisStep(true);
    }, [pages, hasTableOfContents, pushHistory])

    // Handle editor focus to update the active editor in context
    const handleEditorFocus = useCallback((ref: React.RefObject<LexicalEditor | null>, pageIndex: number) => {
        setActiveEditor(ref)
        setActivePageIndex(pageIndex)
    }, [setActiveEditor, setActivePageIndex])

    // Handle page-level undo
    const handlePageUndo = useCallback(() => {
        const previousState = undo();
        if (previousState) {
            setPages(previousState.pages);
            setHasTableOfContents(previousState.hasTableOfContents);
            toast.success("Undo successful");
        }
    }, [undo]);

    // Handle page-level redo
    const handlePageRedo = useCallback(() => {
        const nextState = redo();
        if (nextState) {
            setPages(nextState.pages);
            setHasTableOfContents(nextState.hasTableOfContents);
            toast.success("Redo successful");
        }
    }, [redo]);

    // Keyboard shortcuts for page-level undo/redo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle if Ctrl/Cmd is pressed
            if (!(e.ctrlKey || e.metaKey)) return;

            // Check if we're in an input, textarea, or contenteditable
            const target = e.target as HTMLElement;
            const isInEditor = target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable;

            // If in an editor, let Lexical handle its own undo/redo
            if (isInEditor) return;

            if (e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                handlePageUndo();
            } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
                e.preventDefault();
                handlePageRedo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlePageUndo, handlePageRedo]);

    const addTableOfContents = () => {
        if (hasTableOfContents) {
            toast.error("Table of Contents already exists")
            return
        }

        pushHistory(pages, hasTableOfContents); // Save current state before change

        // Generate Table of Contents based on headings in all pages
        const headings: { title: string; page: number; level: number }[] = []

        pages.forEach((page, pageIndex) => {
            // Skip if this is the table of contents page itself
            if (page.isTableOfContents) return

            const lines = page.content.split("\n")
            lines.forEach((line, sectionIndex) => {
                if (sectionIndex > 0) {
                    const trimmedLine = line.trim()

                    // Match headings - check from most specific (####) to least specific (#)
                    // to avoid false matches
                    if (trimmedLine.startsWith("#### ")) {
                        const title = trimmedLine.replace(/^####\s+/, "")
                        headings.push({ title, page: pageIndex + 2, level: 4 })
                    } else if (trimmedLine.startsWith("### ")) {
                        const title = trimmedLine.replace(/^###\s+/, "")
                        headings.push({ title, page: pageIndex + 2, level: 3 })
                    } else if (trimmedLine.startsWith("## ")) {
                        const title = trimmedLine.replace(/^##\s+/, "")
                        headings.push({ title, page: pageIndex + 2, level: 2 })
                    } else if (trimmedLine.startsWith("# ")) {
                        const title = trimmedLine.replace(/^#\s+/, "")
                        headings.push({ title, page: pageIndex + 2, level: 1 })
                    }
                }
            })
        })

        // Configuration for ToC line formatting
        const LINE_WIDTH = 70 // Total character width for each ToC line
        const INDENT_SIZE = 4 // Spaces per indent level
        const MIN_DOTS = 3 // Minimum dots between title and page number

        // Helper function to create a properly formatted ToC line
        const formatTocLine = (title: string, pageNum: number, level: number): string => {
            const indent = " ".repeat((level - 1) * INDENT_SIZE)
            const pageStr = pageNum.toString()

            // Calculate available space for dots
            // Format: [indent][title] [dots] [pageNum]
            const titleWithIndent = indent + title
            const availableForDots = LINE_WIDTH - titleWithIndent.length - pageStr.length - 2 // -2 for spaces
            const numDots = Math.max(MIN_DOTS, availableForDots)
            const dots = ".".repeat(numDots)

            // For H1 (level 1), make the title bold
            if (level === 1) {
                return `**${title}** ${dots} ${pageStr}`
            }

            return `${indent}${title} ${dots} ${pageStr}`;
        }

        // Generate markdown for Table of Contents with professional formatting
        let tocContent = `# **Contents**\n\n`
        tocContent += `---\n\n`

        if (headings.length === 0) {
            tocContent += `*No headings found in the document.*\n\n`
            tocContent += `*Add headings using # for H1, ## for H2, ### for H3, etc.*\n\n`
        } else {
            headings.forEach((heading) => {
                const line = formatTocLine(heading.title, heading.page, heading.level)
                tocContent += `${line}\n\n`
            })
        }

        tocContent += `---\n`

        // Insert ToC after the first page (cover page)
        const tocPage: PageData = {
            id: generateId(),
            content: tocContent,
            settings: { ...defaultPageSettings },
            isTableOfContents: true,
        }

        setPages((prev) => {
            const newPages = [...prev]
            newPages.splice(1, 0, tocPage) // Insert after first page
            return newPages
        })

        setHasTableOfContents(true)
        setHasUnsavedChanges(true);
        setHasUnsavedChangesInThisStep(true);
        toast.success("Table of Contents added after cover page")
    };

    useEffect(() => {
        if (initialContent && pages.length === 0) {
            const initialPages = initialContent.split(/\n---\n/).map((p: string) => ({
                id: generateId(),
                content: p.trim(),
                settings: { ...defaultPageSettings },
            }))

            const { pages: processedPages } = processPageOverflows(initialPages)
            setPages(processedPages)
            // Push initial state to history
            pushHistory(processedPages, false)
        }
    }, [initialContent, pages.length, pushHistory]);
    // Auto-save effect
    useEffect(() => {
        if (hasUnsavedChangesInThisStep) {
            performAutoSave()
        }
    }, [hasUnsavedChangesInThisStep])

    useEffect(() => {
        if (isError) {
            toast.error("Failed to load content")
        }
    }, [isError])


    return (
        <div className="h-full flex-1 flex overflow-hidden">
            {/* Chat panel - sits alongside entire Editor/Preview area */}
            <div
                className={cn(
                    "h-full flex flex-col border-r bg-background transition-all duration-300 ease-in-out overflow-hidden shrink-0",
                    isChatOpen ? "w-[450px]" : "w-0 border-r-0"
                )}
            >
                <Activity mode={isChatOpen ? "visible" : "hidden"}>
                    <ChatComponent
                        type="afs"
                        project_id={project_id}
                        llmContext={selection}
                        currentPageMarkdown={pages[currentPage - 1]?.content || ""}
                        setSelection={setSelection}
                        setEditingRange={setEditingRange}
                        clearSelection={clearSelection}
                    />
                </Activity>

            </div>

            {/* Editor/Preview Tabs - fills remaining space */}
            <div className="h-full flex-1 flex flex-col min-w-0 min-h-0">
                {/* Sticky Toolbar - Outside the transform container */}
                <div className="flex flex-row justify-between border-b rounded-2xl">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-12 w-12 cursor-pointer rounded-full"
                                    onClick={() => setIsChatOpen(!isChatOpen)}
                                >
                                    {isChatOpen ? (
                                        <ChevronsLeft className="h-4 w-4" />
                                    ) : (
                                        <ChevronsRight className="h-4 w-4" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                {isChatOpen ? "Hide chat panel" : "Show chat panel"}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <StickyLexicalEditorToolbar
                        onPageUndo={handlePageUndo}
                        onPageRedo={handlePageRedo}
                        canPageUndo={canUndo}
                        canPageRedo={canRedo}
                    />

                    <div className=" items-center justify-between shrink-0">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-4 mt-2 h-full">
                                <div className="hidden text-sm text-muted-foreground">
                                    {pages.length} page{pages.length !== 1 ? "s" : ""}
                                </div>
                                {/* <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-2 bg-transparent"
                                                onClick={splitAllOverflows}
                                            >
                                                <Scissors className="h-4 w-4" />
                                                Split Overflows
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Automatically split all overflowing pages
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider> */}
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => setZoom(Math.max(50, Number.parseInt(zoom) - 25).toString())}
                                    >
                                        <ZoomOut className="h-4 w-4" />
                                    </Button>
                                    <Select value={zoom} onValueChange={setZoom}>
                                        <SelectTrigger className="w-[70px] h-7 text-xs">
                                            <SelectValue>{zoom}%</SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="50">50%</SelectItem>
                                            <SelectItem value="75">75%</SelectItem>
                                            <SelectItem value="100">100%</SelectItem>
                                            <SelectItem value="125">125%</SelectItem>
                                            <SelectItem value="150">150%</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => setZoom(Math.min(200, Number.parseInt(zoom) + 25).toString())}
                                    >
                                        <ZoomIn className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {
                    (isLoading) ? (
                        <div className="flex-1 flex-col mt-2">
                            {/* Skeleton Toolbar */}
                            <div className="h-10 border-b bg-background/50 flex items-center px-4 gap-2 shrink-0">
                                <Skeleton className="h-6 w-6 rounded" />
                                <Skeleton className="h-6 w-6 rounded" />
                                <Skeleton className="h-6 w-px mx-1" />
                                <Skeleton className="h-6 w-20 rounded" />
                                <Skeleton className="h-6 w-6 rounded" />
                                <Skeleton className="h-6 w-6 rounded" />
                                <Skeleton className="h-6 w-px mx-1" />
                                <Skeleton className="h-6 w-6 rounded" />
                                <Skeleton className="h-6 w-6 rounded" />
                                <Skeleton className="h-6 w-6 rounded" />
                                <Skeleton className="h-6 w-px mx-1" />
                                <Skeleton className="h-6 w-24 rounded" />
                            </div>

                            {/* Skeleton Pages Area */}
                            <div className="flex-1 overflow-auto bg-muted/10">
                                <div className="flex flex-col items-center py-8 gap-8">
                                    {/* Skeleton Page 1 */}
                                    <div className="relative group">
                                        <div
                                            className="bg-white shadow-lg border rounded-sm overflow-hidden"
                                            style={{ width: "210mm", minHeight: "297mm", padding: "10mm 15mm" }}
                                        >
                                            {/* Page header skeleton */}
                                            <div className="flex justify-between items-start mb-8">
                                                <Skeleton className="h-10 w-48 rounded" />
                                                <Skeleton className="h-12 w-12 rounded" />
                                            </div>

                                            {/* Title skeleton */}
                                            <Skeleton className="h-8 w-3/4 rounded mb-4" />
                                            <Skeleton className="h-6 w-1/2 rounded mb-8" />

                                            {/* Content lines skeleton */}
                                            <div className="space-y-3 mb-8">
                                                <Skeleton className="h-4 w-full rounded" />
                                                <Skeleton className="h-4 w-5/6 rounded" />
                                                <Skeleton className="h-4 w-4/5 rounded" />
                                                <Skeleton className="h-4 w-full rounded" />
                                                <Skeleton className="h-4 w-3/4 rounded" />
                                            </div>

                                            {/* Section heading skeleton */}
                                            <Skeleton className="h-6 w-1/3 rounded mb-4" />

                                            {/* More content skeleton */}
                                            <div className="space-y-3 mb-8">
                                                <Skeleton className="h-4 w-full rounded" />
                                                <Skeleton className="h-4 w-5/6 rounded" />
                                                <Skeleton className="h-4 w-full rounded" />
                                                <Skeleton className="h-4 w-2/3 rounded" />
                                            </div>

                                            {/* Table skeleton */}
                                            <div className="border rounded-md overflow-hidden mb-8">
                                                <div className="bg-muted/30 p-3 flex gap-4">
                                                    <Skeleton className="h-4 w-1/4 rounded" />
                                                    <Skeleton className="h-4 w-1/4 rounded" />
                                                    <Skeleton className="h-4 w-1/4 rounded" />
                                                    <Skeleton className="h-4 w-1/4 rounded" />
                                                </div>
                                                {[...Array(5)].map((_, i) => (
                                                    <div key={i} className="p-3 flex gap-4 border-t">
                                                        <Skeleton className="h-4 w-1/4 rounded" />
                                                        <Skeleton className="h-4 w-1/4 rounded" />
                                                        <Skeleton className="h-4 w-1/4 rounded" />
                                                        <Skeleton className="h-4 w-1/4 rounded" />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* More paragraphs skeleton */}
                                            <div className="space-y-3">
                                                <Skeleton className="h-4 w-full rounded" />
                                                <Skeleton className="h-4 w-4/5 rounded" />
                                                <Skeleton className="h-4 w-full rounded" />
                                                <Skeleton className="h-4 w-3/5 rounded" />
                                            </div>
                                        </div>

                                        {/* Page number skeleton */}
                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                                            <Skeleton className="h-5 w-16 rounded-full" />
                                        </div>
                                    </div>

                                    {/* Skeleton Page 2 (partial view) */}
                                    <div className="relative group">
                                        <div
                                            className="bg-white shadow-lg border rounded-sm overflow-hidden"
                                            style={{ width: "210mm", minHeight: "297mm", padding: "10mm 15mm" }}
                                        >
                                            {/* Section heading skeleton */}
                                            <Skeleton className="h-7 w-2/5 rounded mb-6" />

                                            {/* Content skeleton */}
                                            <div className="space-y-3 mb-8">
                                                <Skeleton className="h-4 w-full rounded" />
                                                <Skeleton className="h-4 w-5/6 rounded" />
                                                <Skeleton className="h-4 w-full rounded" />
                                                <Skeleton className="h-4 w-4/5 rounded" />
                                                <Skeleton className="h-4 w-3/4 rounded" />
                                            </div>

                                            {/* Another section */}
                                            <Skeleton className="h-6 w-1/3 rounded mb-4" />
                                            <div className="space-y-3 mb-8">
                                                <Skeleton className="h-4 w-full rounded" />
                                                <Skeleton className="h-4 w-5/6 rounded" />
                                                <Skeleton className="h-4 w-4/5 rounded" />
                                            </div>

                                            {/* List skeleton */}
                                            <div className="space-y-2 pl-4 mb-8">
                                                {[...Array(4)].map((_, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <Skeleton className="h-2 w-2 rounded-full shrink-0" />
                                                        <Skeleton className="h-4 w-4/5 rounded" />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* More content */}
                                            <div className="space-y-3">
                                                <Skeleton className="h-4 w-full rounded" />
                                                <Skeleton className="h-4 w-5/6 rounded" />
                                                <Skeleton className="h-4 w-full rounded" />
                                            </div>
                                        </div>

                                        {/* Page number skeleton */}
                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                                            <Skeleton className="h-5 w-16 rounded-full" />
                                        </div>
                                    </div>

                                    {/* Add page button skeleton */}
                                    <Skeleton className="h-12 w-12 rounded-full mt-4 mb-12" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Editor interface */}
                            <div
                                className={cn(
                                    "flex-1 bg-muted/10 relative transition-all duration-300 ease-in-out overflow-auto min-h-0"
                                )}
                            >
                                <div
                                    className="relative flex flex-col items-center py-8"
                                    style={{
                                        transform: `scale(${Number.parseInt(zoom) / 100})`,
                                        transformOrigin: "top center",
                                    }}
                                >
                                    {pages.map((pageData, index) => (
                                        <LexicalPageEditor
                                            key={pageData.id}
                                            pageNumber={index + 1}
                                            totalPages={pages.length}
                                            content={pageData.content}
                                            onChange={(content) => updatePage(index, content)}
                                            onTextSelection={handleMouseUp}
                                            onAddNext={() => addPage(index)}
                                            onDelete={() => deletePage(index)}
                                            onMoveUp={() => movePage(index, index - 1)}
                                            onMoveDown={() => movePage(index, index + 1)}
                                            settings={pageData.settings}
                                            onSettingsChange={(settings) => updatePageSettings(index, settings)}
                                            hideToolbar={true}
                                            onEditorFocus={handleEditorFocus}
                                            onSplitOverflow={(currentContent, overflowContent) => handleSplitOverflow(index, currentContent, overflowContent)}
                                        />
                                    ))}

                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    // size="icon"
                                                    className=" mb-12 h-12 rounded-full border-dashed bg-transparent"
                                                    onClick={() => addPage(pages.length - 1)}
                                                >
                                                    <Plus className="h-5 w-5" /> Add Page
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Add new page at the end</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                        </>
                    )
                }
            </div>
        </div>
    )
}