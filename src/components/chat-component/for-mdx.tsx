'use client'

import { useEffect, useRef, useState } from "react";
// import { IconCheck, IconInfoCircle, IconPlus } from "@tabler/icons-react"
import { ArrowUpIcon, PlusIcon, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupText, InputGroupTextarea } from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEditorContext } from "../editor-mdx/editor-context";
import { useAIEdit } from "@/hooks/useAIEdit";
import { MarkdownSelection } from "@/types/ai-types";


interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}
export function ChatComponent({
    type,
    llmContext,
    currentPageMarkdown,
    setSelection,
    setEditingRange,
    clearSelection,
}: {
    type: "afs" | "payroll" | "invoice" | "quote" | "other",
    project_id: string | number;
    llmContext: { text: string; start: number; end: number } | null;
    currentPageMarkdown: string;
    setSelection: (sel: any) => void;
    setEditingRange: (range: { start: number; end: number } | null) => void;
    clearSelection: () => void;
}) {
    console.log("🎭 ChatComponent: llmContext", llmContext);
    const [llmBudget, setLlmBudget] = useState<{ budget: number, used: number }>({ budget: 0, used: 0 });
    const [chatInput, setChatInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { activeEditorRef } = useEditorContext();
    const { aiEditState, executeMarkdownAIEdit } = useAIEdit();

    const handleSendMessage = async () => {
        if (!chatInput.trim() || aiEditState.isStreaming) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: chatInput,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setChatInput("");
        console.log("🎭 AI Demo Mode: currentPageMarkdown", llmContext);

        // Build markdown selection from llmContext if available
        let markdownSelection: MarkdownSelection | undefined = undefined;
        if (llmContext && llmContext.text) {
            markdownSelection = {
                text: llmContext.text,
                startOffset: llmContext.start,
                endOffset: llmContext.end,
                contextBefore: currentPageMarkdown.slice(
                    Math.max(0, llmContext.start - 50),
                    llmContext.start
                ),
                contextAfter: currentPageMarkdown.slice(
                    llmContext.end,
                    Math.min(currentPageMarkdown.length, llmContext.end + 50)
                ),
            };
        }

        // Execute AI edit with markdown selection
        executeMarkdownAIEdit(
            chatInput,
            activeEditorRef?.current || null,
            currentPageMarkdown,
            markdownSelection
        ).then((success: boolean) => {
            if (success) {
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: "Edits applied successfully!",
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, assistantMessage]);
                clearSelection();
            } else {
                const errorMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: "Sorry, I couldn't apply the edits. Please try again.",
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, errorMessage]);
            }
        })
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="flex-1 flex flex-col w-full">
            {/* Messages section */}
            <ScrollArea className="flex-1 px-4 py-3">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Messages will be rendered here */}
                    {
                        messages.map((message, index) => {
                            return (
                                <div key={index}>

                                </div>
                            )
                        })
                    }
                </div>
            </ScrollArea>

            {/* Input section at bottom */}
            <div>
                {/* Selection Context */}
                {llmContext && llmContext.text && (
                    <div className="px-4 py-3 border-b bg-yellow-50 dark:bg-yellow-950/20">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                                    📝 Selected Text
                                </p>
                                <p className="text-xs text-yellow-800 dark:text-yellow-200 bg-white dark:bg-yellow-950/40 p-2 rounded border border-yellow-200 dark:border-yellow-800 font-mono truncate">
                                    {llmContext.text.length > 100
                                        ? llmContext.text.substring(0, 100) + "..."
                                        : llmContext.text}
                                </p>
                                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                                    Try: "increase this", "double this", "reduce by half"
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
                                onClick={clearSelection}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                )}
                <InputGroup>
                    <InputGroupTextarea
                        placeholder="Ask, Search or Chat..."
                        disabled={aiEditState.isStreaming}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                    />
                    <InputGroupAddon align="block-end">
                        <InputGroupButton
                            variant="outline"
                            className="rounded-full"
                            size="icon-xs"
                        >
                            <PlusIcon />
                        </InputGroupButton>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <InputGroupButton variant="ghost">Auto</InputGroupButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                align="start"
                                className="[--radius:0.95rem]"
                            >
                                <DropdownMenuItem>Auto</DropdownMenuItem>
                                <DropdownMenuItem>Agent</DropdownMenuItem>
                                <DropdownMenuItem>Manual</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <InputGroupText className="ml-auto">${llmBudget.used} used</InputGroupText>
                        <Separator orientation="vertical" className="!h-4" />
                        <InputGroupButton
                            variant="default"
                            className="rounded-full"
                            size="icon-sm"

                            onClick={handleSendMessage}
                            disabled={aiEditState.isStreaming || !chatInput.trim()}
                        >
                            <ArrowUpIcon />
                            <span className="sr-only">Send</span>
                        </InputGroupButton>
                    </InputGroupAddon>
                </InputGroup>
            </div>
        </div>
    )
}