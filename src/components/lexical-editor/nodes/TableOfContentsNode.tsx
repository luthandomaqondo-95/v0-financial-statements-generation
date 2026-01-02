"use client"

import { DecoratorNode, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from "lexical";
import { ReactNode } from "react";

export type SerializedTableOfContentsNode = Spread<
    {
        headings: Array<{ key: string; text: string; level: number }>;
    },
    SerializedLexicalNode
>;

export class TableOfContentsNode extends DecoratorNode<ReactNode> {
    __headings: Array<{ key: string; text: string; level: number }>;

    static getType(): string {
        return "table-of-contents";
    }

    static clone(node: TableOfContentsNode): TableOfContentsNode {
        return new TableOfContentsNode(node.__headings, node.__key);
    }

    constructor(headings?: Array<{ key: string; text: string; level: number }>, key?: NodeKey) {
        super(key);
        this.__headings = headings || [];
    }

    createDOM(): HTMLElement {
        const div = document.createElement("div");
        div.className = "table-of-contents-wrapper";
        return div;
    }

    updateDOM(): false {
        return false;
    }

    setHeadings(headings: Array<{ key: string; text: string; level: number }>): void {
        const writable = this.getWritable();
        writable.__headings = headings;
    }

    getHeadings(): Array<{ key: string; text: string; level: number }> {
        return this.__headings;
    }

    decorate(): ReactNode {
        return <TableOfContentsComponent headings={this.__headings} />;
    }

    static importJSON(serializedNode: SerializedTableOfContentsNode): TableOfContentsNode {
        const node = $createTableOfContentsNode();
        node.setHeadings(serializedNode.headings);
        return node;
    }

    exportJSON(): SerializedTableOfContentsNode {
        return {
            headings: this.__headings,
            type: "table-of-contents",
            version: 1,
        };
    }
}

export function $createTableOfContentsNode(): TableOfContentsNode {
    return new TableOfContentsNode();
}

export function $isTableOfContentsNode(node: LexicalNode | null | undefined): node is TableOfContentsNode {
    return node instanceof TableOfContentsNode;
}

// React component for rendering the TOC
function TableOfContentsComponent({ headings }: { headings: Array<{ key: string; text: string; level: number }> }) {
    if (headings.length === 0) {
        return (
            <div className="my-6 p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Table of Contents</h3>
                <p className="text-sm text-gray-500 italic">No headings found. Add headings to your document to populate the table of contents.</p>
            </div>
        );
    }

    return (
        <div className="my-6 p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Table of Contents</h3>
            <nav className="space-y-1">
                {headings.map((heading, index) => {
                    const indent = (heading.level - 1) * 16;
                    return (
                        <div
                            key={`${heading.key}-${index}`}
                            className="text-sm hover:text-blue-600 transition-colors cursor-pointer py-1"
                            style={{ paddingLeft: `${indent}px` }}
                            onClick={() => {
                                const element = document.querySelector(`[data-lexical-heading-key="${heading.key}"]`);
                                if (element) {
                                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                                }
                            }}
                        >
                            <span className="text-gray-400 mr-2">
                                {heading.level === 1 ? "•" : heading.level === 2 ? "◦" : "▪"}
                            </span>
                            <span className={heading.level === 1 ? "font-semibold text-gray-900" : "text-gray-700"}>
                                {heading.text || "(Empty heading)"}
                            </span>
                        </div>
                    );
                })}
            </nav>
        </div>
    );
}

