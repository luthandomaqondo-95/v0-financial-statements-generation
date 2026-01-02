"use client"

import { useLexicalEditorContext } from "./editor-context";
import { useCallback, useEffect, useState } from "react";
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND, UNDO_COMMAND, REDO_COMMAND, $insertNodes } from "lexical";
import { $createHeadingNode, type HeadingTagType } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $createParagraphNode } from "lexical";
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Undo, Redo, Heading1, Heading2, Heading3, Type, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { $createTableOfContentsNode } from "@/components/lexical-editor/nodes/TableOfContentsNode";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function StickyLexicalEditorToolbar({
    className,
    onPageUndo,
    onPageRedo,
    canPageUndo,
    canPageRedo,
}: {
    className?: string;
    onPageUndo?: () => void;
    onPageRedo?: () => void;
    canPageUndo?: boolean;
    canPageRedo?: boolean;
}) {
    const { activeEditorRef } = useLexicalEditorContext();
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [blockType, setBlockType] = useState("paragraph");

    const updateToolbar = useCallback(() => {
        if (!activeEditorRef?.current) return;

        activeEditorRef.current.getEditorState().read(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                setIsBold(selection.hasFormat("bold"));
                setIsItalic(selection.hasFormat("italic"));
                setIsUnderline(selection.hasFormat("underline"));
            }
        });
    }, [activeEditorRef]);

    const formatText = (format: "bold" | "italic" | "underline") => {
        if (!activeEditorRef?.current) return;
        activeEditorRef.current.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    };

    const formatElement = (format: "left" | "center" | "right" | "justify") => {
        if (!activeEditorRef?.current) return;
        activeEditorRef.current.dispatchCommand(FORMAT_ELEMENT_COMMAND, format);
    };

    const formatHeading = (headingType: HeadingTagType) => {
        if (!activeEditorRef?.current) return;
        activeEditorRef.current.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createHeadingNode(headingType));
            }
        });
    };

    const formatParagraph = () => {
        if (!activeEditorRef?.current) return;
        activeEditorRef.current.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createParagraphNode());
            }
        });
    };

    const handleBlockTypeChange = (value: string) => {
        switch (value) {
            case "h1":
                formatHeading("h1");
                break;
            case "h2":
                formatHeading("h2");
                break;
            case "h3":
                formatHeading("h3");
                break;
            case "paragraph":
                formatParagraph();
                break;
        }
        setBlockType(value);
    };
    const insertTableOfContents = () => {
        if (activeEditorRef?.current) {
            activeEditorRef.current.update(() => {
                const tocNode = $createTableOfContentsNode();
                $insertNodes([tocNode]);
                toast.success("Table of Contents inserted", {
                    description: "The TOC will automatically update as you add headings.",
                });
            });
        } else {
            toast.error("No active editor found");
        }
    };

    const handleUndo = () => {
        // Try content-level undo first if there's an active editor
        if (activeEditorRef?.current) {
            activeEditorRef.current.dispatchCommand(UNDO_COMMAND, undefined);
        };
        if (onPageUndo) {
            // Fall back to page-level undo
            onPageUndo();
        }
    };

    const handleRedo = () => {
        // Try content-level redo first if there's an active editor
        if (activeEditorRef?.current) {
            activeEditorRef.current.dispatchCommand(REDO_COMMAND, undefined);
        };
        if (onPageRedo) {
            // Fall back to page-level redo
            onPageRedo();
        }
    };


    useEffect(() => {
        if (!activeEditorRef?.current) return;

        return activeEditorRef.current.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                updateToolbar();
            });
        });
    }, [activeEditorRef, updateToolbar]);

    return (
        <div className={cn("flex items-center gap-1 p-2", className)}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            onClick={handleUndo}
                            disabled={!activeEditorRef?.current && !canPageUndo}
                        >
                            <Undo className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {(activeEditorRef && activeEditorRef.current) ? "Undo content change (Ctrl+Z)" : "Undo page operation (Ctrl+Z)"}
                    </TooltipContent>
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
                            disabled={!activeEditorRef?.current && !canPageRedo}
                        >
                            <Redo className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {(activeEditorRef && activeEditorRef.current) ? "Redo content change (Ctrl+Y)" : "Redo page operation (Ctrl+Y)"}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Select value={blockType} onValueChange={handleBlockTypeChange}>
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
                </SelectContent>
            </Select>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Button variant={isBold ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => formatText("bold")}>
                <Bold className="h-4 w-4" />
            </Button>
            <Button variant={isItalic ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => formatText("italic")}>
                <Italic className="h-4 w-4" />
            </Button>
            <Button variant={isUnderline ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => formatText("underline")}>
                <Underline className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => formatElement("left")}>
                <AlignLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => formatElement("center")}>
                <AlignCenter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => formatElement("right")}>
                <AlignRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => formatElement("justify")}>
                <AlignJustify className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => activeEditorRef?.current?.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}>
                <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => activeEditorRef?.current?.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}>
                <ListOrdered className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" className="h-8 cursor-pointer" onClick={insertTableOfContents} title="Insert Table of Contents">
                            <BookOpen className="h-4 w-4" />
                            Contents
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        Add Table of Contents after cover page.
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}

