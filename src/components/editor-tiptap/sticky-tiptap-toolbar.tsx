"use client"

import { useCallback, useEffect, useState } from "react";
import { useTiptapEditorContext } from "./editor-context";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Undo, Redo, Heading1, Heading2, Heading3, Type, Link, Table, Image, Highlighter, Strikethrough, Subscript, Superscript, CheckSquare, Quote, Minus, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StickyTiptapToolbarProps {
    className?: string;
    onPageUndo?: () => void;
    onPageRedo?: () => void;
    canPageUndo?: boolean;
    canPageRedo?: boolean;
}

export function StickyTiptapToolbar({
    className,
    onPageUndo,
    onPageRedo,
    canPageUndo,
    canPageRedo,
}: StickyTiptapToolbarProps) {
    const { activeEditorRef, activePageIndex } = useTiptapEditorContext();
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isStrikethrough, setIsStrikethrough] = useState(false);
    const [isHighlight, setIsHighlight] = useState(false);
    const [isSubscript, setIsSubscript] = useState(false);
    const [isSuperscript, setIsSuperscript] = useState(false);
    const [blockType, setBlockType] = useState("paragraph");
    const [textAlign, setTextAlign] = useState("left");

    const editor = activeEditorRef?.current;

    const updateToolbar = useCallback(() => {
        if (!editor) return;

        setIsBold(editor.isActive("bold"));
        setIsItalic(editor.isActive("italic"));
        setIsUnderline(editor.isActive("underline"));
        setIsStrikethrough(editor.isActive("strike"));
        setIsHighlight(editor.isActive("highlight"));
        setIsSubscript(editor.isActive("subscript"));
        setIsSuperscript(editor.isActive("superscript"));

        // Check heading level
        if (editor.isActive("heading", { level: 1 })) {
            setBlockType("h1");
        } else if (editor.isActive("heading", { level: 2 })) {
            setBlockType("h2");
        } else if (editor.isActive("heading", { level: 3 })) {
            setBlockType("h3");
        } else if (editor.isActive("blockquote")) {
            setBlockType("quote");
        } else if (editor.isActive("codeBlock")) {
            setBlockType("code");
        } else {
            setBlockType("paragraph");
        }

        // Check text alignment
        if (editor.isActive({ textAlign: "center" })) {
            setTextAlign("center");
        } else if (editor.isActive({ textAlign: "right" })) {
            setTextAlign("right");
        } else if (editor.isActive({ textAlign: "justify" })) {
            setTextAlign("justify");
        } else {
            setTextAlign("left");
        }
    }, [editor]);

    // Subscribe to editor updates
    useEffect(() => {
        if (!editor) return;

        editor.on("selectionUpdate", updateToolbar);
        editor.on("transaction", updateToolbar);

        return () => {
            editor.off("selectionUpdate", updateToolbar);
            editor.off("transaction", updateToolbar);
        };
    }, [editor, updateToolbar]);

    const formatText = (format: "bold" | "italic" | "underline" | "strike" | "highlight" | "subscript" | "superscript") => {
        if (!editor) return;

        switch (format) {
            case "bold":
                editor.chain().focus().toggleBold().run();
                break;
            case "italic":
                editor.chain().focus().toggleItalic().run();
                break;
            case "underline":
                editor.chain().focus().toggleUnderline().run();
                break;
            case "strike":
                editor.chain().focus().toggleStrike().run();
                break;
            case "highlight":
                editor.chain().focus().toggleHighlight().run();
                break;
            case "subscript":
                editor.chain().focus().toggleSubscript().run();
                break;
            case "superscript":
                editor.chain().focus().toggleSuperscript().run();
                break;
        }
    };

    const formatAlignment = (alignment: "left" | "center" | "right" | "justify") => {
        if (!editor) return;
        editor.chain().focus().setTextAlign(alignment).run();
    };

    const handleBlockTypeChange = (value: string) => {
        if (!editor) return;

        switch (value) {
            case "h1":
                editor.chain().focus().toggleHeading({ level: 1 }).run();
                break;
            case "h2":
                editor.chain().focus().toggleHeading({ level: 2 }).run();
                break;
            case "h3":
                editor.chain().focus().toggleHeading({ level: 3 }).run();
                break;
            case "paragraph":
                editor.chain().focus().setParagraph().run();
                break;
            case "quote":
                editor.chain().focus().toggleBlockquote().run();
                break;
            case "code":
                editor.chain().focus().toggleCodeBlock().run();
                break;
        }
        setBlockType(value);
    };

    const insertList = (type: "bullet" | "ordered" | "task") => {
        if (!editor) return;

        switch (type) {
            case "bullet":
                editor.chain().focus().toggleBulletList().run();
                break;
            case "ordered":
                editor.chain().focus().toggleOrderedList().run();
                break;
            case "task":
                editor.chain().focus().toggleTaskList().run();
                break;
        }
    };

    const insertTable = () => {
        if (!editor) return;
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        toast.success("Table inserted");
    };

    const insertLink = () => {
        if (!editor) return;

        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("Enter URL:", previousUrl);

        if (url === null) return;

        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    };

    const insertImage = () => {
        if (!editor) return;

        const url = window.prompt("Enter image URL:");

        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const insertHorizontalRule = () => {
        if (!editor) return;
        editor.chain().focus().setHorizontalRule().run();
    };

    const handleUndo = () => {
        if (editor) {
            editor.chain().focus().undo().run();
        }
        if (onPageUndo) {
            onPageUndo();
        }
    };

    const handleRedo = () => {
        if (editor) {
            editor.chain().focus().redo().run();
        }
        if (onPageRedo) {
            onPageRedo();
        }
    };

    const isActive = editor !== null && activePageIndex !== null;

    return (
        <div
            className={cn(
                "flex items-center gap-1 p-2 shadow-sm transition-opacity duration-200",
                !isActive && "opacity-50",
                className
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
                            onClick={handleUndo}
                            disabled={!isActive}
                        >
                            <Undo className="h-4 w-4" />
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
                            onClick={handleRedo}
                            disabled={!isActive}
                        >
                            <Redo className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Block Type Select */}
            <Select value={blockType} onValueChange={handleBlockTypeChange} disabled={!isActive}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="paragraph">
                        <div className="flex items-center gap-2">
                            <Type className="h-3 w-3" />
                            Paragraph
                        </div>
                    </SelectItem>
                    <SelectItem value="h1">
                        <div className="flex items-center gap-2">
                            <Heading1 className="h-3 w-3" />
                            Heading 1
                        </div>
                    </SelectItem>
                    <SelectItem value="h2">
                        <div className="flex items-center gap-2">
                            <Heading2 className="h-3 w-3" />
                            Heading 2
                        </div>
                    </SelectItem>
                    <SelectItem value="h3">
                        <div className="flex items-center gap-2">
                            <Heading3 className="h-3 w-3" />
                            Heading 3
                        </div>
                    </SelectItem>
                    <SelectItem value="quote">
                        <div className="flex items-center gap-2">
                            <Quote className="h-3 w-3" />
                            Quote
                        </div>
                    </SelectItem>
                    <SelectItem value="code">
                        <div className="flex items-center gap-2">
                            <Code className="h-3 w-3" />
                            Code Block
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Text Formatting */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={isBold ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => formatText("bold")}
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
                            variant={isItalic ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => formatText("italic")}
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
                            variant={isUnderline ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => formatText("underline")}
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
                            variant={isStrikethrough ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => formatText("strike")}
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
                            variant={isHighlight ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => formatText("highlight")}
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
                            variant={isSubscript ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => formatText("subscript")}
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
                            variant={isSuperscript ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => formatText("superscript")}
                            disabled={!isActive}
                        >
                            <Superscript className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Superscript</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Text Alignment */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={textAlign === "left" ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => formatAlignment("left")}
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
                            variant={textAlign === "center" ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => formatAlignment("center")}
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
                            variant={textAlign === "right" ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => formatAlignment("right")}
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
                            variant={textAlign === "justify" ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => formatAlignment("justify")}
                            disabled={!isActive}
                        >
                            <AlignJustify className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Justify</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Lists */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => insertList("bullet")}
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
                            onClick={() => insertList("ordered")}
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
                            onClick={() => insertList("task")}
                            disabled={!isActive}
                        >
                            <CheckSquare className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Task List</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Insert Elements */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={insertTable}
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
                            onClick={insertLink}
                            disabled={!isActive}
                        >
                            <Link className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Insert Link</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={insertImage}
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
                            onClick={insertHorizontalRule}
                            disabled={!isActive}
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Horizontal Rule</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
