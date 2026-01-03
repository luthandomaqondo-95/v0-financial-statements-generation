/**
 * Chat Component
 * AI chat interface for editing financial statements
 */

"use client"

import { useState, useRef, useEffect } from "react";
import { Send, Wand2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAIEdit } from "@/hooks/useAIEdit";
import { useLexicalEditorContext } from "../lexical-editor/editor-context";
import { MarkdownSelection } from "@/types/ai-types";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface ChatComponentProps {
    type: "afs";
    project_id: string | number;
    llmContext: { text: string; start: number; end: number } | null;
    currentPageMarkdown: string;
    setSelection: (sel: any) => void;
    setEditingRange: (range: { start: number; end: number } | null) => void;
    clearSelection: () => void;
}

export function ChatComponent({
    type,
    project_id,
    llmContext,
    currentPageMarkdown,
    setSelection,
    setEditingRange,
    clearSelection,
}: ChatComponentProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { activeEditorRef } = useLexicalEditorContext();
    const { aiEditState, executeAIEdit } = useAIEdit();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || aiEditState.isStreaming) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
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
        const success = await executeAIEdit(
            input,
            activeEditorRef?.current || null,
            currentPageMarkdown,
            markdownSelection
        );

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
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col h-full bg-background border-l">
            {/* Header */}
            <div className="px-4 py-3 border-b bg-muted/50">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                            <Wand2 className="h-4 w-4 text-primary" />
                            AI Assistant
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Edit your financial statements naturally
                        </p>
                    </div>
                </div>
            </div>

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

            {/* Help Section */}
            {messages.length === 0 && (
                <div className="px-4 py-3">
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">
                            💡 How to use:
                        </p>
                        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                            <li>• Select text in the editor to highlight it</li>
                            <li>• Type commands to edit selection</li>
                            <li>• Or use general commands like "Increase cash by $50,000"</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-3">
                <div className="space-y-4">
                    {messages.map(message => (
                        <div
                            key={message.id}
                            className={cn(
                                "flex gap-2",
                                message.role === "user" ? "justify-end" : "justify-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "rounded-lg px-3 py-2 max-w-[80%]",
                                    message.role === "user"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                )}
                            >
                                <p className="text-sm">{message.content}</p>
                                <p className="text-xs opacity-70 mt-1">
                                    {message.timestamp.toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* Streaming Indicator */}
            {aiEditState.isStreaming && (
                <div className="px-4 py-2 border-t bg-blue-50 dark:bg-blue-950/20">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs font-medium">AI is editing...</span>
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t bg-muted/50">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask AI to edit the document..."
                        disabled={aiEditState.isStreaming}
                        className="flex-1 text-sm"
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={aiEditState.isStreaming || !input.trim()}
                        size="icon"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

