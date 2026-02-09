"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import type { MDXEditorMethods } from "@mdxeditor/editor"
import { Button } from "@/components/ui/button"
import { Trash2, Plus, AlertCircle, ChevronUp, ChevronDown, Monitor, Smartphone, Scissors } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CHAR_PER_LINE_LANDSCAPE, CHAR_PER_LINE_PORTRAIT, DEFAULT_MARGIN, findBreakPoint, LINE_HEIGHT_PX } from "@/lib/utils/afs-utils"
import { PageSettings } from "@/types/afs-types"

// Dynamically import the editor to avoid SSR issues
const Editor = dynamic(() => import("@/components/editor-mdx"), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full flex items-center justify-center text-muted-foreground">Loading editor...</div>
    ),
})

interface PageEditorProps {
    content: string
    onTextSelection: (selection: any) => void;
    onBlockTypeChange?: (blockType: string) => void;
    onChange: (content: string) => void
    pageNumber: number
    totalPages: number
    onDelete: () => void
    onAddNext: () => void
    onMoveUp?: () => void
    onMoveDown?: () => void
    settings: PageSettings
    onSettingsChange: (settings: PageSettings) => void
    hideToolbar?: boolean
    onEditorFocus?: (ref: React.RefObject<MDXEditorMethods | null>, pageIndex: number) => void
    onSplitOverflow?: (currentContent: string, overflowContent: string) => void
}

function PageEditorInner({
    content,
    onTextSelection,
    onBlockTypeChange,
    onChange,
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
}: PageEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const editorRef = useRef<MDXEditorMethods>(null)
    const [isOverflowing, setIsOverflowing] = useState(false)
    const [estimatedLines, setEstimatedLines] = useState(0)
    const [maxLines, setMaxLines] = useState(0)
    const [effectiveLimit, setEffectiveLimit] = useState(0)
    const [canSplit, setCanSplit] = useState(false)

    // Refs for debounced overflow checking
    const overflowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const resizeThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleFocus = useCallback(() => {
        if (onEditorFocus) {
            onEditorFocus(editorRef, pageNumber - 1)
        }
    }, [onEditorFocus, pageNumber])

    // A4 dimensions in mm
    const PAGE_WIDTH_MM = settings.orientation === "portrait" ? 210 : 297
    const PAGE_HEIGHT_MM = settings.orientation === "portrait" ? 297 : 210

    // Handle splitting overflow content
    const handleSplitOverflow = useCallback(() => {
        if (!onSplitOverflow || !isOverflowing) return

        const charPerLine = settings.orientation === "portrait" ? CHAR_PER_LINE_PORTRAIT : CHAR_PER_LINE_LANDSCAPE
        const limit = effectiveLimit > 0 ? effectiveLimit : maxLines
        const ratio = effectiveLimit > 0 ? 0.95 : 0.75

        const breakResult = findBreakPoint(content, limit, charPerLine, ratio)

        if (breakResult) {
            onSplitOverflow(breakResult.keepContent, breakResult.overflowContent)
        }
    }, [content, isOverflowing, maxLines, effectiveLimit, onSplitOverflow, settings.orientation]);

    const handleOrientationChange = useCallback((value: string) => {
        onSettingsChange({
            ...settings,
            orientation: value as "portrait" | "landscape",
        })
    }, [settings, onSettingsChange]);

    /**
     * Core overflow check logic -- measures DOM and estimates line usage.
     * Called via debounce/idle scheduling, never synchronously on keystroke.
     */
    const checkOverflow = useCallback(() => {
        if (!containerRef.current) return

        const pageHeightPx = (PAGE_HEIGHT_MM * 96) / 25.4
        const marginTopPx = (DEFAULT_MARGIN * 96) / 25.4
        const marginBottomPx = (DEFAULT_MARGIN * 96) / 25.4
        const availableHeightPx = pageHeightPx - marginTopPx - marginBottomPx - 40

        const charPerLine = settings.orientation === "portrait" ? CHAR_PER_LINE_PORTRAIT : CHAR_PER_LINE_LANDSCAPE

        let totalEstimatedLines = 0
        content.split('\n').forEach(line => {
            if (line.trim() === '') {
                totalEstimatedLines += 0.5
            } else if (line.startsWith('#')) {
                totalEstimatedLines += 2
            } else if (line.startsWith('|')) {
                totalEstimatedLines += 1.2
            } else if (line.startsWith('```')) {
                totalEstimatedLines += 1
            } else {
                const wrappedLines = Math.ceil(line.length / charPerLine)
                totalEstimatedLines += Math.max(1, wrappedLines)
            }
        })

        const calculatedMaxLines = Math.floor(availableHeightPx / LINE_HEIGHT_PX)
        setMaxLines(calculatedMaxLines)
        setEstimatedLines(Math.round(totalEstimatedLines))

        const contentHeight = containerRef.current.scrollHeight
        const hasOverflow = contentHeight > pageHeightPx + 5
        setIsOverflowing(hasOverflow)

        let currentEffectiveLimit = 0
        if (hasOverflow && totalEstimatedLines > 0) {
            const ratio = pageHeightPx / contentHeight
            currentEffectiveLimit = totalEstimatedLines * ratio
        }
        setEffectiveLimit(currentEffectiveLimit)

        if (hasOverflow) {
            const limit = currentEffectiveLimit > 0 ? currentEffectiveLimit : calculatedMaxLines
            const ratio = currentEffectiveLimit > 0 ? 0.95 : 0.75
            const breakResult = findBreakPoint(content, limit, charPerLine, ratio)
            setCanSplit(breakResult !== null)
        } else {
            setCanSplit(false)
        }
    }, [content, settings.orientation, PAGE_HEIGHT_MM]);

    /**
     * Schedule an overflow check using requestIdleCallback (with setTimeout fallback).
     * Debounced at 500ms so it never interrupts typing.
     */
    const scheduleOverflowCheck = useCallback(() => {
        if (overflowTimerRef.current) clearTimeout(overflowTimerRef.current)
        overflowTimerRef.current = setTimeout(() => {
            const idle = typeof window !== "undefined" && window.requestIdleCallback
                ? window.requestIdleCallback
                : (cb: () => void) => setTimeout(cb, 50)
            idle(() => checkOverflow())
        }, 500)
    }, [checkOverflow])

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (overflowTimerRef.current) clearTimeout(overflowTimerRef.current)
            if (resizeThrottleRef.current) clearTimeout(resizeThrottleRef.current)
        }
    }, [])

    // Schedule overflow check when content or settings change
    useEffect(() => {
        scheduleOverflowCheck()
    }, [scheduleOverflowCheck])

    // Throttled ResizeObserver -- fires at most once per 500ms
    useEffect(() => {
        if (!containerRef.current) return

        const resizeObserver = new ResizeObserver(() => {
            if (resizeThrottleRef.current) return // Already scheduled
            resizeThrottleRef.current = setTimeout(() => {
                resizeThrottleRef.current = null
                checkOverflow()
            }, 500)
        })

        resizeObserver.observe(containerRef.current)
        return () => resizeObserver.disconnect()
    }, [checkOverflow]);

    return (
        <div className="relative group mb-12 last:mb-0 flex flex-col items-center">
            {/* Page Header / Controls -- single TooltipProvider for all buttons */}
            <div
                className="w-full flex items-center justify-between mb-2 px-2"
                style={{ maxWidth: `${PAGE_WIDTH_MM}mm` }}
            >
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
                <TooltipProvider>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Move Up/Down Buttons */}
                        {onMoveUp && pageNumber > 1 && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={onMoveUp}
                                        className="h-8 w-8"
                                    >
                                        <ChevronUp className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Move page up</TooltipContent>
                            </Tooltip>
                        )}
                        {onMoveDown && pageNumber < totalPages && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={onMoveDown}
                                        className="h-8 w-8"
                                    >
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Move page down</TooltipContent>
                            </Tooltip>
                        )}

                        <div className="w-px h-6 bg-border mx-1" />

                        {/* Orientation Toggle */}
                        <Tabs value={settings.orientation} onValueChange={handleOrientationChange}>
                            <TabsList className="h-8 p-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <TabsTrigger value="portrait" className="h-6 px-2">
                                            <Smartphone className="h-4 w-4" />
                                        </TabsTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>Portrait</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <TabsTrigger value="landscape" className="h-6 px-2">
                                            <Monitor className="h-4 w-4" />
                                        </TabsTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>Landscape</TooltipContent>
                                </Tooltip>
                            </TabsList>
                        </Tabs>

                        <div className="w-px h-6 bg-border mx-1" />

                        {/* Add Page Button */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={onAddNext}
                                    className="h-8 w-8"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Add page after</TooltipContent>
                        </Tooltip>

                        {/* Delete Page Button */}
                        {totalPages > 1 && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={onDelete}
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete page</TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                </TooltipProvider>
            </div>

            {/* Page Container - Always Light Mode */}
            <div
                className={cn(
                    "bg-white shadow-lg transition-all duration-300 relative",
                    isOverflowing && "ring-2 ring-destructive ring-offset-2",
                )}
                style={{
                    width: `${PAGE_WIDTH_MM}mm`,
                    height: `${PAGE_HEIGHT_MM}mm`,
                }}
            >
                {/* Editor Wrapper */}
                <div
                    ref={containerRef}
                    className="h-full w-full page-editor-container"
                    onFocus={handleFocus}
                    onClick={handleFocus}
                >
                    <Editor
                        ref={editorRef}
                        markdown={content}
                        onChange={onChange}
                        onTextSelection={onTextSelection}
                        onBlockTypeChange={onBlockTypeChange}
                        hideToolbar={hideToolbar}
                        containerClassName={cn(
                            "border-none h-full bg-transparent",
                            hideToolbar ? "page-editor-mdx-no-toolbar" : "page-editor-mdx",
                        )}
                        contentEditableClassName={cn(
                            "prose max-w-none min-h-full outline-none",
                            "text-gray-900 [&_*]:text-gray-900",
                            "[&_h1]:text-gray-900 [&_h2]:text-gray-900 [&_h3]:text-gray-900",
                            "[&_p]:text-gray-800 [&_li]:text-gray-800",
                            "[&_table]:text-gray-900 [&_th]:text-gray-900 [&_td]:text-gray-800",
                        )}
                        style={{
                            paddingTop: `${DEFAULT_MARGIN}mm`,
                            paddingRight: `${DEFAULT_MARGIN}mm`,
                            paddingBottom: `${DEFAULT_MARGIN}mm`,
                            paddingLeft: `${DEFAULT_MARGIN}mm`,
                        }}
                    />
                </div>

                {/* Page Number Footer (Visual) */}
                <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                    <span className="text-[10px] text-gray-400">Page {pageNumber} of {totalPages}</span>
                </div>

                {/* Overflow Indicator -- single TooltipProvider */}
                {isOverflowing && (
                    <TooltipProvider>
                        <div className="absolute -right-14 top-10 flex flex-col gap-2">
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
                            {canSplit && onSplitOverflow && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                                            onClick={handleSplitOverflow}
                                        >
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
                            )}
                        </div>
                    </TooltipProvider>
                )}
            </div>
        </div>
    )
}

/**
 * Memoized PageEditor -- only re-renders when its own content/props change.
 * This prevents the render cascade where editing page 3 re-renders pages 1, 2, 4, 5, etc.
 */
export const PageEditor = React.memo(PageEditorInner, (prev, next) => {
    return (
        prev.content === next.content &&
        prev.pageNumber === next.pageNumber &&
        prev.totalPages === next.totalPages &&
        prev.settings.orientation === next.settings.orientation &&
        prev.hideToolbar === next.hideToolbar
    )
})
