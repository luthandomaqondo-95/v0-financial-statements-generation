"use client"

import React, { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useEditorContext } from "@/components/editor-mdx/editor-context"
import { Bold, Italic, Underline, Undo2, Redo2, List, ListOrdered, Link, Table, Minus, Heading1, Heading2, Heading3, Heading4, Pilcrow, Quote, Highlighter, Strikethrough, Subscript, Superscript, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify, CheckSquare, FileSpreadsheet, StickyNote, FileText, BookOpen } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type BlockType = "paragraph" | "heading1" | "heading2" | "heading3" | "heading4" | "quote"

interface StickyEditorToolbarProps {
    className?: string,
    onToggleDiffMode?: (value: boolean) => void
}

// AFS financial table template
const AFS_FINANCIAL_TABLE = `\n| Description | Note | 2024 ($) | 2023 ($) |\n|-------------|------|----------|----------|\n| Item | | 0 | 0 |\n| **Total** | | **0** | **0** |\n`

// AFS note template
const AFS_NOTE_TEMPLATE = `\n### N. Note Title\n\n| | 2024 ($) | 2023 ($) |\n|---|----------|----------|\n| Item | 0 | 0 |\n| **Total** | **0** | **0** |\n`

// AFS statement header template
const AFS_STATEMENT_HEADER = `\n## Statement of ...\n*For the year ended December 31, 2024*\n\n`

// Table of Contents template
const TABLE_OF_CONTENTS = `\n## Table of Contents\n\n1. [Section 1](#section-1)\n2. [Section 2](#section-2)\n3. [Section 3](#section-3)\n\n`

/**
 * Memoized toolbar button to avoid re-rendering all buttons
 * when only activeEditorRef or activePageIndex changes.
 */
const ToolbarButton = React.memo(function ToolbarButton({
    icon: Icon,
    label,
    onClick,
    disabled,
    variant = "ghost",
}: {
    icon: React.ElementType
    label: string
    onClick: () => void
    disabled?: boolean
    variant?: "ghost" | "default"
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant={variant}
                    size="icon"
                    className="h-8 w-8"
                    onClick={onClick}
                    disabled={disabled}
                >
                    <Icon className="h-4 w-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
        </Tooltip>
    )
})

export function StickyEditorToolbar({ className, onToggleDiffMode }: StickyEditorToolbarProps) {
    const { activeEditorRef, activePageIndex, totalPages, currentBlockType } = useEditorContext()
    const [isDiffMode, setIsDiffMode] = useState(false)

    const getSelectedText = useCallback(() => {
        const selection = window.getSelection()
        if (selection && selection.toString().trim()) {
            return selection.toString().trim()
        }
        return ""
    }, [])

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
            case "insertUnorderedList": {
                const listItems = selectedText.split('\n').filter(item => item.trim())
                if (listItems.length > 0) {
                    const markdownList = listItems.map(item => `- ${item}`).join('\n')
                    editor.insertMarkdown(markdownList)
                } else {
                    editor.insertMarkdown("- List item\n- Another item")
                }
                break
            }
            case "insertOrderedList": {
                const orderedItems = selectedText.split('\n').filter(item => item.trim())
                if (orderedItems.length > 0) {
                    const markdownList = orderedItems.map((item, index) => `${index + 1}. ${item}`).join('\n')
                    editor.insertMarkdown(markdownList)
                } else {
                    editor.insertMarkdown("1. First item\n2. Second item")
                }
                break
            }
            case "insertCheckboxList": {
                const checkboxItems = selectedText.split('\n').filter(item => item.trim())
                if (checkboxItems.length > 0) {
                    const markdownList = checkboxItems.map(item => `- [ ] ${item}`).join('\n')
                    editor.insertMarkdown(markdownList)
                } else {
                    editor.insertMarkdown("- [ ] Checkbox item\n- [ ] Another item")
                }
                break
            }
            case "formatBlock":
                if (value) {
                    // Get current markdown and selection
                    const currentMarkdown = editor.getMarkdown()
                    const selection = window.getSelection()
                    
                    if (!selection || !selection.rangeCount) {
                        return
                    }

                    const range = selection.getRangeAt(0)
                    let node: Node | null = range.startContainer
                    
                    // Find the text node's parent element
                    while (node && node.nodeType !== Node.ELEMENT_NODE) {
                        node = node.parentNode
                    }
                    
                    if (!node) return

                    // Find the block-level element (p, h1-h6, blockquote, etc.)
                    let blockElement = node as Element
                    const editorElement = document.querySelector('.mdx-editor-wrapper')
                    
                    while (blockElement && editorElement?.contains(blockElement)) {
                        const tagName = blockElement.tagName?.toLowerCase()
                        if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'li'].includes(tagName)) {
                            break
                        }
                        blockElement = blockElement.parentElement as Element
                    }

                    if (!blockElement) return

                    // Get the text content of the block
                    const blockText = blockElement.textContent || ''
                    
                    // Find this text in the markdown
                    const lines = currentMarkdown.split('\n')
                    let targetLineIndex = -1
                    let cleanedBlockText = blockText.trim()

                    for (let i = 0; i < lines.length; i++) {
                        const lineContent = lines[i].replace(/^#+\s*/, '').replace(/^>\s*/, '').replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').trim()
                        if (lineContent === cleanedBlockText || lines[i].includes(cleanedBlockText)) {
                            targetLineIndex = i
                            break
                        }
                    }

                    if (targetLineIndex === -1) return

                    // Transform the line based on the new format
                    const currentLine = lines[targetLineIndex]
                    const cleanText = currentLine.replace(/^#+\s*/, '').replace(/^>\s*/, '').replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').trim()
                    
                    let newLine = ''
                    switch (value) {
                        case "p":
                            newLine = cleanText
                            break
                        case "h1":
                            newLine = `# ${cleanText || 'Heading 1'} #\n`
                            break
                        case "h2":
                            newLine = `## ${cleanText || 'Heading 2'} ##\n`
                            break
                        case "h3":
                            newLine = `### ${cleanText || 'Heading 3'} ###\n`
                            break
                        case "h4":
                            newLine = `#### ${cleanText || 'Heading 4'} ####\n`
                            break
                        case "blockquote":
                            newLine = `> ${cleanText || 'Quote text'}`
                            break
                        default:
                            newLine = cleanText
                    }

                    // Replace the line and update the editor
                    lines[targetLineIndex] = newLine
                    const newMarkdown = lines.join('\n')
                    editor.setMarkdown(newMarkdown)
                }
                break
            case "insertTable":
                editor.insertMarkdown("\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 1   | Cell 2   | Cell 3   |\n")
                break
            case "insertLink": {
                const linkUrl = prompt("Enter link URL:")
                if (linkUrl) {
                    const linkText = prompt("Enter link text:", "link text")
                    if (linkText) {
                        editor.insertMarkdown(`[${linkText}](${linkUrl})`)
                    }
                }
                break
            }
            case "insertHorizontalRule":
                editor.insertMarkdown("\n\n---\n\n")
                break
            case "alignLeft":
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
            // AFS-specific commands
            case "insertFinancialTable":
                editor.insertMarkdown(AFS_FINANCIAL_TABLE)
                break
            case "insertNoteTemplate":
                editor.insertMarkdown(AFS_NOTE_TEMPLATE)
                break
            case "insertStatementHeader":
                editor.insertMarkdown(AFS_STATEMENT_HEADER)
                break
            case "insertTableOfContents":
                editor.insertMarkdown(TABLE_OF_CONTENTS)
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
        <TooltipProvider>
            <div
                className={cn(
                    "sticky top-0 z-50 flex items-center gap-1 px-3 py-2 transition-opacity duration-200 sticky-toolbar-light",
                    !isActive && "opacity-50",
                    className,
                )}
                // style={{
                //     background: "white",
                //     borderBottom: "1px solid #e5e7eb",
                //     colorScheme: "light",
                // }}
            >
                {/* Active page indicator */}
                <div className="fixed bottom-4 right-12 flex items-center gap-2 px-2 py-1 rounded-lg bg-card shadow-sm">
                    <span className="text-xs" style={{ color: "#6b7280" }}>
                        {isActive ? `Page ${(activePageIndex ?? 0) + 1} ${totalPages ? `of ${totalPages}` : ""}` : "Click on a page to edit"}
                    </span>
                </div>

                {/* Undo/Redo */}
                <ToolbarButton icon={Undo2} label="Undo (Ctrl+Z)" onClick={() => executeCommand("undo")} disabled={!isActive} />
                <ToolbarButton icon={Redo2} label="Redo (Ctrl+Y)" onClick={() => executeCommand("redo")} disabled={!isActive} />

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Block Type Select */}
                <Select 
                    value={currentBlockType === "unorderedList" || currentBlockType === "orderedList" ? "paragraph" : currentBlockType} 
                    onValueChange={handleBlockTypeChange} 
                    disabled={!isActive}
                >
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
                <ToolbarButton icon={Bold} label="Bold (Ctrl+B)" onClick={() => executeCommand("bold")} disabled={!isActive} />
                <ToolbarButton icon={Italic} label="Italic (Ctrl+I)" onClick={() => executeCommand("italic")} disabled={!isActive} />
                <ToolbarButton icon={Underline} label="Underline (Ctrl+U)" onClick={() => executeCommand("underline")} disabled={!isActive} />
                <ToolbarButton icon={Strikethrough} label="Strikethrough" onClick={() => executeCommand("strikethrough")} disabled={!isActive} />
                <ToolbarButton icon={Highlighter} label="Highlight" onClick={() => executeCommand("highlight")} disabled={!isActive} />
                <ToolbarButton icon={Subscript} label="Subscript" onClick={() => executeCommand("subscript")} disabled={!isActive} />
                <ToolbarButton icon={Superscript} label="Superscript" onClick={() => executeCommand("superscript")} disabled={!isActive} />

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Text Alignment */}
                <ToolbarButton icon={AlignLeft} label="Align Left" onClick={() => executeCommand("alignLeft")} disabled={!isActive} />
                <ToolbarButton icon={AlignCenter} label="Align Center" onClick={() => executeCommand("alignCenter")} disabled={!isActive} />
                <ToolbarButton icon={AlignRight} label="Align Right" onClick={() => executeCommand("alignRight")} disabled={!isActive} />
                <ToolbarButton icon={AlignJustify} label="Justify" onClick={() => executeCommand("alignJustify")} disabled={!isActive} />

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Lists */}
                <ToolbarButton 
                    icon={List} 
                    label="Bullet List" 
                    onClick={() => executeCommand("insertUnorderedList")} 
                    disabled={!isActive}
                    variant={currentBlockType === "unorderedList" ? "default" : "ghost"}
                />
                <ToolbarButton 
                    icon={ListOrdered} 
                    label="Numbered List" 
                    onClick={() => executeCommand("insertOrderedList")} 
                    disabled={!isActive}
                    variant={currentBlockType === "orderedList" ? "default" : "ghost"}
                />
                <ToolbarButton 
                    icon={CheckSquare} 
                    label="Checkbox List" 
                    onClick={() => executeCommand("insertCheckboxList")} 
                    disabled={!isActive}
                />

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Insert Elements */}
                <ToolbarButton icon={Link} label="Insert Link" onClick={() => executeCommand("insertLink")} disabled={!isActive} />
                <ToolbarButton icon={Minus} label="Horizontal Rule" onClick={() => executeCommand("insertHorizontalRule")} disabled={!isActive} />

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Tables Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 gap-1 px-2" disabled={!isActive}>
                            <Table className="h-4 w-4" />
                            <span className="text-xs">Tables</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => executeCommand("insertTable")}>
                            <Table className="h-4 w-4 mr-2" />
                            Generic Table
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => executeCommand("insertFinancialTable")}>
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            AFS Financial Table
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => executeCommand("insertTableOfContents")}>
                            <BookOpen className="h-4 w-4 mr-2" />
                            Table of Contents
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Templates Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 gap-1 px-2" disabled={!isActive}>
                            <FileText className="h-4 w-4" />
                            <span className="text-xs">Templates</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => executeCommand("insertNoteTemplate")}>
                            <StickyNote className="h-4 w-4 mr-2" />
                            Note Template
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => executeCommand("insertStatementHeader")}>
                            <FileText className="h-4 w-4 mr-2" />
                            Statement Header
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </TooltipProvider>
    )
}
