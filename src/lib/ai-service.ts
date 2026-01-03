/**
 * AI Service
 * Client-side AI service for making API calls to AI providers
 */

import { AIEditResponse, EditorContext, MarkdownEditorContext, MarkdownAIResponse } from "@/types/ai-types";

const AI_PROVIDER = process.env.NEXT_PUBLIC_AI_PROVIDER || "openai";
const AI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || "";
const AI_MODEL = process.env.NEXT_PUBLIC_AI_MODEL || "gpt-4o-mini";
const DEMO_MODE = process.env.NEXT_PUBLIC_AI_DEMO_MODE === "true" || !AI_API_KEY;

/**
 * Call AI to generate edit instructions based on user input and editor context
 * @deprecated Use generateMarkdownAIEdits for new implementations
 */
export async function generateAIEdits(
    instruction: string,
    editorContext: EditorContext
): Promise<AIEditResponse> {
    // Use demo mode if no API key is configured or explicitly enabled
    console.log("🎭 AI Demo Mode: DEMO_MODE", DEMO_MODE);
    if (DEMO_MODE) {
        console.log("🎭 AI Demo Mode: Generating simulated response");
        return await generateDemoResponse(instruction, editorContext);
    }

    try {
        const systemPrompt = buildSystemPrompt();
        const userPrompt = buildUserPrompt(instruction, editorContext);

        if (AI_PROVIDER === "openai") {
            return await callOpenAI(systemPrompt, userPrompt);
        } else {
            throw new Error(`AI provider ${AI_PROVIDER} not yet supported`);
        }
    } catch (error) {
        console.error("AI edit generation failed:", error);
        throw error;
    }
}

/**
 * Generate markdown-based AI edits (NEW: future-proof approach)
 * Returns edits with markdown character positions instead of node keys
 */
export async function generateMarkdownAIEdits(
    instruction: string,
    context: MarkdownEditorContext
): Promise<MarkdownAIResponse> {
    console.log("🎭 AI Demo Mode: DEMO_MODE", DEMO_MODE);
    if (DEMO_MODE) {
        console.log("🎭 AI Demo Mode: Generating markdown-based simulated response");
        return await generateMarkdownDemoResponse(instruction, context);
    }

    try {
        const systemPrompt = buildMarkdownSystemPrompt();
        const userPrompt = buildMarkdownUserPrompt(instruction, context);

        if (AI_PROVIDER === "openai") {
            return await callOpenAIForMarkdown(systemPrompt, userPrompt);
        } else {
            throw new Error(`AI provider ${AI_PROVIDER} not yet supported`);
        }
    } catch (error) {
        console.error("Markdown AI edit generation failed:", error);
        throw error;
    }
}

/**
 * Build system prompt for AI (legacy node-based)
 */
function buildSystemPrompt(): string {
    return `You are an AI assistant that helps edit financial documents. 
You receive a document structure with node keys and user instructions.
Your job is to return precise edit instructions in JSON format.

Response format:
{
    "edits": [
        {
            "nodeKey": "the node key to edit",
            "action": "replace",
            "newContent": "the new text content",
            "formatting": { "bold": true, "italic": false }
        }
    ],
    "explanation": "Brief explanation of changes made"
}

Rules:
1. ALWAYS return valid JSON
2. Use exact node keys from the provided context
3. Only edit nodes that are relevant to the user's instruction
4. Preserve formatting unless instructed to change it
5. For financial values, maintain proper formatting ($, commas, etc.)
6. If no edits are needed, return empty edits array
7. Keep content concise and professional`;
}

/**
 * Build system prompt for markdown-based AI editing
 */
function buildMarkdownSystemPrompt(): string {
    return `You are an AI assistant that helps edit financial documents in markdown format.
You receive the full document in markdown and user instructions.
Your job is to return precise edit instructions with character positions in JSON format.

Response format:
{
    "edits": [
        {
            "startOffset": 150,
            "endOffset": 165,
            "newContent": "replacement text"
        }
    ],
    "explanation": "Brief explanation of changes made"
}

Rules:
1. ALWAYS return valid JSON
2. Use character positions (startOffset, endOffset) in the markdown string
3. Preserve markdown syntax (headers with #, lists with -, bold with **, etc.)
4. Only edit text that is relevant to the user's instruction
5. For financial values, maintain proper formatting ($, commas, etc.)
6. If no edits are needed, return empty edits array with explanation
7. Keep content concise and professional
8. Maintain document structure and formatting`;
}

/**
 * Build user prompt with instruction and context (legacy node-based)
 */
function buildUserPrompt(instruction: string, context: EditorContext): string {
    let prompt = `User instruction: ${instruction}\n\n`;
    
    if (context.selection) {
        prompt += `Selected text: "${context.selection.text}"\n`;
        prompt += `Selected node keys: ${context.selection.nodeKeys.join(", ")}\n\n`;
    }

    prompt += `Document structure:\n`;
    prompt += JSON.stringify(context.nodes, null, 2);
    
    return prompt;
}

/**
 * Build user prompt for markdown-based editing
 */
function buildMarkdownUserPrompt(instruction: string, context: MarkdownEditorContext): string {
    let prompt = `User instruction: ${instruction}\n\n`;
    
    if (context.selection) {
        prompt += `Selected text (position ${context.selection.startOffset}-${context.selection.endOffset}):\n`;
        prompt += `"${context.selection.text}"\n\n`;
        prompt += `Context:\n`;
        prompt += `...${context.selection.contextBefore}[SELECTION]${context.selection.contextAfter}...\n\n`;
    }

    if (context.documentMetadata) {
        prompt += `Document metadata:\n`;
        prompt += `- Current page: ${context.documentMetadata.currentPage} of ${context.documentMetadata.pageCount}\n\n`;
    }
    
    prompt += `Full document (markdown):\n`;
    prompt += `\`\`\`markdown\n${context.fullMarkdown}\n\`\`\``;
    
    return prompt;
}

/**
 * Call OpenAI API (legacy node-based)
 */
async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<AIEditResponse> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${AI_API_KEY}`,
        },
        body: JSON.stringify({
            model: AI_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
        throw new Error("No response from AI");
    }

    try {
        const parsed = JSON.parse(content) as AIEditResponse;
        return parsed;
    } catch (error) {
        console.error("Failed to parse AI response:", content);
        throw new Error("Invalid AI response format");
    }
}

/**
 * Call OpenAI API for markdown-based editing
 */
async function callOpenAIForMarkdown(systemPrompt: string, userPrompt: string): Promise<MarkdownAIResponse> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${AI_API_KEY}`,
        },
        body: JSON.stringify({
            model: AI_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
        throw new Error("No response from AI");
    }

    try {
        const parsed = JSON.parse(content) as MarkdownAIResponse;
        return parsed;
    } catch (error) {
        console.error("Failed to parse AI response:", content);
        throw new Error("Invalid AI response format");
    }
}

/**
 * Generate demo/simulated AI response for testing UX
 */
async function generateDemoResponse(
    instruction: string,
    context: EditorContext
): Promise<AIEditResponse> {
    // Simulate API delay
    await sleep(800);
    console.log("🎭 AI Demo Mode: Generating simulated response ---------------- ");

    const lowerInstruction = instruction.toLowerCase();
    const edits: AIEditResponse["edits"] = [];

    // If there's a selection, edit the selected nodes
    if (context.selection && context.selection.nodeKeys.length > 0) {
        const selectedText = context.selection.text;
        const nodeKey = context.selection.nodeKeys[0]; // Use first node key

        let newContent = selectedText;
        let explanation = "";

        if (lowerInstruction.includes("increase") || lowerInstruction.includes("add")) {
            // Try to find numbers and increase them
            newContent = selectedText.replace(/(\$?[\d,]+)/g, (match) => {
                const num = parseInt(match.replace(/[$,]/g, ""));
                if (!isNaN(num)) {
                    const increased = Math.floor(num * 1.5);
                    return match.includes("$") ? `$${increased.toLocaleString()}` : increased.toString();
                }
                return match;
            });
            explanation = "Increased values in selected text by 50%";
        } else if (lowerInstruction.includes("double")) {
            newContent = selectedText.replace(/(\$?[\d,]+)/g, (match) => {
                const num = parseInt(match.replace(/[$,]/g, ""));
                if (!isNaN(num)) {
                    const doubled = num * 2;
                    return match.includes("$") ? `$${doubled.toLocaleString()}` : doubled.toString();
                }
                return match;
            });
            explanation = "Doubled all numeric values in selection";
        } else if (lowerInstruction.includes("reduce") || lowerInstruction.includes("decrease")) {
            newContent = selectedText.replace(/(\$?[\d,]+)/g, (match) => {
                const num = parseInt(match.replace(/[$,]/g, ""));
                if (!isNaN(num)) {
                    const reduced = Math.floor(num * 0.75);
                    return match.includes("$") ? `$${reduced.toLocaleString()}` : reduced.toString();
                }
                return match;
            });
            explanation = "Reduced values in selected text by 25%";
        } else if (lowerInstruction.includes("uppercase") || lowerInstruction.includes("caps")) {
            newContent = selectedText.toUpperCase();
            explanation = "Converted selected text to uppercase";
        } else if (lowerInstruction.includes("lowercase")) {
            newContent = selectedText.toLowerCase();
            explanation = "Converted selected text to lowercase";
        } else if (lowerInstruction.includes("title case")) {
            newContent = selectedText.replace(/\w\S*/g, (txt) => 
                txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            );
            explanation = "Converted selected text to title case";
        } else {
            // Generic modification - just append " [EDITED]"
            newContent = selectedText + " [Edited by AI]";
            explanation = "Applied requested modification to selected text";
        }

        edits.push({
            nodeKey,
            action: "replace",
            newContent,
        });
        console.log("Demo response --- :", { edits, explanation });

        return { edits, explanation };
    }

    // No selection - do document-wide simulation
    // Find first few text nodes and modify them
    const textNodes = context.nodes.filter(node => node.text && node.text.length > 5).slice(0, 3);
    
    for (const node of textNodes) {
        if (lowerInstruction.includes("cash") || lowerInstruction.includes("asset")) {
            // Simulate editing financial values
            const newText = node.text.replace(/(\$[\d,]+)/g, (match) => {
                const num = parseInt(match.replace(/[$,]/g, ""));
                if (!isNaN(num)) {
                    const increased = Math.floor(num * 1.1);
                    return `$${increased.toLocaleString()}`;
                }
                return match;
            });

            if (newText !== node.text) {
                edits.push({
                    nodeKey: node.key,
                    action: "replace",
                    newContent: newText,
                });
            }
        }
    }

    const explanation = edits.length > 0 
        ? `Updated ${edits.length} node(s) based on your instruction`
        : "No changes needed for this instruction";

    return { edits, explanation };
}

/**
 * Generate markdown-based demo response for testing UX
 */
async function generateMarkdownDemoResponse(
    instruction: string,
    context: MarkdownEditorContext
): Promise<MarkdownAIResponse> {
    // Simulate API delay
    await sleep(800);
    console.log("🎭 AI Demo Mode: Generating markdown-based simulated response");
    console.log("🎭 AI Demo Mode: context", context);
    console.log("🎭 AI Demo Mode: instruction", instruction);

    const lowerInstruction = instruction.toLowerCase();
    const edits: MarkdownAIResponse["edits"] = [];

    // If there's a selection, edit the selected text
    if (context.selection) {
        const { startOffset, endOffset, text } = context.selection;
        let newContent = text;
        let explanation = "";

        if (lowerInstruction.includes("increase") || lowerInstruction.includes("add")) {
            // Try to find numbers and increase them
            newContent = text.replace(/(\$?[\d,]+)/g, (match) => {
                const num = parseInt(match.replace(/[$,]/g, ""));
                if (!isNaN(num)) {
                    const increased = Math.floor(num * 1.5);
                    return match.includes("$") ? `$${increased.toLocaleString()}` : increased.toString();
                }
                return match;
            });
            explanation = "Increased values in selected text by 50%";
        } else if (lowerInstruction.includes("double")) {
            newContent = text.replace(/(\$?[\d,]+)/g, (match) => {
                const num = parseInt(match.replace(/[$,]/g, ""));
                if (!isNaN(num)) {
                    const doubled = num * 2;
                    return match.includes("$") ? `$${doubled.toLocaleString()}` : doubled.toString();
                }
                return match;
            });
            explanation = "Doubled all numeric values in selection";
        } else if (lowerInstruction.includes("reduce") || lowerInstruction.includes("decrease")) {
            newContent = text.replace(/(\$?[\d,]+)/g, (match) => {
                const num = parseInt(match.replace(/[$,]/g, ""));
                if (!isNaN(num)) {
                    const reduced = Math.floor(num * 0.75);
                    return match.includes("$") ? `$${reduced.toLocaleString()}` : reduced.toString();
                }
                return match;
            });
            explanation = "Reduced values in selected text by 25%";
        } else if (lowerInstruction.includes("uppercase") || lowerInstruction.includes("caps")) {
            newContent = text.toUpperCase();
            explanation = "Converted selected text to uppercase";
        } else if (lowerInstruction.includes("lowercase")) {
            newContent = text.toLowerCase();
            explanation = "Converted selected text to lowercase";
        } else if (lowerInstruction.includes("title case")) {
            newContent = text.replace(/\w\S*/g, (txt) => 
                txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            );
            explanation = "Converted selected text to title case";
        } else {
            // Generic modification
            newContent = text + " [Edited by AI]";
            explanation = "Applied requested modification to selected text";
        }

        edits.push({
            startOffset,
            endOffset,
            newContent,
        });

        console.log("Markdown demo response:", { edits, explanation });
        return { edits, explanation };
    }

    // No selection - do document-wide simulation
    // Find numeric values and modify them
    const markdown = context.fullMarkdown;
    if (lowerInstruction.includes("cash") || lowerInstruction.includes("asset")) {
        const matches = [...markdown.matchAll(/\$[\d,]+/g)];
        
        for (const match of matches.slice(0, 3)) { // Limit to 3 edits for demo
            if (match.index !== undefined) {
                const originalValue = match[0];
                const num = parseInt(originalValue.replace(/[$,]/g, ""));
                if (!isNaN(num)) {
                    const increased = Math.floor(num * 1.1);
                    const newValue = `$${increased.toLocaleString()}`;
                    
                    edits.push({
                        startOffset: match.index,
                        endOffset: match.index + originalValue.length,
                        newContent: newValue,
                    });
                }
            }
        }
    }

    const explanation = edits.length > 0 
        ? `Updated ${edits.length} value(s) based on your instruction`
        : "No changes needed for this instruction";

    return { edits, explanation };
}

/**
 * Utility to sleep for animations
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

