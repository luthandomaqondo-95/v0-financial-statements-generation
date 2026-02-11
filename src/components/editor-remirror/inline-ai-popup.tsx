"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRemirrorContext } from "@remirror/react";
import { Sparkles, Send, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
	useSelectionCapture,
	type SelectionContext,
} from "./use-selection-context";
import { useAiEdit } from "./use-ai-edit";

/**
 * Inline floating popup that appears directly above the user's text selection.
 * Uses the browser's native Selection API for positioning so coordinates
 * are always accurate regardless of scroll position.
 * Does NOT auto-focus the input, so the browser selection highlight remains.
 */
export function InlineAIPopup() {
	const { view } = useRemirrorContext();
	const { capture } = useSelectionCapture();
	const aiEdit = useAiEdit();
	const [selectionCtx, setSelectionCtx] = useState<SelectionContext | null>(
		null,
	);
	const [popupStyle, setPopupStyle] = useState<React.CSSProperties | null>(
		null,
	);
	const [inputValue, setInputValue] = useState("");
	const [dismissed, setDismissed] = useState(false);
	const popupRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const dismissedSelectionRef = useRef<string>("");

	/**
	 * Position the popup above the native browser selection range.
	 * We get the bounding rect of the range itself (not ProseMirror coords)
	 * and place the popup relative to the scroll container.
	 */
	const positionPopup = useCallback(() => {
		const domSelection = window.getSelection();
		if (!domSelection || domSelection.rangeCount === 0 || domSelection.isCollapsed) {
			setPopupStyle(null);
			return;
		}

		const range = domSelection.getRangeAt(0);
		const rangeRect = range.getBoundingClientRect();

		// Find the scroll container (the .overflow-auto wrapper)
		const scrollContainer = view.dom.closest(".overflow-auto");
		if (!scrollContainer) {
			setPopupStyle(null);
			return;
		}
		const containerRect = scrollContainer.getBoundingClientRect();

		// Position above the selection, centered on the range
		const popupWidth = 320;
		const gap = 8;
		let left = rangeRect.left - containerRect.left + rangeRect.width / 2 - popupWidth / 2;
		const top = rangeRect.top - containerRect.top + scrollContainer.scrollTop - gap;

		// Clamp left so the popup stays within the container
		left = Math.max(8, Math.min(left, containerRect.width - popupWidth - 8));

		setPopupStyle({
			position: "absolute",
			top: `${top}px`,
			left: `${left}px`,
			width: `${popupWidth}px`,
			transform: "translateY(-100%)",
			zIndex: 40,
		});
	}, [view]);

	// Capture selection on mouseup and keyup (Shift+Arrow selections)
	useEffect(() => {
		const editorDom = view.dom;

		const handleSelectionEnd = () => {
			requestAnimationFrame(() => {
				const ctx = capture();

				if (!ctx.hasSelection) {
					setSelectionCtx(null);
					setPopupStyle(null);
					setDismissed(false);
					dismissedSelectionRef.current = "";
					return;
				}

				// If user dismissed this particular selection, don't re-show
				if (
					dismissed &&
					dismissedSelectionRef.current === ctx.selectedText
				) {
					return;
				}

				// If selection changed, reset dismissed state
				if (dismissedSelectionRef.current !== ctx.selectedText) {
					setDismissed(false);
					dismissedSelectionRef.current = "";
				}

				setSelectionCtx(ctx);
				positionPopup();
			});
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.shiftKey || e.key === "Escape") {
				handleSelectionEnd();
			}
		};

		editorDom.addEventListener("mouseup", handleSelectionEnd);
		editorDom.addEventListener("keyup", handleKeyUp);

		return () => {
			editorDom.removeEventListener("mouseup", handleSelectionEnd);
			editorDom.removeEventListener("keyup", handleKeyUp);
		};
	}, [view, capture, dismissed, positionPopup]);

	// Clear when clicking outside collapses selection
	useEffect(() => {
		const handleDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;

      // Ignore clicks inside the popup itself
      if (target && popupRef.current?.contains(target)) return;

      // Only react to clicks that happen inside the editor DOM.
      // Clicking elsewhere in the UI (e.g. ChatPanel) should NOT
      // clear the selection or hide the popup.
      if (target && !view.dom.contains(target)) return;

			requestAnimationFrame(() => {
				const ctx = capture();
				if (!ctx.hasSelection) {
					setSelectionCtx(null);
					setPopupStyle(null);
					setDismissed(false);
					dismissedSelectionRef.current = "";
				}
			});
		};

    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [capture, view]);

	const handleSubmit = useCallback(() => {
		if (!inputValue.trim() || !selectionCtx) return;

		const { from, to } = selectionCtx;
		const prompt = inputValue.trim();

		// Dispatch event for the chat panel to track
		window.dispatchEvent(
			new CustomEvent("editor-ai-request", {
				detail: {
					prompt,
					selection: selectionCtx,
				},
			}),
		);

		setInputValue("");
		setDismissed(true);
		dismissedSelectionRef.current = selectionCtx.selectedText;

		// Trigger the streaming AI edit on the selected range
		aiEdit.startEdit(from, to);
	}, [inputValue, selectionCtx, aiEdit]);

	const handleDismiss = useCallback(() => {
		setDismissed(true);
		if (selectionCtx) {
			dismissedSelectionRef.current = selectionCtx.selectedText;
		}
	}, [selectionCtx]);

	if (!selectionCtx?.hasSelection || !popupStyle || dismissed) return null;

	return (
		<AnimatePresence>
			<motion.div
				ref={popupRef}
				style={popupStyle}
				className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl"
				onMouseDown={(e) => {
					// Allow focusing the input, but prevent clicks on the chrome
					// from collapsing the editor selection.
					if (!(e.target instanceof HTMLInputElement)) {
						e.preventDefault();
					}
				}}
				initial={{ opacity: 0, scale: 0.8, y: -10 }}
				animate={{ opacity: 1, scale: 1, y: -35 }}
				exit={{ opacity: 0, scale: 0.8, y: -10 }}
				transition={{
					type: "spring",
					stiffness: 400,
					damping: 25,
					mass: 0.8,
				}}
			>
				<div className="flex items-center gap-2 px-3 py-2">
					<Sparkles
						size={14}
						className="text-[hsl(var(--primary))] flex-shrink-0"
					/>
					<input
						ref={inputRef}
						type="text"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								handleSubmit();
							}
							if (e.key === "Escape") {
								handleDismiss();
							}
						}}
						placeholder="Ask AI to edit selection..."
						className="flex-1 text-sm bg-transparent border-none outline-none text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
					/>
					<button
						type="button"
						onClick={handleSubmit}
						disabled={!inputValue.trim() || aiEdit.phase !== "idle"}
						className="flex items-center justify-center w-6 h-6 rounded-md text-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
					>
						{aiEdit.phase !== "idle" ? (
							<Loader2 size={12} className="animate-spin" />
						) : (
							<Send size={12} />
						)}
					</button>
					<button
						type="button"
						onClick={handleDismiss}
						className="flex items-center justify-center w-6 h-6 rounded-md text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition-colors cursor-pointer"
					>
						<X size={12} />
					</button>
				</div>
			</motion.div>
		</AnimatePresence>
	);
}
