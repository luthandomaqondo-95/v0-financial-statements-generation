"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import type { MDXEditorMethods } from "@mdxeditor/editor"
import { Button } from "@/components/ui/button"
import { Trash2, Plus, AlertCircle, ChevronUp, ChevronDown, Monitor, Smartphone, Scissors } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Dynamically import the editor to avoid SSR issues
const Editor = dynamic(() => import("@/components/mdx-editor"), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full flex items-center justify-center text-muted-foreground">Loading editor...</div>
    ),
})

export interface PageSettings {
    orientation: "portrait" | "landscape"
    margins: {
        top: number
        right: number
        bottom: number
        left: number
    }
}

interface PageEditorProps {
    content: string
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

// Constants for page break estimation
const LINE_HEIGHT_PX = 24 // Average line height in pixels
const CHAR_PER_LINE_PORTRAIT = 80
const CHAR_PER_LINE_LANDSCAPE = 110
const DEFAULT_MARGIN = 20 // Default margin in mm

// Helper function to find a good break point in content
export function findBreakPoint(content: string, maxLines: number, charPerLine: number, thresholdRatio: number = 0.75): { keepContent: string; overflowContent: string } | null {
    const lines = content.split('\n')
    let currentLines = 0
    let breakIndex = -1
    let inTable = false
    let inCodeBlock = false
    let tableStartIndex = -1
    let codeBlockStartIndex = -1
    let tableRowCount = 0

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmedLine = line.trim()

        // Track code blocks
        if (trimmedLine.startsWith('```')) {
            if (!inCodeBlock) {
                inCodeBlock = true
                codeBlockStartIndex = i
            } else {
                inCodeBlock = false
                codeBlockStartIndex = -1
            }
        }

        // Track tables (lines starting with |)
        if (trimmedLine.startsWith('|')) {
            if (!inTable) {
                inTable = true
                tableStartIndex = i
                tableRowCount = 0
            }
            tableRowCount++
        } else if (inTable && trimmedLine !== '' && !trimmedLine.startsWith('|')) {
            inTable = false
            tableStartIndex = -1
            tableRowCount = 0
        }

        // Calculate line contribution
        let lineContribution = 1
        if (trimmedLine === '') {
            lineContribution = 0.5
        } else if (trimmedLine.startsWith('#')) {
            lineContribution = 2
        } else if (trimmedLine.startsWith('|')) {
            lineContribution = 1.2
        } else {
            const wrappedLines = Math.ceil(line.length / charPerLine)
            lineContribution = Math.max(1, wrappedLines)
        }

        currentLines += lineContribution

        // Check if we've exceeded max lines
        if (currentLines > maxLines * thresholdRatio) { // Use thresholdRatio to leave buffer
            // Find the best break point
            if (inTable && tableStartIndex >= 0) {
                // If table is too large (more than 15 rows or started near beginning), break within the table
                if (tableRowCount > 15 || tableStartIndex < 3) {
                    // Break at the current table row (but not on header or separator)
                    // Find the last table row before current position that's not a separator
                    for (let j = i; j > tableStartIndex + 2; j--) {
                        const checkLine = lines[j].trim()
                        if (checkLine.startsWith('|') && !checkLine.includes('---') && !checkLine.includes('|-')) {
                            breakIndex = j
                            break
                        }
                    }
                    // If we couldn't find a good row, break before the table
                    if (breakIndex === -1 && tableStartIndex > 0) {
                        breakIndex = tableStartIndex
                    }
                } else if (tableStartIndex > 0) {
                    // Break before the table if it's small and we have content before it
                    breakIndex = tableStartIndex
                }
            } else if (inCodeBlock && codeBlockStartIndex > 0) {
                // Break before the code block
                breakIndex = codeBlockStartIndex
            }
            
            // If we still don't have a break point, find nearest paragraph break
            if (breakIndex === -1) {
                for (let j = i; j >= Math.max(0, i - 10); j--) {
                    const checkLine = lines[j].trim()
                    if (checkLine === '' || checkLine.startsWith('#')) {
                        breakIndex = j + 1
                        break
                    }
                }
            }
            
            // If still no break point, just break at current line
            if (breakIndex === -1) {
                breakIndex = i
            }
            break
        }
    }

    if (breakIndex > 0 && breakIndex < lines.length) {
        const keepContent = lines.slice(0, breakIndex).join('\n').trimEnd()
        let overflowContent = lines.slice(breakIndex).join('\n').trimStart()
        
        // If we broke inside a table, prepend the table header to overflow content
        if (tableStartIndex >= 0 && breakIndex > tableStartIndex + 2) {
             // Check if we have a valid header structure (row + separator)
             if (lines.length > tableStartIndex + 1 && 
                 (lines[tableStartIndex+1].includes('---') || lines[tableStartIndex+1].includes('|-'))) {
                 
                 // Capture header
                 const header = lines.slice(tableStartIndex, tableStartIndex + 2).join('\n')
                 overflowContent = header + '\n' + overflowContent
             }
        }
        
        if (overflowContent.trim().length > 0) {
            return { keepContent, overflowContent }
        }
    }

    return null
}

// Helper to estimate if content will overflow a page
export function estimateOverflow(content: string, orientation: "portrait" | "landscape" = "portrait"): boolean {
    const PAGE_HEIGHT_MM = orientation === "portrait" ? 297 : 210
    const pageHeightPx = (PAGE_HEIGHT_MM * 96) / 25.4
    const marginPx = (DEFAULT_MARGIN * 96) / 25.4
    const availableHeightPx = pageHeightPx - (marginPx * 2) - 40
    const maxLines = Math.floor(availableHeightPx / LINE_HEIGHT_PX)
    const charPerLine = orientation === "portrait" ? CHAR_PER_LINE_PORTRAIT : CHAR_PER_LINE_LANDSCAPE

    let totalLines = 0
    content.split('\n').forEach(line => {
        const trimmedLine = line.trim()
        if (trimmedLine === '') {
            totalLines += 0.5
        } else if (trimmedLine.startsWith('#')) {
            totalLines += 2
        } else if (trimmedLine.startsWith('|')) {
            totalLines += 1.2
        } else {
            totalLines += Math.max(1, Math.ceil(line.length / charPerLine))
        }
    })

    // Use 0.75 threshold to be more aggressive about catching overflows
    // This accounts for rendering differences between estimation and actual DOM
    return totalLines > maxLines * 0.75
}

// Helper to get max lines for a page
export function getMaxLines(orientation: "portrait" | "landscape" = "portrait"): number {
    const PAGE_HEIGHT_MM = orientation === "portrait" ? 297 : 210
    const pageHeightPx = (PAGE_HEIGHT_MM * 96) / 25.4
    const marginPx = (DEFAULT_MARGIN * 96) / 25.4
    const availableHeightPx = pageHeightPx - (marginPx * 2) - 40
    return Math.floor(availableHeightPx / LINE_HEIGHT_PX)
}

// Helper to get char per line for orientation
export function getCharPerLine(orientation: "portrait" | "landscape" = "portrait"): number {
    return orientation === "portrait" ? CHAR_PER_LINE_PORTRAIT : CHAR_PER_LINE_LANDSCAPE
}

export function PageEditor({
    content,
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
        // Use effectiveLimit if available, otherwise use maxLines
        // Use a higher threshold (0.95) when using effectiveLimit since it's based on actual content
        const limit = effectiveLimit > 0 ? effectiveLimit : maxLines
        const ratio = effectiveLimit > 0 ? 0.95 : 0.75
        
        const breakResult = findBreakPoint(content, limit, charPerLine, ratio)

        if (breakResult) {
            onSplitOverflow(breakResult.keepContent, breakResult.overflowContent)
        }
    }, [content, isOverflowing, maxLines, effectiveLimit, onSplitOverflow, settings.orientation])

    // Auto-split overflow content
    useEffect(() => {
        if (isOverflowing && canSplit && onSplitOverflow) {
            const timer = setTimeout(() => {
                handleSplitOverflow()
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [isOverflowing, canSplit, handleSplitOverflow, onSplitOverflow])

    useEffect(() => {
        const checkOverflow = () => {
            if (containerRef.current) {
                // Calculate page dimensions
                const pageHeightPx = (PAGE_HEIGHT_MM * 96) / 25.4
                const marginTopPx = (DEFAULT_MARGIN * 96) / 25.4
                const marginBottomPx = (DEFAULT_MARGIN * 96) / 25.4
                const availableHeightPx = pageHeightPx - marginTopPx - marginBottomPx - 40 // 40px for footer

                // Estimate lines based on content
                const charPerLine = settings.orientation === "portrait" ? CHAR_PER_LINE_PORTRAIT : CHAR_PER_LINE_LANDSCAPE
                
                // Account for wrapped lines
                let totalEstimatedLines = 0
                content.split('\n').forEach(line => {
                    if (line.trim() === '') {
                        totalEstimatedLines += 0.5 // Empty lines take less space
                    } else if (line.startsWith('#')) {
                        totalEstimatedLines += 2 // Headers take more space
                    } else if (line.startsWith('|')) {
                        totalEstimatedLines += 1.2 // Table rows
                    } else if (line.startsWith('```')) {
                        totalEstimatedLines += 1 // Code block markers
                    } else {
                        // Regular text - estimate wrapping
                        const wrappedLines = Math.ceil(line.length / charPerLine)
                        totalEstimatedLines += Math.max(1, wrappedLines)
                    }
                })

                const calculatedMaxLines = Math.floor(availableHeightPx / LINE_HEIGHT_PX)
                setMaxLines(calculatedMaxLines)
                setEstimatedLines(Math.round(totalEstimatedLines))
                
                // Check actual overflow using DOM
                const contentHeight = containerRef.current.scrollHeight
                const hasOverflow = contentHeight > pageHeightPx + 5 // 5px tolerance
                setIsOverflowing(hasOverflow)

                // Calculate effective limit based on actual content height if overflowing
                let currentEffectiveLimit = 0
                if (hasOverflow && totalEstimatedLines > 0) {
                    // Calculate ratio of available space to content height
                    const ratio = pageHeightPx / contentHeight
                    // The effective capacity in "estimated lines" is the total lines * ratio
                    currentEffectiveLimit = totalEstimatedLines * ratio
                }
                setEffectiveLimit(currentEffectiveLimit)

                // Check if we can split the content
                if (hasOverflow) {
                    const limit = currentEffectiveLimit > 0 ? currentEffectiveLimit : calculatedMaxLines
                    const ratio = currentEffectiveLimit > 0 ? 0.95 : 0.75
                    const breakResult = findBreakPoint(content, limit, charPerLine, ratio)
                    setCanSplit(breakResult !== null)
                } else {
                    setCanSplit(false)
                }
            }
        }

        checkOverflow()

        const resizeObserver = new ResizeObserver(checkOverflow)
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current)
        }

        return () => resizeObserver.disconnect()
    }, [content, settings, PAGE_HEIGHT_MM])

    const handleOrientationChange = (value: string) => {
        onSettingsChange({
            ...settings,
            orientation: value as "portrait" | "landscape",
        })
    }

    return (
        <div className="relative group mb-12 last:mb-0 flex flex-col items-center">
            {/* Page Header / Controls */}
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
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Move Up/Down Buttons */}
                    {onMoveUp && pageNumber > 1 && (
                        <TooltipProvider>
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
                        </TooltipProvider>
                    )}
                    {onMoveDown && pageNumber < totalPages && (
                        <TooltipProvider>
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

                    {/* Add Page Button */}
                    <TooltipProvider>
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
                    </TooltipProvider>

                    {/* Delete Page Button */}
                    {totalPages > 1 && (
                        <TooltipProvider>
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
                        </TooltipProvider>
                    )}
                </div>
            </div>

            {/* Page Container - Always Light Mode */}
            <div
                className={cn(
                    "bg-white text-gray-900 shadow-lg transition-all duration-300 relative",
                    isOverflowing && "ring-2 ring-destructive ring-offset-2",
                )}
                style={{
                    width: `${PAGE_WIDTH_MM}mm`,
                    height: `${PAGE_HEIGHT_MM}mm`,
                }}
            >
                {/* Editor Wrapper with sticky toolbar support */}
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
                            </TooltipProvider>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}