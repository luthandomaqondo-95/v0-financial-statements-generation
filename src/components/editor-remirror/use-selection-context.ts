"use client";

import { useCallback, useRef } from "react";
import { useHelpers, useRemirrorContext } from "@remirror/react";

export interface SelectionContext {
  /** Is there a non-empty selection? */
  hasSelection: boolean;
  /** ProseMirror from position */
  from: number;
  /** ProseMirror to position */
  to: number;
  /** The plain text of the selection */
  selectedText: string;
  /** The markdown of the selection (best-effort extraction) */
  selectedMarkdown: string;
  /** Full document markdown */
  fullMarkdown: string;
  /** Character offset of the selection start within the full markdown */
  markdownFrom: number;
  /** Character offset of the selection end within the full markdown */
  markdownTo: number;
  /** Context: a few lines before and after the selection in markdown */
  surroundingContext: string;
}

const EMPTY_CONTEXT: SelectionContext = {
  hasSelection: false,
  from: 0,
  to: 0,
  selectedText: "",
  selectedMarkdown: "",
  fullMarkdown: "",
  markdownFrom: -1,
  markdownTo: -1,
  surroundingContext: "",
};

/**
 * Returns a function that captures the current editor selection on demand
 * (e.g. on mouseup / keyboard selection end) instead of reactively on every
 * state change.  This avoids interfering with the selection while the user
 * is still dragging.
 */
export function useSelectionCapture() {
  const { getState } = useRemirrorContext();
  const helpers = useHelpers(true);
  const lastCtx = useRef<SelectionContext>(EMPTY_CONTEXT);

  const capture = useCallback((): SelectionContext => {
    const state = getState();
    const { from, to, empty } = state.selection;

    let fullMarkdown = "";
    try {
      fullMarkdown = helpers.getMarkdown() || "";
    } catch {
      fullMarkdown = "";
    }

    if (empty) {
      const ctx: SelectionContext = {
        ...EMPTY_CONTEXT,
        from,
        to,
        fullMarkdown,
      };
      lastCtx.current = ctx;
      return ctx;
    }

    // --- Exact selected text from ProseMirror document ---
    const selectedText = state.doc.textBetween(from, to, "\n", "\n");

    // Use the exact text extracted from ProseMirror as the markdown
    // representation. This is always accurate because textBetween extracts
    // character-by-character from the document structure.
    const selectedMarkdown = selectedText;

    // --- Map to approximate markdown positions ---
    // Use a simple indexOf approach on the full markdown with the selected
    // text. To avoid false positives on very short strings, only attempt
    // mapping for selections longer than 8 characters.
    let markdownFrom = -1;
    let markdownTo = -1;

    if (selectedText.length > 8) {
      const idx = fullMarkdown.indexOf(selectedText);
      if (idx !== -1) {
        markdownFrom = idx;
        markdownTo = idx + selectedText.length;
      }
    }

    // Fallback: try matching the first line of the selected text
    if (markdownFrom === -1 && selectedText.trim().length > 0) {
      const firstLine = selectedText.split("\n")[0].trim();
      if (firstLine.length > 4) {
        const idx = fullMarkdown.indexOf(firstLine);
        if (idx !== -1) {
          markdownFrom = idx;
          markdownTo = idx + selectedText.length;
          // Clamp to markdown length
          if (markdownTo > fullMarkdown.length) {
            markdownTo = fullMarkdown.length;
          }
        }
      }
    }

    // --- Build surrounding context (3 lines before and after) ---
    const contextPadding = 3;
    const allLines = fullMarkdown.split("\n");
    let startCtx = 0;
    let endCtx = allLines.length;

    if (markdownFrom >= 0) {
      // Find the line containing markdownFrom
      let charCount = 0;
      for (let i = 0; i < allLines.length; i++) {
        const lineEnd = charCount + allLines[i].length + 1;
        if (lineEnd > markdownFrom) {
          startCtx = Math.max(0, i - contextPadding);
          break;
        }
        charCount = lineEnd;
      }
      charCount = 0;
      for (let i = 0; i < allLines.length; i++) {
        charCount += allLines[i].length + 1;
        if (charCount >= markdownTo) {
          endCtx = Math.min(allLines.length, i + contextPadding + 1);
          break;
        }
      }
    }

    const surroundingContext = allLines.slice(startCtx, endCtx).join("\n");

    const ctx: SelectionContext = {
      hasSelection: true,
      from,
      to,
      selectedText,
      selectedMarkdown,
      fullMarkdown,
      markdownFrom,
      markdownTo,
      surroundingContext,
    };
    lastCtx.current = ctx;
    return ctx;
  }, [getState, helpers]);

  return { capture, lastCtx };
}
