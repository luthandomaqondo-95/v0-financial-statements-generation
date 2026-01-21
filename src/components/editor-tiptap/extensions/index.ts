"use client"

import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Typography from "@tiptap/extension-typography";
import CharacterCount from "@tiptap/extension-character-count";

// Custom extension for page-specific behavior
export const PageExtension = Extension.create({
    name: "pageExtension",
    
    addOptions() {
        return {
            pageIndex: 0,
            onFocus: null as ((pageIndex: number) => void) | null,
        };
    },

    addKeyboardShortcuts() {
        return {
            // Custom page-level shortcuts can be added here
            "Mod-s": () => {
                // Prevent browser save dialog
                return true;
            },
        };
    },
});

// Export all extensions as a configured array
export function getDefaultExtensions(options?: {
    placeholder?: string;
    pageIndex?: number;
    onFocus?: (pageIndex: number) => void;
}) {
    return [
        StarterKit.configure({
            heading: {
                levels: [1, 2, 3, 4, 5, 6],
            },
            bulletList: {
                keepMarks: true,
                keepAttributes: false,
            },
            orderedList: {
                keepMarks: true,
                keepAttributes: false,
            },
        }),
        Underline,
        TextAlign.configure({
            types: ["heading", "paragraph"],
            alignments: ["left", "center", "right", "justify"],
        }),
        Highlight.configure({
            multicolor: true,
        }),
        Link.configure({
            openOnClick: false,
            HTMLAttributes: {
                class: "text-blue-600 underline cursor-pointer",
            },
        }),
        Image.configure({
            inline: false,
            allowBase64: true,
            HTMLAttributes: {
                class: "max-w-full h-auto rounded-lg",
            },
        }),
        Table.configure({
            resizable: true,
            HTMLAttributes: {
                class: "border-collapse border border-gray-300",
            },
        }),
        TableRow,
        TableCell.configure({
            HTMLAttributes: {
                class: "border border-gray-300 px-3 py-2",
            },
        }),
        TableHeader.configure({
            HTMLAttributes: {
                class: "border border-gray-300 px-3 py-2 bg-gray-100 font-bold",
            },
        }),
        Placeholder.configure({
            placeholder: options?.placeholder ?? "Start typing...",
            emptyEditorClass: "before:content-[attr(data-placeholder)] before:text-gray-400 before:float-left before:pointer-events-none before:h-0",
        }),
        TaskList.configure({
            HTMLAttributes: {
                class: "list-none pl-0",
            },
        }),
        TaskItem.configure({
            nested: true,
            HTMLAttributes: {
                class: "flex items-start gap-2",
            },
        }),
        Subscript,
        Superscript,
        Typography,
        CharacterCount,
        PageExtension.configure({
            pageIndex: options?.pageIndex ?? 0,
            onFocus: options?.onFocus ?? null,
        }),
    ];
}

// Export individual extensions for custom configurations
export {
    StarterKit,
    Underline,
    TextAlign,
    Highlight,
    Link,
    Image,
    Table,
    TableRow,
    TableCell,
    TableHeader,
    Placeholder,
    TaskList,
    TaskItem,
    Subscript,
    Superscript,
    Typography,
    CharacterCount,
};
