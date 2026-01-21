"use client"

import { useRef, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Trash2, Plus, AlertCircle, ChevronUp, ChevronDown, Monitor, Smartphone, Scissors } from "lucide-react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { TRANSFORMERS } from "@lexical/markdown";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import type { EditorState, LexicalEditor, RangeSelection } from "lexical";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CHAR_PER_LINE_LANDSCAPE, CHAR_PER_LINE_PORTRAIT, DEFAULT_MARGIN, findBreakPoint, LINE_HEIGHT_PX } from "@/lib/utils/afs-utils";
import { PageSettings } from "@/types/afs-types";
import { MarkdownConverterPlugin } from "./plugins/Markdown-Converter-Plugin";
import { EditorRefPlugin } from "./plugins/EditorRefPlugin";
import { TextSelectionPlugin } from "./plugins/TextSelectionPlugin";
import { TableOfContentsPlugin } from "./plugins/TableOfContentsPlugin";
import { HeadingAttributePlugin } from "./plugins/HeadingAttributePlugin";
import { AIEditPlugin } from "./plugins/AIEditPlugin";
import { TableOfContentsNode } from "./nodes/TableOfContentsNode";

const editorConfig = {
    namespace: "PageEditor",
    theme: {
        paragraph: "mb-2 text-gray-900",
        heading: {
            h1: "text-3xl font-bold mb-4 text-gray-900",
            h2: "text-2xl font-bold mb-3 text-gray-900",
            h3: "text-xl font-bold mb-2 text-gray-900",
        },
        list: {
            ul: "list-disc list-inside mb-2 text-gray-900",
            ol: "list-decimal list-inside mb-2 text-gray-900",
            listitem: "ml-4 text-gray-800",
        },
        link: "text-blue-600 underline",
        text: {
            bold: "font-bold",
            italic: "italic",
            underline: "underline",
            code: "bg-gray-100 px-1 rounded text-sm font-mono",
        },
        quote: "border-l-4 border-gray-300 pl-4 italic text-gray-700 my-2",
        code: "bg-gray-100 p-2 rounded font-mono text-sm my-2 block",
    },
    nodes: [
        HeadingNode, ListNode, ListItemNode, QuoteNode, CodeNode, LinkNode, TableNode, TableCellNode, TableRowNode,
        TableOfContentsNode,
        // ImageNode, VideoNode,
    ],
    onError: (error: Error) => {
        console.error("Lexical error:", error);
        toast.error("Lexical error:", {
            description: error.message,
        });
    },
};


interface LexicalPageEditorProps {
    content: string;
    onChange: (content: string) => void;
    onTextSelection: (selection: RangeSelection) => void;
    pageNumber: number;
    totalPages: number;
    onDelete: () => void;
    onAddNext: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    settings: PageSettings;
    onSettingsChange: (settings: PageSettings) => void;
    hideToolbar?: boolean;
    onEditorFocus?: (ref: React.RefObject<LexicalEditor | null>, pageIndex: number) => void;
    onSplitOverflow?: (currentContent: string, overflowContent: string) => void;
}

export function LexicalPageEditor({
    content,
    onChange,
    onTextSelection,
    pageNumber,
    totalPages,
    onDelete,
    onAddNext,
    onMoveUp,
    onMoveDown,
    settings,
    onSettingsChange,
    hideToolbar = false,
    onEditorFocus,
    onSplitOverflow,
}: LexicalPageEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<LexicalEditor>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [estimatedLines, setEstimatedLines] = useState(0);
    const [maxLines, setMaxLines] = useState(0);
    const [effectiveLimit, setEffectiveLimit] = useState(0);
    const [canSplit, setCanSplit] = useState(false);

    const handleFocus = useCallback(() => {
        if (onEditorFocus && editorRef.current) {
            onEditorFocus(editorRef as React.RefObject<LexicalEditor | null>, pageNumber - 1);
        }
    }, [onEditorFocus, pageNumber]);

    // A4 dimensions in mm
    const PAGE_WIDTH_MM = settings.orientation === "portrait" ? 210 : 297;
    const PAGE_HEIGHT_MM = settings.orientation === "portrait" ? 297 : 210;

    // Handle editor change
    const handleEditorChange = useCallback((editorState: EditorState) => {
        // Content is tracked via MarkdownConverterPlugin
    }, []);

    // Handle splitting overflow content
    const handleSplitOverflow = useCallback(() => {
        if (!onSplitOverflow || !isOverflowing) return;

        const charPerLine = settings.orientation === "portrait" ? CHAR_PER_LINE_PORTRAIT : CHAR_PER_LINE_LANDSCAPE;
        const limit = effectiveLimit > 0 ? effectiveLimit : maxLines;
        const ratio = effectiveLimit > 0 ? 0.95 : 0.75;

        const breakResult = findBreakPoint(content, limit, charPerLine, ratio);

        if (breakResult) {
            onSplitOverflow(breakResult.keepContent, breakResult.overflowContent);
        }
    }, [content, isOverflowing, maxLines, effectiveLimit, onSplitOverflow, settings.orientation]);

    const handleOrientationChange = (value: string) => {
        onSettingsChange({
            ...settings,
            orientation: value as "portrait" | "landscape",
        });
    };

    // Auto-split overflow content
    useEffect(() => {
        if (isOverflowing && canSplit && onSplitOverflow) {
            const timer = setTimeout(() => {
                handleSplitOverflow();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isOverflowing, canSplit, handleSplitOverflow, onSplitOverflow]);

    useEffect(() => {
        const checkOverflow = () => {
            if (containerRef.current) {
                const pageHeightPx = (PAGE_HEIGHT_MM * 96) / 25.4;
                const marginTopPx = (DEFAULT_MARGIN * 96) / 25.4;
                const marginBottomPx = (DEFAULT_MARGIN * 96) / 25.4;
                const availableHeightPx = pageHeightPx - marginTopPx - marginBottomPx - 40;

                const charPerLine = settings.orientation === "portrait" ? CHAR_PER_LINE_PORTRAIT : CHAR_PER_LINE_LANDSCAPE;

                let totalEstimatedLines = 0;
                content.split('\n').forEach(line => {
                    if (line.trim() === '') {
                        totalEstimatedLines += 0.5;
                    } else if (line.startsWith('#')) {
                        totalEstimatedLines += 2;
                    } else if (line.startsWith('|')) {
                        totalEstimatedLines += 1.2;
                    } else if (line.startsWith('```')) {
                        totalEstimatedLines += 1;
                    } else {
                        const wrappedLines = Math.ceil(line.length / charPerLine);
                        totalEstimatedLines += Math.max(1, wrappedLines);
                    }
                });

                const calculatedMaxLines = Math.floor(availableHeightPx / LINE_HEIGHT_PX);
                setMaxLines(calculatedMaxLines);
                setEstimatedLines(Math.round(totalEstimatedLines));

                const contentHeight = containerRef.current.scrollHeight;
                const hasOverflow = contentHeight > pageHeightPx + 5;
                setIsOverflowing(hasOverflow);

                let currentEffectiveLimit = 0;
                if (hasOverflow && totalEstimatedLines > 0) {
                    const ratio = pageHeightPx / contentHeight;
                    currentEffectiveLimit = totalEstimatedLines * ratio;
                }
                setEffectiveLimit(currentEffectiveLimit);

                if (hasOverflow) {
                    const limit = currentEffectiveLimit > 0 ? currentEffectiveLimit : calculatedMaxLines;
                    const ratio = currentEffectiveLimit > 0 ? 0.95 : 0.75;
                    const breakResult = findBreakPoint(content, limit, charPerLine, ratio);
                    setCanSplit(breakResult !== null);
                } else {
                    setCanSplit(false);
                }
            }
        };

        checkOverflow();

        const resizeObserver = new ResizeObserver(checkOverflow);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => resizeObserver.disconnect();
    }, [content, settings, PAGE_HEIGHT_MM]);

    return (
        <div className="relative group mb-12 last:mb-0 flex flex-col items-center">
            {/* Page Header / Controls */}
            <div className="w-full flex items-center justify-between mb-2 px-2" style={{ maxWidth: `${PAGE_WIDTH_MM}mm` }}>
                <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-muted-foreground">
                        Page {pageNumber} of {totalPages}
                    </div>
                    {isOverflowing && (
                        <span className="text-xs text-destructive">
                            ~{estimatedLines} lines / {maxLines} max
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onMoveUp && pageNumber > 1 && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon-sm" onClick={onMoveUp} className="h-8 w-8">
                                        <ChevronUp className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Move page up</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    {onMoveDown && pageNumber < totalPages && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon-sm" onClick={onMoveDown} className="h-8 w-8">
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Move page down</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    <div className="w-px h-6 bg-border mx-1" />

                    {/* Orientation Toggle */}
                    <Tabs value={settings.orientation} onValueChange={handleOrientationChange}>
                        <TabsList className="h-8 p-1">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <TabsTrigger value="portrait" className="h-6 px-2">
                                            <Smartphone className="h-4 w-4" />
                                        </TabsTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>Portrait</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <TabsTrigger value="landscape" className="h-6 px-2">
                                            <Monitor className="h-4 w-4" />
                                        </TabsTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>Landscape</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </TabsList>
                    </Tabs>

                    <div className="w-px h-6 bg-border mx-1" />

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon-sm" onClick={onAddNext} className="h-8 w-8">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Add page after</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {totalPages > 1 && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon-sm" onClick={onDelete} className="h-8 w-8 text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete page</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </div>

            {/* Page Container */}
            <div
                className={cn(
                    "bg-white text-gray-900 shadow-lg transition-all duration-300 relative",
                    isOverflowing && "ring-2 ring-destructive ring-offset-2"
                )}
                style={{
                    width: `${PAGE_WIDTH_MM}mm`,
                    height: `${PAGE_HEIGHT_MM}mm`,
                }}
            >
                <div ref={containerRef} className="h-full w-full page-editor-container" onFocus={handleFocus} onClick={handleFocus}>
                    <LexicalComposer initialConfig={editorConfig}>
                        <div className="h-full w-full relative">
                            <RichTextPlugin
                                contentEditable={
                                    <ContentEditable
                                        className={cn(
                                            "outline-none h-full prose max-w-none",
                                            "text-gray-900 [&_*]:text-gray-900",
                                            "[&_h1]:text-gray-900 [&_h2]:text-gray-900 [&_h3]:text-gray-900",
                                            "[&_p]:text-gray-800 [&_li]:text-gray-800",
                                            "[&_table]:text-gray-900 [&_th]:text-gray-900 [&_td]:text-gray-800"
                                        )}
                                        style={{
                                            paddingTop: `${DEFAULT_MARGIN}mm`,
                                            paddingRight: `${DEFAULT_MARGIN}mm`,
                                            paddingBottom: `${DEFAULT_MARGIN}mm`,
                                            paddingLeft: `${DEFAULT_MARGIN}mm`,
                                        }}
                                    />
                                }
                                placeholder={
                                    <div className="absolute pointer-events-none text-muted-foreground" style={{ top: `${DEFAULT_MARGIN}mm`, left: `${DEFAULT_MARGIN}mm` }}>
                                        Start typing...
                                    </div>
                                }
                                ErrorBoundary={LexicalErrorBoundary}
                            />
                            <HistoryPlugin />
                            <ListPlugin />
                            <LinkPlugin />
                            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                            <OnChangePlugin onChange={handleEditorChange} />
                            <MarkdownConverterPlugin onMarkdownChange={onChange} initialMarkdown={content} />
                            <TextSelectionPlugin onTextSelection={onTextSelection} />
                            <TableOfContentsPlugin />
                            <HeadingAttributePlugin />
                            <AIEditPlugin />
                            <EditorRefPlugin 
                                editorRef={editorRef} 
                                onEditorFocus={onEditorFocus} 
                                pageIndex={pageNumber - 1} 
                            />
                        </div>
                    </LexicalComposer>
                </div>

                {/* Page Number Footer */}
                <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                    <span className="text-[10px] text-gray-400">
                        Page {pageNumber} of {totalPages}
                    </span>
                </div>

                {/* Overflow Indicator */}
                {isOverflowing && (
                    <div className="absolute -right-14 top-10 flex flex-col gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full animate-pulse">
                                        <AlertCircle className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                    <p>Content exceeds page limits.</p>
                                    <p className="text-xs opacity-80 mt-1">
                                        ~{estimatedLines} lines used, max ~{maxLines} lines.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        {canSplit && onSplitOverflow && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white" onClick={handleSplitOverflow}>
                                            <Scissors className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-xs">
                                        <p>Split overflow to next page</p>
                                        <p className="text-xs opacity-80 mt-1">
                                            Automatically move overflow content to a new page.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

