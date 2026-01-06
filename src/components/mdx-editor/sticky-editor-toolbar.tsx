"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useEditorContext } from "@/components/mdx-editor/editor-context"
import { Bold, Italic, Underline, Undo2, Redo2, List, ListOrdered, Link, Table, Minus, Type, Heading1, Heading2, Heading3, Heading4, Pilcrow, Quote, Image, Highlighter, Strikethrough, Subscript, Superscript, Eye, EyeOff, AlignLeft, AlignCenter, AlignRight, AlignJustify, CheckSquare } from "lucide-react"
import { cn } from "@/lib/utils"

type BlockType = "paragraph" | "heading1" | "heading2" | "heading3" | "heading4" | "quote"

interface StickyEditorToolbarProps {
    className?: string,
    onToggleDiffMode?: (value: boolean) => void
}

export function StickyEditorToolbar({ className, onToggleDiffMode }: StickyEditorToolbarProps) {
    const { activeEditorRef, activePageIndex } = useEditorContext()
    const [isDiffMode, setIsDiffMode] = useState(false)

    const getSelectedText = useCallback(() => {
        const selection = window.getSelection()
        if (selection && selection.toString().trim()) {
            return selection.toString().trim()
        }
        return ""
    }, [])

    const getCurrentLine = useCallback(() => {
        if (!activeEditorRef?.current) return ""

        try {
            const editor = activeEditorRef.current
            const markdown = editor.getMarkdown()
            const selection = window.getSelection()

            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0)
                const container = range.commonAncestorContainer

                // Try to find the text content and position
                const editorElement = document.querySelector('[contenteditable="true"]')
                if (editorElement && editorElement.contains(container)) {
                    const text = container.textContent || ""
                    // This is a simplified approach - in a real implementation,
                    // you'd need more sophisticated line detection
                    return text
                }
            }
        } catch (error) {
            console.warn("Could not get current line:", error)
        }

        return ""
    }, [activeEditorRef])

    const executeCommand = useCallback((command: string, value?: string) => {
        if (!activeEditorRef?.current) return

        const editor = activeEditorRef.current
        const selectedText = getSelectedText() || "text"

        switch (command) {
            case "undo":
                document.execCommand("undo")
                break
            case "redo":
                document.execCommand("redo")
                break
            case "formatBlock":
                // Use document.execCommand for formatBlock operations
                if (value) {
                    // Find and focus the contentEditable element
                    const editorElement = document.querySelector('[contenteditable="true"]') as HTMLElement
                    if (editorElement) {
                        editorElement.focus()

                        // Small delay to ensure focus is set
                        setTimeout(() => {
                            document.execCommand("formatBlock", false, value)
                        }, 0)
                    }
                }
                break
            case "bold":
                editor.insertMarkdown(`**${selectedText}**`)
                break
            case "italic":
                editor.insertMarkdown(`*${selectedText}*`)
                break
            case "underline":
                editor.insertMarkdown(`<u>${selectedText}</u>`)
                break
            case "strikethrough":
                editor.insertMarkdown(`~~${selectedText}~~`)
                break
            case "subscript":
                editor.insertMarkdown(`<sub>${selectedText}</sub>`)
                break
            case "superscript":
                editor.insertMarkdown(`<sup>${selectedText}</sup>`)
                break
            case "highlight":
                editor.insertMarkdown(`==${selectedText}==`)
                break
            case "insertUnorderedList":
                const listItems = selectedText.split('\n').filter(item => item.trim())
                if (listItems.length > 0) {
                    const markdownList = listItems.map(item => `- ${item}`).join('\n')
                    editor.insertMarkdown(markdownList)
                } else {
                    editor.insertMarkdown("- List item\n- Another item")
                }
                break
            case "insertOrderedList":
                const orderedItems = selectedText.split('\n').filter(item => item.trim())
                if (orderedItems.length > 0) {
                    const markdownList = orderedItems.map((item, index) => `${index + 1}. ${item}`).join('\n')
                    editor.insertMarkdown(markdownList)
                } else {
                    editor.insertMarkdown("1. First item\n2. Second item")
                }
                break
            case "insertCheckboxList":
                const checkboxItems = selectedText.split('\n').filter(item => item.trim())
                if (checkboxItems.length > 0) {
                    const markdownList = checkboxItems.map(item => `- [ ] ${item}`).join('\n')
                    editor.insertMarkdown(markdownList)
                } else {
                    editor.insertMarkdown("- [ ] Checkbox item\n- [ ] Another item")
                }
                break
            case "formatBlock":
                if (value) {
                    const prefix = selectedText ? "" : "Heading ";
                    switch (value) {
                        case "p":
                            if (selectedText) {
                                // Convert selected text to paragraph by removing any heading prefixes
                                const cleanText = selectedText.replace(/^#+\s*/, "");
                                editor.insertMarkdown(cleanText);
                            } else {
                                editor.insertMarkdown("\n\n");
                            }
                            break
                        case "h1":
                            if (selectedText) {
                                // Remove any existing heading prefixes and add h1
                                const cleanText = selectedText.replace(/^#+\s*/, "");
                                editor.insertMarkdown(`# ${cleanText}`);
                            } else {
                                editor.insertMarkdown(`# ${prefix}1`);
                            }
                            break
                        case "h2":
                            if (selectedText) {
                                const cleanText = selectedText.replace(/^#+\s*/, "");
                                editor.insertMarkdown(`## ${cleanText}`);
                            } else {
                                editor.insertMarkdown(`## ${prefix}2`);
                            }
                            break
                        case "h3":
                            if (selectedText) {
                                const cleanText = selectedText.replace(/^#+\s*/, "");
                                editor.insertMarkdown(`### ${cleanText}`);
                            } else {
                                editor.insertMarkdown(`### ${prefix}3`);
                            }
                            break
                        case "h4":
                            if (selectedText) {
                                const cleanText = selectedText.replace(/^#+\s*/, "");
                                editor.insertMarkdown(`#### ${cleanText}`);
                            } else {
                                editor.insertMarkdown(`#### ${prefix}4`);
                            }
                            break
                        case "blockquote":
                            if (selectedText) {
                                const quotedText = selectedText.split('\n').map(line => `> ${line}`).join('\n');
                                editor.insertMarkdown(quotedText);
                            } else {
                                editor.insertMarkdown("> Quote text");
                            }
                            break
                    }
                }
                break
            case "insertTable":
                editor.insertMarkdown("\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 1   | Cell 2   | Cell 3   |\n")
                break
            case "insertImage":
                // Open a prompt for image URL
                const imageUrl = prompt("Enter image URL:")
                if (imageUrl) {
                    editor.insertMarkdown(`![Alt text](${imageUrl})`)
                }
                break
            case "insertLink":
                const linkUrl = prompt("Enter link URL:")
                if (linkUrl) {
                    const linkText = prompt("Enter link text:", "link text")
                    if (linkText) {
                        editor.insertMarkdown(`[${linkText}](${linkUrl})`)
                    }
                }
                break
            case "insertHorizontalRule":
                editor.insertMarkdown("\n\n---\n\n")
                break
            case "alignLeft":
                // Text alignment in markdown is typically handled with CSS or HTML
                editor.insertMarkdown(`<div style="text-align: left;">${selectedText}</div>`)
                break
            case "alignCenter":
                editor.insertMarkdown(`<div style="text-align: center;">${selectedText}</div>`)
                break
            case "alignRight":
                editor.insertMarkdown(`<div style="text-align: right;">${selectedText}</div>`)
                break
            case "alignJustify":
                editor.insertMarkdown(`<div style="text-align: justify;">${selectedText}</div>`)
                break
            case "toggleDiffMode":
                // This would need to be handled differently - diff mode is controlled by the editor's viewMode
                // For now, we'll insert a code block as an alternative
                editor.insertMarkdown("\n```diff\n+ added line\n- removed line\n```\n")
                break
        }
    }, [activeEditorRef, getSelectedText])

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

    const toggleDiffMode = useCallback(() => {
        setIsDiffMode(!isDiffMode)
        // Note: In a real implementation, this would toggle the MDXEditor's viewMode
        // For now, we'll just track the state
        onToggleDiffMode?.(!isDiffMode)
    }, [isDiffMode])


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

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => executeCommand("strikethrough")}
                            disabled={!isActive}
                        >
                            <Strikethrough className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Strikethrough</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => executeCommand("highlight")}
                            disabled={!isActive}
                        >
                            <Highlighter className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Highlight</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => executeCommand("subscript")}
                            disabled={!isActive}
                        >
                            <Subscript className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Subscript</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => executeCommand("superscript")}
                            disabled={!isActive}
                        >
                            <Superscript className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Superscript</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Text Alignment */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => executeCommand("alignLeft")}
                            disabled={!isActive}
                        >
                            <AlignLeft className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Align Left</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => executeCommand("alignCenter")}
                            disabled={!isActive}
                        >
                            <AlignCenter className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Align Center</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => executeCommand("alignRight")}
                            disabled={!isActive}
                        >
                            <AlignRight className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Align Right</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => executeCommand("alignJustify")}
                            disabled={!isActive}
                        >
                            <AlignJustify className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Justify</TooltipContent>
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

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => executeCommand("insertCheckboxList")}
                            disabled={!isActive}
                        >
                            <CheckSquare className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Checkbox List</TooltipContent>
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
                            onClick={() => executeCommand("insertTable")}
                            disabled={!isActive}
                        >
                            <Table className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Insert Table</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => executeCommand("insertImage")}
                            disabled={!isActive}
                        >
                            <Image className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Insert Image</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => executeCommand("insertLink")}
                            disabled={!isActive}
                        >
                            <Link className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Insert Link</TooltipContent>
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

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* View Mode Toggles */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={isDiffMode ? "default" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={toggleDiffMode}
                            disabled={!isActive}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Diff Mode</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={!isDiffMode ? "default" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={toggleDiffMode}
                            disabled={!isActive}
                        >
                            <Type className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Rich Text Mode</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}

