"use client"

import { useRef, useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Trash2, Plus, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Dynamically import the editor to avoid SSR issues
const Editor = dynamic(() => import("@/components/mdx-editor"), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full flex items-center justify-center text-muted-foreground">Loading editor...</div>
    ),
})

interface PageEditorProps {
    content: string
    onChange: (content: string) => void
    pageNumber: number
    totalPages: number
    onDelete: () => void
    onAddNext: () => void
    orientation: "portrait" | "landscape"
}

export function PageEditor({
    content,
    onChange,
    pageNumber,
    totalPages,
    onDelete,
    onAddNext,
    orientation,
}: PageEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isOverflowing, setIsOverflowing] = useState(false)

    // A4 dimensions in mm
    const PAGE_HEIGHT_MM = orientation === "portrait" ? 297 : 210

    useEffect(() => {
        const checkOverflow = () => {
            if (containerRef.current) {
                // We check if the content height exceeds the page height
                // We allow a small buffer (e.g., 5px) to avoid false positives due to rounding
                const contentHeight = containerRef.current.scrollHeight
                const pageHeightPx = (PAGE_HEIGHT_MM * 96) / 25.4 // Convert mm to px (approx)

                setIsOverflowing(contentHeight > pageHeightPx + 5)
            }
        }

        // Check initially and set up observer
        checkOverflow()

        const resizeObserver = new ResizeObserver(checkOverflow)
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current)
        }

        return () => resizeObserver.disconnect()
    }, [content, orientation, PAGE_HEIGHT_MM])

    return (
        <div className="relative group mb-12 last:mb-0 flex flex-col items-center">
            {/* Page Header / Controls */}
            <div className="w-full flex items-center justify-between mb-2 px-2 max-w-[210mm]">
                <div className="text-sm font-medium text-muted-foreground">
                    Page {pageNumber} of {totalPages}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {totalPages > 1 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDelete}
                            className="h-8 text-destructive hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete Page
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={onAddNext} className="h-8 bg-transparent">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Page
                    </Button>
                </div>
            </div>

            {/* Page Container */}
            <div
                className={cn(
                    "bg-background shadow-lg transition-all duration-300 relative",
                    orientation === "portrait" ? "w-[210mm] h-[297mm]" : "w-[297mm] h-[210mm]",
                    isOverflowing && "ring-2 ring-destructive ring-offset-2",
                )}
            >
                {/* Editor Wrapper with fixed height and overflow visible (or hidden/scroll based on preference) 
            We keep overflow visible inside the container, but the container itself has fixed size.
        */}
                <div ref={containerRef} className="h-full w-full overflow-hidden">
                    <Editor
                        markdown={content}
                        onChange={onChange}
                        containerClassName="border-none h-full bg-transparent"
                        contentEditableClassName="prose dark:prose-invert max-w-none p-[20mm] min-h-full outline-none"
                    />
                </div>

                {/* Page Number Footer (Visual) */}
                <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                    <span className="text-[10px] text-gray-400">Page {pageNumber}</span>
                </div>

                {/* Overflow Indicator */}
                {isOverflowing && (
                    <div className="absolute -right-12 top-10">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full animate-pulse">
                                        <AlertCircle className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                    <p>Content exceeds page limits.</p>
                                    <p className="text-xs opacity-80 mt-1">Move some content to the next page.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                )}
            </div>
        </div>
    )
}
