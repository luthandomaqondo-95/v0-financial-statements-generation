"use client"

import { useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useEditorContext } from "@/components/mdx-editor/editor-context"
import { Bold, Italic, Underline, Undo2, Redo2, List, ListOrdered, Link, Table, Minus, Type, Heading1, Heading2, Heading3, Heading4, Pilcrow, Quote } from "lucide-react"
import { cn } from "@/lib/utils"

type BlockType = "paragraph" | "heading1" | "heading2" | "heading3" | "heading4" | "quote"

interface StickyEditorToolbarProps {
    className?: string
}

export function StickyEditorToolbar({ className }: StickyEditorToolbarProps) {
    const { activeEditorRef, activePageIndex } = useEditorContext()

    const executeCommand = useCallback((command: string, value?: string) => {
        if (!activeEditorRef?.current) return

        // MDXEditor uses different methods for different commands
        const editor = activeEditorRef.current

        // Get selection and apply formatting
        // MDXEditor doesn't expose direct format methods, so we need to use insertMarkdown or other approaches
        // For now, we'll focus on the most common operations
        switch (command) {
            case "undo":
                // MDXEditor handles undo/redo internally
                document.execCommand("undo")
                break
            case "redo":
                document.execCommand("redo")
                break
            case "bold":
                document.execCommand("bold")
                break
            case "italic":
                document.execCommand("italic")
                break
            case "underline":
                document.execCommand("underline")
                break
            case "insertUnorderedList":
                document.execCommand("insertUnorderedList")
                break
            case "insertOrderedList":
                document.execCommand("insertOrderedList")
                break
            case "formatBlock":
                if (value) {
                    document.execCommand("formatBlock", false, value)
                }
                break
            case "insertHorizontalRule":
                // Insert thematic break in markdown
                const currentContent = editor.getMarkdown()
                editor.setMarkdown(currentContent + "\n\n---\n\n")
                break
        }
    }, [activeEditorRef])

    const handleBlockTypeChange = useCallback((value: BlockType) => {
        switch (value) {
            case "paragraph":
                executeCommand("formatBlock", "p")
                break
            case "heading1":
                executeCommand("formatBlock", "h1")
                break
            case "heading2":
                executeCommand("formatBlock", "h2")
                break
            case "heading3":
                executeCommand("formatBlock", "h3")
                break
            case "heading4":
                executeCommand("formatBlock", "h4")
                break
            case "quote":
                executeCommand("formatBlock", "blockquote")
                break
        }
    }, [executeCommand])

    const isActive = activeEditorRef?.current !== null && activePageIndex !== null

    return (
        <div
            className={cn(
                "sticky top-0 z-50 flex items-center gap-1 px-3 py-2 shadow-sm transition-opacity duration-200 sticky-toolbar-light",
                !isActive && "opacity-50",
                className,
            )}
            style={{
                background: "white",
                borderBottom: "1px solid #e5e7eb",
                colorScheme: "light",
            }}
        >
            {/* Active page indicator */}
            <div className="flex items-center gap-2 pr-3 mr-2" style={{ borderRight: "1px solid #e5e7eb" }}>
                <span className="text-xs" style={{ color: "#6b7280" }}>
                    {isActive ? `Editing Page ${(activePageIndex ?? 0) + 1}` : "Click on a page to edit"}
                </span>
            </div>

            {/* Undo/Redo */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => executeCommand("undo")}
                            disabled={!isActive}
                        >
                            <Undo2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => executeCommand("redo")}
                            disabled={!isActive}
                        >
                            <Redo2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Block Type Select */}
            <Select onValueChange={handleBlockTypeChange} disabled={!isActive}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue placeholder="Paragraph" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="paragraph">
                        <div className="flex items-center gap-2">
                            <Pilcrow className="h-3 w-3" />
                            <span>Paragraph</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="heading1">
                        <div className="flex items-center gap-2">
                            <Heading1 className="h-3 w-3" />
                            <span>Heading 1</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="heading2">
                        <div className="flex items-center gap-2">
                            <Heading2 className="h-3 w-3" />
                            <span>Heading 2</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="heading3">
                        <div className="flex items-center gap-2">
                            <Heading3 className="h-3 w-3" />
                            <span>Heading 3</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="heading4">
                        <div className="flex items-center gap-2">
                            <Heading4 className="h-3 w-3" />
                            <span>Heading 4</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="quote">
                        <div className="flex items-center gap-2">
                            <Quote className="h-3 w-3" />
                            <span>Quote</span>
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Text Formatting */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => executeCommand("bold")}
                            disabled={!isActive}
                        >
                            <Bold className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Bold (Ctrl+B)</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => executeCommand("italic")}
                            disabled={!isActive}
                        >
                            <Italic className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Italic (Ctrl+I)</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => executeCommand("underline")}
                            disabled={!isActive}
                        >
                            <Underline className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Underline (Ctrl+U)</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Lists */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => executeCommand("insertUnorderedList")}
                            disabled={!isActive}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Bullet List</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => executeCommand("insertOrderedList")}
                            disabled={!isActive}
                        >
                            <ListOrdered className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Numbered List</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Insert Elements */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => executeCommand("insertHorizontalRule")}
                            disabled={!isActive}
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Horizontal Rule</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}

