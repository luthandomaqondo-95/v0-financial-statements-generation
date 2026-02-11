import { Activity, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { ChevronsLeft, ChevronsRight, List, Plus, Scissors, ZoomIn, ZoomOut } from "lucide-react";
import { Transaction } from "remirror";
import { EditorComponent, Remirror, useRemirror } from "@remirror/react";
import {
    BoldExtension, ItalicExtension, UnderlineExtension, StrikeExtension, HeadingExtension, BulletListExtension,
    OrderedListExtension, TaskListExtension, ImageExtension, MarkdownExtension, HardBreakExtension, LinkExtension,
    PlaceholderExtension, NodeFormattingExtension, TableExtension, BlockquoteExtension, CodeExtension, CodeBlockExtension,
    HorizontalRuleExtension, DropCursorExtension, GapCursorExtension, SubExtension, SupExtension, TextHighlightExtension,
    TextColorExtension, TextCaseExtension
} from "remirror/extensions";
import "remirror/styles/all.css";
import "@/styles/remirror.css"
import { cn, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PageData, PageSettings } from "@/types/afs-types";
import { generateId, processPageOverflows } from "@/lib/utils/afs-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatComponent } from "@/components/chat-component/for-remirror";
import { AiEditExtension } from "@/components/editor-remirror/extensions/ai-edit-extension";
import { EditorToolbar } from "@/components/editor-remirror/editor-toolbar";
import { TableContextMenu } from "@/components/editor-remirror/table-context-menu";
import { InlineAIPopup } from "@/components/editor-remirror/inline-ai-popup";



const defaultPageSettings: PageSettings = {
    orientation: "portrait",
    margins: { top: 10, right: 15, bottom: 10, left: 15 },
}



export function StepFullAFS({
    project_id,
    setIsSaving, setHasUnsavedChanges
}: { project_id: string | number, setIsSaving: (isSaving: boolean) => void, setHasUnsavedChanges: (hasUnsavedChanges: boolean) => void }) {
    // const [documentSettings, setDocumentSettings] = useState<DocumentSettings>({
    // 	orientation: "portrait",
    // 	pages: 
    // })

    const [currentPage, setCurrentPage] = useState(1)
    const [zoom, setZoom] = useState("100")
    const [isChatOpen, setIsChatOpen] = useState(true);
    const [pages, setPages] = useState<PageData[]>([])
    const [hasTableOfContents, setHasTableOfContents] = useState(false);
    const [hasUnsavedChangesInThisStep, setHasUnsavedChangesInThisStep] = useState(false);
    const [selection, setSelection] = useState<{ text: string, start: number, end: number } | null>(null);
    const [editingRange, setEditingRange] = useState<{ start: number, end: number } | null>(null);

    // // Computed full content for preview/export
    // const fullContent = useMemo(() => pages.map((p) => p.content).join("\n\n---\n\n"), [pages]);

    const { data: initialContent, isLoading, isError } = useQuery({
        queryKey: ["afs-default-content", project_id],
        queryFn: async () => {
            return fetch(`/api/afs?project_id=${project_id}`)
                .then(res => {
                    if (!res.ok) throw new Error("Failed to fetch")
                    return res.json()
                })
                .then(response => {
                    // console.log("Initial content:", response)
                    return response.content as string
                })
                .catch(error => {
                    console.error("Failed to fetch initial content:", error)
                    return "Hello World"
                })
        },
        // staleTime: Number.POSITIVE_INFINITY,
    })
    console.log("initialContent", initialContent)
    const { manager, state, setState } = useRemirror(
        {
            extensions: () => [
                new MarkdownExtension({ copyAsMarkdown: false }),
                new BoldExtension({}),
                new ItalicExtension({}),
                new UnderlineExtension(),
                new StrikeExtension({}),
                new HeadingExtension({}),
                new BulletListExtension({}),
                new OrderedListExtension(),
                new TaskListExtension(),
                new ImageExtension({ enableResizing: true }),
                new HardBreakExtension(),
                new LinkExtension({ autoLink: true }),
                new PlaceholderExtension({ placeholder: "Start writing..." }),
                new NodeFormattingExtension({}),
                new TableExtension({}),
                new BlockquoteExtension(),
                new CodeExtension({}),
                new CodeBlockExtension({}),
                new HorizontalRuleExtension({}),
                new DropCursorExtension({}),
                new GapCursorExtension(),
                new SubExtension(),
                new SupExtension(),
                new TextHighlightExtension({}),
                new TextColorExtension({}),
                new TextCaseExtension({}),
                new AiEditExtension(),
            ],
            content: initialContent,
            selection: "start",  // Remove this line
            stringHandler: "markdown",
        },
    );
    // Load content into editor when it arrives
    // Add this effect to push data into the editor once it's loaded
    useEffect(() => {
        if (initialContent && manager && !isLoading) {
            (async () => {
                // Create a new state from the markdown content
                const newState = manager.createState({
                    content: initialContent,
                    stringHandler: 'markdown',
                });

                // Update the editor state
                setState(newState);
            })();
        }
        // We only want to do this once when initialContent is first available
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialContent, isLoading, manager]);
    const handleContentChange = (parameter: { state: any, tr?: Transaction }) => {
        let nextState = parameter.state;

        // Check if the document content for the editor changed.
        if (parameter.tr?.docChanged) {
            // // Insert text into the editor via a new state.
            // nextState = state.applyTransaction(state.tr.insertText(' NO!!!')).state;


            setHasUnsavedChanges(true);
            setHasUnsavedChangesInThisStep(true);
        }

        // Update the state to the latest value.
        setState(nextState);
    }



    const performAutoSave = useCallback(async () => {
        setIsSaving(true)
        try {
            // const saveData = {
            //     content: fullContent,
            //     pages: pages,
            //     savedAt: new Date().toISOString(),
            // }
            // // localStorage.setItem("afs-draft", JSON.stringify(saveData));

            setHasUnsavedChanges(false)
            setHasUnsavedChangesInThisStep(false);
        } catch (error) {
            console.error("Auto-save failed:", error)
        } finally {
            setIsSaving(false)
        }
    }, [pages]);

    const updatePageSettings = (index: number, settings: PageSettings) => {
        // setPages((prev) => {
        //     const newPages = [...prev]
        //     newPages[index] = { ...newPages[index], settings }
        //     return newPages
        // })
        setHasUnsavedChanges(true);
        setHasUnsavedChangesInThisStep(true);
    }


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
            <Remirror
                manager={manager}
                state={state}
                onChange={handleContentChange}
            >
                {/* Chat panel - sits alongside entire Editor/Preview area */}
                <div
                    className={cn(
                        "h-full flex flex-col border-r bg-background transition-all duration-300 ease-in-out overflow-hidden shrink-0",
                        isChatOpen ? "w-[450px]" : "w-0 border-r-0"
                    )}
                >

                    <Activity mode={isChatOpen ? "visible" : "hidden"}>
                        <ChatComponent
                        // type="afs"
                        // project_id={project_id}
                        // llmContext={selection}
                        // currentPageMarkdown={pages[currentPage - 1]?.content || ""}
                        // setSelection={setSelection}
                        // setEditingRange={setEditingRange}
                        // // clearSelection={clearSelection}
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

                        {/* <StickyLexicalEditorToolbar
                        onPageUndo={handlePageUndo}
                        onPageRedo={handlePageRedo}
                        canPageUndo={canUndo}
                        canPageRedo={canRedo}
                    /> */}
                        <EditorToolbar />

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
                                                className="bg-primary/5 rounded-xl shadow-lg border overflow-hidden"
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
                                    className="flex-1 overflow-auto relative"
                                    style={{
                                        transform: `scale(${Number.parseInt(zoom) / 100})`,
                                        transformOrigin: "top center",
                                    }}
                                >
                                    <div className="max-w-4xl mx-auto px-16 py-6 bg-primary/5 rounded-xl mt-4 mb-16">
                                        <EditorComponent />
                                    </div>
                                    <InlineAIPopup />
                                </div>
                                <TableContextMenu />
                            </>
                        )
                    }
                </div>
            </Remirror>
        </div>
    )
}