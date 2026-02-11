"use client";

import { useCallback, useRef, useState } from "react";
import { useRemirrorContext } from "@remirror/react";
import type { AiEditPhase } from "./extensions/ai-edit-extension";

export interface AiEditController {
  /** Current phase of the AI edit */
  phase: AiEditPhase;
  /** Whether an edit is currently in progress */
  isEditing: boolean;
  /**
   * Start a streaming AI edit.
   * @param from  ProseMirror start position
   * @param to    ProseMirror end position
   * @param getStream  An async generator or callback that yields text chunks.
   *                   For the simulation, we provide a default.
   */
  startEdit: (
    from: number,
    to: number,
    simulatedResponse?: string,
  ) => Promise<void>;
  /** Cancel the current edit */
  cancelEdit: () => void;
}

/**
 * Simulates a realistic AI response based on the selected text and prompt.
 */
function generateSimulatedResponse(
  selectedText: string,
  _prompt?: string,
): string {
  // A simple simulation: rewrite the selected text in a more polished way
  const words = selectedText.split(/\s+/).filter(Boolean);

  if (words.length <= 3) {
    return `[AI revised] ${selectedText}`;
  }

  // Simulate a meaningful rewrite by shuffling words and adding flair
  return `${selectedText.trim()} (enhanced by AI with improved clarity and conciseness)`;
}

/**
 * Hook that drives AI edit streaming through the AiEditExtension.
 * Must be used inside a <Remirror> context that includes AiEditExtension.
 */
export function useAiEdit(): AiEditController {
  const { commands, view } = useRemirrorContext();
  const [phase, setPhase] = useState<AiEditPhase>("idle");
  const cancelledRef = useRef(false);
  const editingRef = useRef(false);

  const cancelEdit = useCallback(() => {
    cancelledRef.current = true;
    editingRef.current = false;
    setPhase("idle");
    try {
      commands.cancelEdit();
    } catch {
      // Extension might not be available
    }
  }, [commands]);

  const startEdit = useCallback(
    async (from: number, to: number, simulatedResponse?: string) => {
      if (editingRef.current) return;
      editingRef.current = true;
      cancelledRef.current = false;

      // Get the selected text for simulation
      const selectedText = view.state.doc.textBetween(from, to, "\n", "\n");
      const responseText =
        simulatedResponse ??
        generateSimulatedResponse(selectedText);

      // Phase 1: Highlight
      setPhase("highlight");
      commands.highlightRange(from, to);

      // Wait a beat so the user sees the highlight
      await new Promise((r) => setTimeout(r, 600));
      if (cancelledRef.current) return;

      // Phase 2: Start streaming
      setPhase("streaming");
      commands.startStreaming();

      await new Promise((r) => setTimeout(r, 200));
      if (cancelledRef.current) return;

      // Stream characters one by one with a realistic typing speed
      for (let i = 0; i < responseText.length; i++) {
        if (cancelledRef.current) return;

        const char = responseText[i];
        commands.insertStreamedText(char);

        // Variable typing speed: faster for spaces, slower for punctuation
        let delay = 25 + Math.random() * 25; // 25-50ms base
        if (char === " ") delay = 15;
        if (".!?,:;".includes(char)) delay = 60 + Math.random() * 40;
        if (char === "\n") delay = 80;

        await new Promise((r) => setTimeout(r, delay));
      }

      if (cancelledRef.current) return;

      // Delete any remaining old text that wasn't replaced
      commands.deleteRemainingOldText();

      // Phase 3: Done
      setPhase("done");
      commands.finishEdit();

      // Reset phase after the done highlight fades
      setTimeout(() => {
        if (!cancelledRef.current) {
          setPhase("idle");
          editingRef.current = false;
        }
      }, 2200);
    },
    [commands, view],
  );

  return {
    phase,
    isEditing: editingRef.current,
    startEdit,
    cancelEdit,
  };
}
