'use client'

import { useState } from "react";
// import { IconCheck, IconInfoCircle, IconPlus } from "@tabler/icons-react"
import { ArrowUpIcon, PlusIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupText, InputGroupTextarea } from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"

export function ChatComponent({
    type,
    project_id,
    llmContext,
    setSelection,
    clearSelection,
    setEditingRange,
}: {
    type: "afs" | "payroll" | "invoice" | "quote" | "other",
    project_id: string | number,
    llmContext: {
        text: string,
        start: number,
        end: number,
    } | null,
    setSelection: (selection: { text: string, start: number, end: number } | null) => void,
    setEditingRange: (range: { start: number, end: number } | null) => void,
    clearSelection: () => void,
}) {
    const [llmBudget, setLlmBudget] = useState<{ budget: number, used: number }>({ budget: 0, used: 0 });
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);

    // AI Edit Handler with streaming and proper replacement
    const handleAIEdit = async (instruction: string) => {
        if (!instruction.trim()) return;

        const userMessage: { role: 'user' | 'assistant', content: string } = {
            role: 'user',
            content: llmContext
                ? `Edit this selection: "${llmContext.text}"\n\nInstruction: ${instruction}`
                : instruction
        };

        setMessages(prev => [...prev, userMessage]);
        setChatInput('');
        setIsStreaming(true);

        // Set editing range to dim other content
        if (llmContext) {
            setEditingRange({ start: llmContext.start, end: llmContext.end });
        }

        // await simulateAIStreamingEdit(instruction, selection);

        setIsStreaming(false);
        setEditingRange(null);
        setSelection(null);
        clearSelection();

        // Update the LLm Budget.
        // setLlmBudget()
    };

    return (
        <div className="flex-1 flex flex-col w-full">
            {/* Messages section */}
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

            {/* Input section at bottom */}
            <InputGroup>
                <InputGroupTextarea placeholder="Ask, Search or Chat..." />
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

                        onClick={() => handleAIEdit(chatInput)}
                        disabled={isStreaming || !chatInput.trim()}
                    >
                        <ArrowUpIcon />
                        <span className="sr-only">Send</span>
                    </InputGroupButton>
                </InputGroupAddon>
            </InputGroup>
        </div>
    )
}