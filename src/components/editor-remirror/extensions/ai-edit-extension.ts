"use client";

import {
  PlainExtension,
  extension,
  getTextSelection,
} from "remirror";
import type { EditorView } from "@remirror/pm/view";
import { Decoration, DecorationSet } from "@remirror/pm/view";
import type { EditorState, Transaction } from "@remirror/pm/state";
import { Plugin, PluginKey } from "@remirror/pm/state";

// ───────────────────────────── Types ──────────────────────────────

export interface AiEditRange {
  /** ProseMirror document position – start of the region to replace */
  from: number;
  /** ProseMirror document position – end of the region to replace */
  to: number;
}

export type AiEditPhase =
  | "idle"
  | "highlight" // blue highlight visible, waiting for stream
  | "streaming" // characters are being inserted
  | "done"; // edit finished

interface AiPluginState {
  phase: AiEditPhase;
  /** Original range that was highlighted (before any edits) */
  originalRange: AiEditRange | null;
  /** Current insertion cursor (moves forward as chars arrive) */
  insertPos: number;
  /** How many characters of the new text have been inserted so far */
  insertedLen: number;
  /** Decorations for the highlight / active region */
  decorations: DecorationSet;
}

// ──────────────────────── ProseMirror plugin ──────────────────────

const AI_EDIT_KEY = new PluginKey<AiPluginState>("ai-edit");

/** Metadata actions we attach to transactions */
interface AiMeta {
  action:
    | "start-highlight"
    | "start-streaming"
    | "insert-char"
    | "finish"
    | "cancel";
  from?: number;
  to?: number;
  /** The character(s) being inserted for "insert-char" */
  text?: string;
}

function buildDecorations(
  doc: EditorState["doc"],
  phase: AiEditPhase,
  from: number,
  to: number,
  insertPos: number,
  insertedLen: number,
): DecorationSet {
  const decos: Decoration[] = [];

  if (phase === "highlight" && from < to) {
    // Full blue highlight on the target range
    decos.push(
      Decoration.inline(from, to, {
        class: "ai-edit-highlight",
      }),
    );
  }

  if (phase === "streaming") {
    // Already-inserted new text: green tint
    if (insertedLen > 0 && insertPos > from) {
      const newFrom = insertPos - insertedLen;
      const newTo = insertPos;
      if (newFrom < newTo) {
        decos.push(
          Decoration.inline(newFrom, newTo, {
            class: "ai-edit-new-text",
          }),
        );
      }
    }

    // Remaining old text that hasn't been replaced yet (still blue but faded)
    if (insertPos < to) {
      decos.push(
        Decoration.inline(insertPos, to, {
          class: "ai-edit-pending",
        }),
      );
    }
  }

  if (phase === "done" && insertedLen > 0) {
    const newFrom = insertPos - insertedLen;
    const newTo = insertPos;
    if (newFrom < newTo && newTo <= doc.content.size) {
      decos.push(
        Decoration.inline(newFrom, newTo, {
          class: "ai-edit-done",
        }),
      );
    }
  }

  return DecorationSet.create(doc, decos);
}

function createAiEditPlugin(): Plugin<AiPluginState> {
  return new Plugin<AiPluginState>({
    key: AI_EDIT_KEY,
    state: {
      init(): AiPluginState {
        return {
          phase: "idle",
          originalRange: null,
          insertPos: 0,
          insertedLen: 0,
          decorations: DecorationSet.empty,
        };
      },

      apply(tr: Transaction, prev: AiPluginState): AiPluginState {
        const meta: AiMeta | undefined = tr.getMeta(AI_EDIT_KEY);

        if (!meta) {
          // Map decorations through the transaction's mapping if the doc changed
          if (tr.docChanged) {
            return {
              ...prev,
              decorations: prev.decorations.map(tr.mapping, tr.doc),
            };
          }
          return prev;
        }

        switch (meta.action) {
          case "start-highlight": {
            const from = meta.from ?? 0;
            const to = meta.to ?? 0;
            const decorations = buildDecorations(
              tr.doc,
              "highlight",
              from,
              to,
              from,
              0,
            );
            return {
              phase: "highlight",
              originalRange: { from, to },
              insertPos: from,
              insertedLen: 0,
              decorations,
            };
          }

          case "start-streaming": {
            // Transition from highlight to streaming – keep the same range
            if (!prev.originalRange) return prev;
            const { from, to } = prev.originalRange;
            const decorations = buildDecorations(
              tr.doc,
              "streaming",
              from,
              to,
              from,
              0,
            );
            return {
              ...prev,
              phase: "streaming",
              insertPos: from,
              insertedLen: 0,
              decorations,
            };
          }

          case "insert-char": {
            if (!prev.originalRange) return prev;
            const text = meta.text ?? "";
            // After the transaction, the insertPos has shifted.
            // The transaction itself inserted `text` at prev.insertPos and
            // deleted one character of old text (if available).
            const newInsertedLen = prev.insertedLen + text.length;
            // Recompute the "to" by mapping through this transaction
            const newTo = tr.mapping.map(prev.originalRange.to);
            const newInsertPos = prev.insertPos + text.length;

            const decorations = buildDecorations(
              tr.doc,
              "streaming",
              prev.originalRange.from,
              newTo,
              newInsertPos,
              newInsertedLen,
            );
            return {
              ...prev,
              insertPos: newInsertPos,
              insertedLen: newInsertedLen,
              originalRange: { from: prev.originalRange.from, to: newTo },
              decorations,
            };
          }

          case "finish": {
            if (!prev.originalRange) {
              return {
                phase: "idle",
                originalRange: null,
                insertPos: 0,
                insertedLen: 0,
                decorations: DecorationSet.empty,
              };
            }
            const decorations = buildDecorations(
              tr.doc,
              "done",
              prev.originalRange.from,
              prev.originalRange.to,
              prev.insertPos,
              prev.insertedLen,
            );
            return {
              ...prev,
              phase: "done",
              decorations,
            };
          }

          case "cancel": {
            return {
              phase: "idle",
              originalRange: null,
              insertPos: 0,
              insertedLen: 0,
              decorations: DecorationSet.empty,
            };
          }

          default:
            return prev;
        }
      },
    },

    props: {
      decorations(state: EditorState) {
        return AI_EDIT_KEY.getState(state)?.decorations ?? DecorationSet.empty;
      },
    },
  });
}

// ──────────────────── Remirror Extension wrapper ──────────────────

@extension({ defaultOptions: {} })
export class AiEditExtension extends PlainExtension {
  get name() {
    return "aiEdit" as const;
  }

  createPlugin() {
    return createAiEditPlugin();
  }

  // ─── Commands exposed to React ───

  /**
   * Phase 1: Highlight the target range in blue.
   */
  highlightRange(from: number, to: number) {
    return (props: { view: EditorView }) => {
      const { view } = props;
      const tr = view.state.tr;
      tr.setMeta(AI_EDIT_KEY, {
        action: "start-highlight",
        from,
        to,
      } satisfies AiMeta);
      view.dispatch(tr);
      return true;
    };
  }

  /**
   * Phase 2: Begin streaming (transitions the visual state).
   */
  startStreaming() {
    return (props: { view: EditorView }) => {
      const { view } = props;
      const tr = view.state.tr;
      tr.setMeta(AI_EDIT_KEY, {
        action: "start-streaming",
      } satisfies AiMeta);
      view.dispatch(tr);
      return true;
    };
  }

  /**
   * Phase 2 (continued): Insert a chunk of streamed text.
   * Deletes one old character and inserts the new character(s).
   */
  insertStreamedText(text: string) {
    return (props: { view: EditorView }) => {
      const { view } = props;
      const pluginState = AI_EDIT_KEY.getState(view.state);
      if (!pluginState || pluginState.phase !== "streaming") return false;

      const { insertPos, originalRange } = pluginState;
      if (!originalRange) return false;

      const tr = view.state.tr;

      // Delete one old character at the insert position (if there's still
      // old text remaining) and insert the new character(s).
      const oldEnd = originalRange.to;
      const hasOldChar = insertPos < oldEnd;

      if (hasOldChar) {
        // Replace one old char with the new text
        tr.replaceWith(
          insertPos,
          insertPos + 1,
          view.state.schema.text(text),
        );
      } else {
        // Past the old range – just insert
        tr.insert(insertPos, view.state.schema.text(text));
      }

      tr.setMeta(AI_EDIT_KEY, {
        action: "insert-char",
        text,
      } satisfies AiMeta);

      view.dispatch(tr);
      return true;
    };
  }

  /**
   * Delete remaining old text that wasn't replaced (new text was shorter).
   */
  deleteRemainingOldText() {
    return (props: { view: EditorView }) => {
      const { view } = props;
      const pluginState = AI_EDIT_KEY.getState(view.state);
      if (!pluginState || !pluginState.originalRange) return false;

      const { insertPos, originalRange } = pluginState;
      if (insertPos < originalRange.to) {
        const tr = view.state.tr;
        tr.delete(insertPos, originalRange.to);
        view.dispatch(tr);
      }
      return true;
    };
  }

  /**
   * Phase 3: Mark the edit as done.
   */
  finishEdit() {
    return (props: { view: EditorView }) => {
      const { view } = props;
      const tr = view.state.tr;
      tr.setMeta(AI_EDIT_KEY, { action: "finish" } satisfies AiMeta);
      view.dispatch(tr);

      // Auto-clear the "done" highlight after a delay
      setTimeout(() => {
        const clearTr = view.state.tr;
        clearTr.setMeta(AI_EDIT_KEY, { action: "cancel" } satisfies AiMeta);
        view.dispatch(clearTr);
      }, 2000);

      return true;
    };
  }

  /**
   * Cancel / reset everything.
   */
  cancelEdit() {
    return (props: { view: EditorView }) => {
      const { view } = props;
      const tr = view.state.tr;
      tr.setMeta(AI_EDIT_KEY, { action: "cancel" } satisfies AiMeta);
      view.dispatch(tr);
      return true;
    };
  }

  /**
   * Get the current phase.
   */
  getPhase(view: EditorView): AiEditPhase {
    return AI_EDIT_KEY.getState(view.state)?.phase ?? "idle";
  }
}
