import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronsLeft, ChevronsRight, Edit, Eye, List, Plus, RefreshCcw, Scissors, ZoomIn, ZoomOut } from "lucide-react";
import { PageData, PageSettings } from "@/types/afs-types";
import { cn } from "@/lib/utils";
import { generateId, processPageOverflows } from "@/lib/utils/afs-utils";
import { EditorProvider, useEditorContext } from "@/components/editor-mdx/editor-context";
import { StickyEditorToolbar } from "@/components/editor-mdx/sticky-editor-toolbar";
import { PageEditor } from "@/components/editor-mdx/page-editor";
import { A4Preview } from "@/components/financials/preview/a4-preview";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChatComponent } from "@/components/chat-component/for-mdx";
import { MDXEditorMethods } from "@mdxeditor/editor";
import { ToggleSwitch } from "@/components/ui-custom/toggle-switch";


const defaultPageSettings: PageSettings = {
    orientation: "portrait",
    margins: { top: 10, right: 15, bottom: 10, left: 15 },
}


export function StepFullAFS({
    project_id, projectConfig, setIsSaving, setHasUnsavedChanges
}: {
    project_id: string | number, projectConfig?: any, setIsSaving: (isSaving: boolean) => void, setHasUnsavedChanges: (hasUnsavedChanges: boolean) => void
}) {
    return (
        <EditorProvider>
            <StepFullAFSContent project_id={project_id} projectConfig={projectConfig} setIsSaving={setIsSaving} setHasUnsavedChanges={setHasUnsavedChanges} />
        </EditorProvider>
    )
}

function StepFullAFSContent({
    project_id,
    projectConfig,
    setIsSaving, setHasUnsavedChanges
}: { project_id: string | number, projectConfig?: any, setIsSaving: (isSaving: boolean) => void, setHasUnsavedChanges: (hasUnsavedChanges: boolean) => void }) {
    const { setActiveEditor, setActivePageIndex, setCurrentBlockType } = useEditorContext();

    const [currentPage, setCurrentPage] = useState(1)
    const [zoom, setZoom] = useState("100")
    const [activeTab, setActiveTab] = useState("preview")
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [pages, setPages] = useState<PageData[]>([])
    const [hasTableOfContents, setHasTableOfContents] = useState(false);
    const [hasUnsavedChangesInThisStep, setHasUnsavedChangesInThisStep] = useState(false);
    const [selection, setSelection] = useState<{ text: string, start: number, end: number } | null>(null);
    const [editingRange, setEditingRange] = useState<{ start: number, end: number } | null>(null);
    const [mountedPagesCount, setMountedPagesCount] = useState(0);

    // Per-page debounce timers to avoid re-rendering all pages on every keystroke
    const debounceTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
    // Mutable mirror of pages so debounced callbacks always read the latest content
    const pagesRef = useRef<PageData[]>([]);

    // Keep pagesRef in sync
    useEffect(() => {
        pagesRef.current = pages;
    }, [pages]);

    // Cleanup debounce timers on unmount
    useEffect(() => {
        return () => {
            debounceTimersRef.current.forEach((timer) => clearTimeout(timer));
        };
    }, []);

    // Staggered mounting of pages when entering edit mode
    useEffect(() => {
        if (activeTab !== "edit" || pages.length === 0) {
            setMountedPagesCount(0);
            return;
        }

        // Reset to 0 when switching to edit mode
        setMountedPagesCount(0);

        const timers: ReturnType<typeof setTimeout>[] = [];

        // Mount first page immediately
        timers.push(setTimeout(() => setMountedPagesCount(1), 50));

        // Mount second page quickly after
        if (pages.length > 1) {
            timers.push(setTimeout(() => setMountedPagesCount(2), 150));
        }

        // Mount remaining pages with deceleration up to page 5, then constant 300ms
        if (pages.length > 2) {
            let cumulativeDelay = 150; // Starting from page 2's delay

            for (let i = 2; i < pages.length; i++) {
                const pageIndex = i - 2; // 0-indexed for remaining pages (page 3 = 0, page 4 = 1, page 5 = 2)
                
                let intervalDelay: number;
                if (pageIndex < 3) {
                    // Pages 3, 4, 5: decelerate (150ms, 200ms, 250ms)
                    intervalDelay = 150 + (pageIndex * 50);
                } else {
                    // Page 6+: constant 200ms intervals
                    intervalDelay = 200;
                }

                cumulativeDelay += intervalDelay;
                timers.push(setTimeout(() => setMountedPagesCount(i + 1), cumulativeDelay));
            }
        }

        return () => {
            timers.forEach(timer => clearTimeout(timer));
        };
    }, [activeTab, pages.length]);

    // Computed full content for preview/export
    const fullContent = useMemo(() => pages.map((p) => p.content).join("\n\n---\n\n"), [pages]);

    const {
        data: initialContent,
        refetch: refreshFullAFS,
        isLoading,
        isError
    } = useQuery({
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
    const handleMouseUp = useCallback((selection: any) => {
        const selectedText = selection.getTextContent();
        const currentPageMarkdown = pagesRef.current[currentPage - 1]?.content || "";

        if (selectedText && selectedText.trim()) {
            const trimmedText = selectedText.trim();
            const startIndex = currentPageMarkdown.indexOf(trimmedText);

            if (startIndex !== -1) {
                setSelection({
                    text: trimmedText,
                    start: startIndex,
                    end: startIndex + trimmedText.length,
                });
            } else {
                setSelection({
                    text: trimmedText,
                    start: selection.anchor?.offset || 0,
                    end: selection.focus?.offset || trimmedText.length,
                });
            }
        }
    }, [currentPage]);

    const clearSelection = useCallback(() => {
        setSelection(null);
        window.getSelection()?.removeAllRanges();
    }, []);

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
    }, [fullContent, pages, setIsSaving, setHasUnsavedChanges]);

    const updatePageSettings = useCallback((index: number, settings: PageSettings) => {
        setPages((prev) => {
            const newPages = [...prev]
            newPages[index] = { ...newPages[index], settings }
            return newPages
        })
        setHasUnsavedChanges(true);
        setHasUnsavedChangesInThisStep(true);
    }, [setHasUnsavedChanges]);

    /**
     * Debounced page content update.
     * Each page gets its own 300ms debounce timer so rapid keystrokes
     * only trigger a single setPages call after typing pauses.
     */
    const updatePage = useCallback((index: number, content: string) => {
        // Immediately update the mutable ref so other callbacks see the latest content
        if (pagesRef.current[index]) {
            pagesRef.current[index] = { ...pagesRef.current[index], content };
        }

        // Clear any existing debounce timer for this page
        const existing = debounceTimersRef.current.get(index);
        if (existing) clearTimeout(existing);

        // Set a new debounce timer
        const timer = setTimeout(() => {
            debounceTimersRef.current.delete(index);
            setPages((prev) => {
                const newPages = [...prev];
                newPages[index] = { ...newPages[index], content };
                return newPages;
            });
            setHasUnsavedChanges(true);
            setHasUnsavedChangesInThisStep(true);
        }, 300);

        debounceTimersRef.current.set(index, timer);
    }, [setHasUnsavedChanges]);


    const addPage = useCallback((afterIndex: number) => {
        const newPage: PageData = {
            id: generateId(),
            content: "# New Page\n\nStart writing here...",
            settings: { ...defaultPageSettings },
        }

        setPages((prev) => {
            const newPages = [...prev]
            newPages.splice(afterIndex + 1, 0, newPage)
            return newPages
        })
        setHasUnsavedChanges(true);
        setHasUnsavedChangesInThisStep(true);
        toast.success(`New page added after page ${afterIndex + 1}`)
    }, [setHasUnsavedChanges]);

    const deletePage = useCallback((index: number) => {
        if (pagesRef.current.length <= 1) {
            toast.error("Cannot delete the last page")
            return
        }

        if (pagesRef.current[index]?.isTableOfContents) {
            setHasTableOfContents(false)
        }

        setPages((prev) => prev.filter((_, i) => i !== index))
        setHasUnsavedChanges(true);
        setHasUnsavedChangesInThisStep(true);
        toast.success("Page deleted")
    }, [setHasUnsavedChanges]);

    const movePage = useCallback((fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= pagesRef.current.length) return

        setPages((prev) => {
            const newPages = [...prev]
            const [movedPage] = newPages.splice(fromIndex, 1)
            newPages.splice(toIndex, 0, movedPage)
            return newPages
        })
        setHasUnsavedChanges(true);
        setHasUnsavedChangesInThisStep(true);
        toast.success(`Page moved ${toIndex < fromIndex ? "up" : "down"}`)
    }, [setHasUnsavedChanges]);

    /**
     * Handle splitting overflow content to a new page.
     * After splitting, forward cursor focus to the next page.
     */
    const handleSplitOverflow = useCallback((pageIndex: number, currentContent: string, overflowContent: string) => {
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

        // Forward cursor to the new page after React renders
        requestAnimationFrame(() => {
            setActivePageIndex(pageIndex + 1)
            // Focus the next page's editor element
            const pageEditors = document.querySelectorAll('.page-editor-container [contenteditable="true"]')
            const nextEditor = pageEditors[pageIndex + 1] as HTMLElement | undefined
            if (nextEditor) {
                nextEditor.focus()
                // Place cursor at start of the editor
                const sel = window.getSelection()
                if (sel && nextEditor.firstChild) {
                    const range = document.createRange()
                    range.setStart(nextEditor.firstChild, 0)
                    range.collapse(true)
                    sel.removeAllRanges()
                    sel.addRange(range)
                }
            }
        })
    }, [setActivePageIndex, setHasUnsavedChanges])

    // Split all overflowing pages
    const splitAllOverflows = useCallback(() => {
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
    }, [setHasUnsavedChanges])

    // Handle editor focus to update the active editor in context
    const handleEditorFocus = useCallback((ref: React.RefObject<MDXEditorMethods | null>, pageIndex: number) => {
        setActiveEditor(ref)
        setActivePageIndex(pageIndex)
    }, [setActiveEditor, setActivePageIndex])

    const handleBlockTypeChange = useCallback((blockType: string) => {
        setCurrentBlockType(blockType)
    }, [setCurrentBlockType])

    const addTableOfContents = useCallback(() => {
        if (hasTableOfContents) {
            toast.error("Table of Contents already exists")
            return
        }

        // Generate Table of Contents based on headings in all pages
        const headings: { title: string; page: number; level: number }[] = []

        pagesRef.current.forEach((page, pageIndex) => {
            if (page.isTableOfContents) return

            const lines = page.content.split("\n")
            lines.forEach((line, sectionIndex) => {
                if (sectionIndex > 0) {
                    const trimmedLine = line.trim()

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

        const LINE_WIDTH = 70
        const INDENT_SIZE = 4
        const MIN_DOTS = 3

        const formatTocLine = (title: string, pageNum: number, level: number): string => {
            const indent = " ".repeat((level - 1) * INDENT_SIZE)
            const pageStr = pageNum.toString()
            const titleWithIndent = indent + title
            const availableForDots = LINE_WIDTH - titleWithIndent.length - pageStr.length - 2
            const numDots = Math.max(MIN_DOTS, availableForDots)
            const dots = ".".repeat(numDots)

            if (level === 1) {
                return `**${title}** ${dots} ${pageStr}`
            }

            return `${indent}${title} ${dots} ${pageStr}`;
        }

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

        const tocPage: PageData = {
            id: generateId(),
            content: tocContent,
            settings: { ...defaultPageSettings },
            isTableOfContents: true,
        }

        setPages((prev) => {
            const newPages = [...prev]
            newPages.splice(1, 0, tocPage)
            return newPages
        })

        setHasTableOfContents(true)
        setHasUnsavedChanges(true);
        setHasUnsavedChangesInThisStep(true);
        toast.success("Table of Contents added after cover page")
    }, [hasTableOfContents, setHasUnsavedChanges]);

    useEffect(() => {
        if (initialContent && pages.length === 0) {
            const initialPages = initialContent.split(/\n---\n/).map((p: string) => ({
                id: generateId(),
                content: p.trim(),
                settings: { ...defaultPageSettings },
            }))

            const { pages: processedPages } = processPageOverflows(initialPages)
            setPages(processedPages)
        }
    }, [initialContent, pages.length]);

    // Auto-save effect
    useEffect(() => {
        if (hasUnsavedChangesInThisStep) {
            performAutoSave()
        }
    }, [hasUnsavedChangesInThisStep, performAutoSave])

    useEffect(() => {
        if (isError) {
            toast.error("Failed to load content")
        }
    }, [isError]);


    return (
        <div className="h-full flex-1 flex overflow-hidden">
            {/* Chat panel - sits alongside entire Editor/Preview area */}
            <div
                className={cn(
                    "h-full flex flex-col border-r bg-background transition-all duration-300 ease-in-out overflow-hidden shrink-0",
                    isChatOpen ? "w-[450px]" : "w-0 border-r-0"
                )}
            >
                {isChatOpen && (
                    <div className="flex-1 flex flex-col p-4">
                        <h3 className="font-semibold text-sm mb-4">AI Assistant</h3>
                        <ChatComponent
                            type="afs"
                            project_id={project_id}
                            llmContext={selection}
                            currentPageMarkdown={pages[currentPage - 1]?.content || ""}
                            setSelection={setSelection}
                            setEditingRange={setEditingRange}
                            clearSelection={clearSelection}
                        />
                    </div>
                )}
            </div>

            {/* Editor/Preview Tabs - fills remaining space */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex-1 flex flex-col min-w-0 min-h-0">
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
                                            <div className="flex justify-between items-start mb-8">
                                                <Skeleton className="h-10 w-48 rounded" />
                                                <Skeleton className="h-12 w-12 rounded" />
                                            </div>
                                            <Skeleton className="h-8 w-3/4 rounded mb-4" />
                                            <Skeleton className="h-6 w-1/2 rounded mb-8" />
                                            <div className="space-y-3 mb-8">
                                                <Skeleton className="h-4 w-full rounded" />
                                                <Skeleton className="h-4 w-5/6 rounded" />
                                                <Skeleton className="h-4 w-4/5 rounded" />
                                                <Skeleton className="h-4 w-full rounded" />
                                                <Skeleton className="h-4 w-3/4 rounded" />
                                            </div>
                                            <Skeleton className="h-6 w-1/3 rounded mb-4" />
                                            <div className="space-y-3 mb-8">
                                                <Skeleton className="h-4 w-full rounded" />
                                                <Skeleton className="h-4 w-5/6 rounded" />
                                                <Skeleton className="h-4 w-full rounded" />
                                                <Skeleton className="h-4 w-2/3 rounded" />
                                            </div>
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
                                            <div className="space-y-3">
                                                <Skeleton className="h-4 w-full rounded" />
                                                <Skeleton className="h-4 w-4/5 rounded" />
                                                <Skeleton className="h-4 w-full rounded" />
                                                <Skeleton className="h-4 w-3/5 rounded" />
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                                            <Skeleton className="h-5 w-16 rounded-full" />
                                        </div>
                                    </div>

                                    {/* Skeleton Page 2 */}
                                    <div className="relative group">
                                        <div
                                            className="bg-white shadow-lg border rounded-sm overflow-hidden"
                                            style={{ width: "210mm", minHeight: "297mm", padding: "10mm 15mm" }}
                                        >
                                            <Skeleton className="h-7 w-2/5 rounded mb-6" />
                                            <div className="space-y-3 mb-8">
                                                <Skeleton className="h-4 w-full rounded" />
                                                <Skeleton className="h-4 w-5/6 rounded" />
                                                <Skeleton className="h-4 w-full rounded" />
                                                <Skeleton className="h-4 w-4/5 rounded" />
                                                <Skeleton className="h-4 w-3/4 rounded" />
                                            </div>
                                            <Skeleton className="h-6 w-1/3 rounded mb-4" />
                                            <div className="space-y-3 mb-8">
                                                <Skeleton className="h-4 w-full rounded" />
                                                <Skeleton className="h-4 w-5/6 rounded" />
                                                <Skeleton className="h-4 w-4/5 rounded" />
                                            </div>
                                            <div className="space-y-2 pl-4 mb-8">
                                                {[...Array(4)].map((_, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <Skeleton className="h-2 w-2 rounded-full shrink-0" />
                                                        <Skeleton className="h-4 w-4/5 rounded" />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="space-y-3">
                                                <Skeleton className="h-4 w-full rounded" />
                                                <Skeleton className="h-4 w-5/6 rounded" />
                                                <Skeleton className="h-4 w-full rounded" />
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                                            <Skeleton className="h-5 w-16 rounded-full" />
                                        </div>
                                    </div>

                                    <Skeleton className="h-12 w-12 rounded-full mt-4 mb-12" />
                                </div>
                            </div>
                        </div>
                    ) : (

                        <>
                            {/* Sticky Toolbar - Outside the transform container */}
                            <div className="flex flex-row justify-between border-b rounded-2xl">
                                <div className="flex items-center gap-2">
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
                                    <ToggleSwitch
                                        className="h-8 w-12 sm:h-10 sm:w-16"
                                        checked={activeTab === "preview"}
                                        onCheckedChange={(checked) =>
                                            setActiveTab(checked ? "preview" : "edit")
                                        }
                                        options={[
                                            { value: "edit", icon: <Edit className="h-4 w-4" /> },
                                            { value: "preview", icon: <Eye className="h-4 w-4" /> }
                                        ]}
                                    />

                                    <TabsList className="hidden h-12 bg-transparent p-0 gap-6">
                                        <TabsTrigger
                                            value="edit"
                                            className="cursor-pointer h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2"
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Editor
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="preview"
                                            className="cursor-pointer h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2"
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Preview
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <StickyEditorToolbar />

                                <div className="items-center justify-between shrink-0">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-4 mt-2 h-full">
                                            <div className="hidden text-sm text-muted-foreground">
                                                {pages.length} page{pages.length !== 1 ? "s" : ""}
                                            </div>
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
                                activeTab === "edit" ? (
                                    <TabsContent
                                        value="edit"
                                        className="flex-1 flex flex-col mt-0 border-0 p-0 data-[state=inactive]:hidden min-h-0"
                                    >
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
                                                {
                                                    pages.map((pageData, index) => (
                                                        index < mountedPagesCount ? (
                                                            <PageEditor
                                                                key={pageData.id}
                                                                pageNumber={index + 1}
                                                                totalPages={pages.length}
                                                                content={pageData.content}
                                                                onTextSelection={handleMouseUp}
                                                                onBlockTypeChange={handleBlockTypeChange}
                                                                onChange={(content) => updatePage(index, content)}
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
                                                        ) : (
                                                            <div
                                                                key={`skeleton-${pageData.id}`}
                                                                className="relative group mb-12 last:mb-0 flex flex-col items-center"
                                                            >
                                                                <div className="w-full flex items-center justify-between mb-2 px-2" style={{ maxWidth: `${pageData.settings.orientation === "portrait" ? 210 : 297}mm` }}>
                                                                    <div className="text-sm font-medium text-muted-foreground">
                                                                        Page {index + 1} of {pages.length}
                                                                    </div>
                                                                </div>
                                                                <Skeleton
                                                                    className="shadow-lg"
                                                                    style={{
                                                                        width: `${pageData.settings.orientation === "portrait" ? 210 : 297}mm`,
                                                                        height: `${pageData.settings.orientation === "portrait" ? 297 : 210}mm`,
                                                                    }}
                                                                />
                                                            </div>
                                                        )
                                                    ))
                                                }

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="outline"
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
                                    </TabsContent>
                                ) : (
                                    <TabsContent
                                        value="preview"
                                        className="flex-1 mt-0 border-0 p-0 data-[state=inactive]:hidden min-h-0 overflow-auto"
                                    >
                                        <div className="flex flex-col bg-muted/20">
                                            <div
                                                className="p-6"
                                                style={{
                                                    transform: `scale(${Number.parseInt(zoom) / 100})`,
                                                    transformOrigin: "top center",
                                                }}
                                            >
                                                <A4Preview
                                                    orientation={defaultPageSettings.orientation}
                                                    content={fullContent}
                                                    onPageChange={setCurrentPage}
                                                />
                                            </div>
                                        </div>
                                    </TabsContent>
                                )
                            }
                        </>
                    )
                }
            </Tabs>
        </div>
    )
}
