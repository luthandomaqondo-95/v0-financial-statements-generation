"use client";

import React, { useCallback, useState, useRef, useEffect } from "react";
import { useCommands, useActive } from "@remirror/react";
import { 
	Bold, Italic, Underline, Strikethrough, List, ListOrdered, CheckSquare, ImageIcon, 
	AlignLeft, AlignCenter, AlignRight, AlignJustify, 
	Link, Highlighter, Minus, Subscript, Superscript, 
	ChevronDown, Type, PaintBucket, Palette, CaseSensitive, ListTree,
	Undo2, Redo2, Plus 
} from "lucide-react";

/* ── Shared UI ─────────────────────────────────────────────── */

function ToolbarButton({
	onClick,
	active = false,
	disabled = false,
	title,
	children,
	className = "",
}: {
	onClick: () => void;
	active?: boolean;
	disabled?: boolean;
	title: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<button
			type="button"
			onMouseDown={(e) => {
				e.preventDefault();
				onClick();
			}}
			disabled={disabled}
			title={title}
			className={`flex items-center justify-center w-8 h-8 rounded transition-colors ${active
					? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
					: "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--editor-active))]"
				} ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${className}`}
		>
			{children}
		</button>
	);
}

function ToolbarDivider() {
	return <div className="w-px h-6 bg-[hsl(var(--border))] mx-1" />;
}

/* ── Generic dropdown wrapper ──────────────────────────────── */

function ToolbarDropdown({
	trigger,
	children,
	align = "left",
}: {
	trigger: React.ReactNode;
	children: React.ReactNode;
	align?: "left" | "right";
}) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onMouseDown={(e) => {
					e.preventDefault();
					setOpen((o) => !o);
				}}
				className="flex items-center gap-1 px-2 h-8 rounded text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--editor-active))] transition-colors cursor-pointer"
			>
				{trigger}
				<ChevronDown size={12} />
			</button>
			{open && (
				<div
					className={`absolute top-full mt-1 ${align === "right" ? "right-0" : "left-0"} z-50 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-lg py-1 min-w-[160px]`}
					onMouseDown={(e) => e.preventDefault()}
				>
					{/* Pass close callback via click wrapper */}
					<div onClick={() => setOpen(false)}>{children}</div>
				</div>
			)}
		</div>
	);
}

function DropdownItem({
	onClick,
	active = false,
	children,
}: {
	onClick: () => void;
	active?: boolean;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onMouseDown={(e) => {
				e.preventDefault();
				onClick();
			}}
			className={`w-full text-left px-3 py-1.5 text-sm transition-colors cursor-pointer ${active
					? "bg-[hsl(var(--editor-active))] text-[hsl(var(--primary))] font-medium"
					: "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
				}`}
		>
			{children}
		</button>
	);
}

/* ── Heading / Paragraph dropdown ──────────────────────────── */

function HeadingDropdown() {
	const commands = useCommands();
	const active = useActive();

	const currentLabel = active.heading({ level: 1 })
		? "Heading 1"
		: active.heading({ level: 2 })
			? "Heading 2"
			: active.heading({ level: 3 })
				? "Heading 3"
				: "Paragraph";

	return (
		<ToolbarDropdown
			trigger={
				<span className="flex items-center gap-1.5">
					<Type size={14} />
					<span className="text-xs min-w-[60px]">{currentLabel}</span>
				</span>
			}
		>
			<DropdownItem
				onClick={() => {
					commands.convertParagraph?.();
					if (!commands.convertParagraph) {
						commands.toggleHeading?.({ level: 1 });
					}
				}}
				active={!active.heading()}
			>
				<span className="text-sm">Paragraph</span>
			</DropdownItem>
			<DropdownItem
				onClick={() => commands.toggleHeading({ level: 1 })}
				active={active.heading({ level: 1 })}
			>
				<span className="text-lg font-bold">Heading 1</span>
			</DropdownItem>
			<DropdownItem
				onClick={() => commands.toggleHeading({ level: 2 })}
				active={active.heading({ level: 2 })}
			>
				<span className="text-base font-semibold">Heading 2</span>
			</DropdownItem>
			<DropdownItem
				onClick={() => commands.toggleHeading({ level: 3 })}
				active={active.heading({ level: 3 })}
			>
				<span className="text-sm font-semibold">Heading 3</span>
			</DropdownItem>
		</ToolbarDropdown>
	);
}

/* ── Highlight color dropdown ──────────────────────────────── */

const HIGHLIGHT_COLORS = [
	{ label: "Yellow", color: "#fef08a" },
	{ label: "Green", color: "#bbf7d0" },
	{ label: "Blue", color: "#bfdbfe" },
	{ label: "Pink", color: "#fbcfe8" },
	{ label: "Orange", color: "#fed7aa" },
	{ label: "Purple", color: "#e9d5ff" },
];

function HighlightDropdown() {
	const commands = useCommands();

	return (
		<ToolbarDropdown
			trigger={<Highlighter size={15} />}
		>
			<div className="px-2 py-1.5">
				<p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2">
					Highlight Color
				</p>
				<div className="flex flex-wrap gap-1.5">
					{HIGHLIGHT_COLORS.map((c) => (
						<button
							key={c.color}
							type="button"
							title={c.label}
							onMouseDown={(e) => {
								e.preventDefault();
								commands.setTextHighlight(c.color);
							}}
							className="w-6 h-6 rounded border border-[hsl(var(--border))] cursor-pointer hover:scale-110 transition-transform"
							style={{ backgroundColor: c.color }}
						/>
					))}
				</div>
				<button
					type="button"
					onMouseDown={(e) => {
						e.preventDefault();
						commands.removeTextHighlight();
					}}
					className="mt-2 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] cursor-pointer"
				>
					Remove highlight
				</button>
			</div>
		</ToolbarDropdown>
	);
}

/* ── Text color dropdown ────────────────────────────────────── */

const TEXT_COLORS = [
	{ label: "Default", color: "" },
	{ label: "Black", color: "#111827" },
	{ label: "Gray", color: "#6b7280" },
	{ label: "Red", color: "#ef4444" },
	{ label: "Orange", color: "#f97316" },
	{ label: "Yellow", color: "#eab308" },
	{ label: "Green", color: "#22c55e" },
	{ label: "Blue", color: "#3b82f6" },
	{ label: "Purple", color: "#8b5cf6" },
];

function TextColorDropdown() {
	const commands = useCommands();

	return (
		<ToolbarDropdown
			trigger={<Palette size={15} />}
		>
			<div className="px-2 py-1.5">
				<p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2">
					Text Color
				</p>
				<div className="flex flex-wrap gap-1.5">
					{TEXT_COLORS.map((c) => (
						<button
							key={c.label}
							type="button"
							title={c.label}
							onMouseDown={(e) => {
								e.preventDefault();
								if (c.color) {
									commands.setTextColor(c.color);
								} else {
									commands.removeTextColor();
								}
							}}
							className="flex items-center justify-center w-7 h-7 rounded border border-[hsl(var(--border))] cursor-pointer hover:scale-110 transition-transform"
							style={c.color ? { color: c.color } : {}}
						>
							<span className="text-xs font-medium">
								A
							</span>
						</button>
					))}
				</div>
				<button
					type="button"
					onMouseDown={(e) => {
						e.preventDefault();
						commands.removeTextColor();
					}}
					className="mt-2 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] cursor-pointer"
				>
					Reset to default
				</button>
			</div>
		</ToolbarDropdown>
	);
}

/* ── Table cell background (paint bucket) ───────────────────── */

function TableCellBackgroundDropdown() {
	const commands = useCommands();

	return (
		<ToolbarDropdown
			trigger={<PaintBucket size={15} />}
		>
			<div className="px-2 py-1.5">
				<p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2">
					Table Cell Background
				</p>
				<div className="flex flex-wrap gap-1.5">
					{HIGHLIGHT_COLORS.map((c) => (
						<button
							key={c.color}
							type="button"
							title={c.label}
							onMouseDown={(e) => {
								e.preventDefault();
								// Uses the text highlight mark so it also works inside table cells.
								commands.setTextHighlight(c.color);
							}}
							className="w-6 h-6 rounded border border-[hsl(var(--border))] cursor-pointer hover:scale-110 transition-transform"
							style={{ backgroundColor: c.color }}
						/>
					))}
				</div>
				<button
					type="button"
					onMouseDown={(e) => {
						e.preventDefault();
						commands.removeTextHighlight();
					}}
					className="mt-2 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] cursor-pointer"
				>
					Clear cell background
				</button>
			</div>
		</ToolbarDropdown>
	);
}

/* ── Alignment dropdown ───────────────────────────────────── */

function AlignmentDropdown({
	commands,
	active,
}: {
	commands: ReturnType<typeof useCommands>;
	active: ReturnType<typeof useActive>;
}) {
	// Determine current alignment (simplified - Remirror doesn't expose active alignment state easily)
	// We'll just show the dropdown without active state for now
	return (
		<ToolbarDropdown trigger={<AlignLeft size={15} />}>
			<DropdownItem onClick={() => commands.leftAlign()}>
				<div className="flex items-center gap-2">
					<AlignLeft size={14} />
					<span>Align Left</span>
				</div>
			</DropdownItem>
			<DropdownItem onClick={() => commands.centerAlign()}>
				<div className="flex items-center gap-2">
					<AlignCenter size={14} />
					<span>Align Center</span>
				</div>
			</DropdownItem>
			<DropdownItem onClick={() => commands.rightAlign()}>
				<div className="flex items-center gap-2">
					<AlignRight size={14} />
					<span>Align Right</span>
				</div>
			</DropdownItem>
			<DropdownItem onClick={() => commands.justifyAlign()}>
				<div className="flex items-center gap-2">
					<AlignJustify size={14} />
					<span>Justify</span>
				</div>
			</DropdownItem>
		</ToolbarDropdown>
	);
}

/* ── Link insertion ────────────────────────────────────────── */

function LinkButton() {
	const commands = useCommands();
	const active = useActive();

	const handleLink = useCallback(() => {
		if (active.link()) {
			commands.removeLink();
			return;
		}
		const href = window.prompt("Enter URL:");
		if (href) {
			commands.updateLink({ href, auto: false });
		}
	}, [commands, active]);

	return (
		<ToolbarButton
			onClick={handleLink}
			active={active.link()}
			title="Insert Link"
		>
			<Link size={15} />
		</ToolbarButton>
	);
}

/* ── Image insertion ───────────────────────────────────────── */
/* ── Text case / formatting dropdown ───────────────────────── */

function TextCaseDropdown() {
	const commands = useCommands();

	return (
		<ToolbarDropdown
			trigger={
				<span className="flex items-center gap-1.5">
					<CaseSensitive size={14} />
					<span className="text-xs min-w-[60px]">
						Text case
					</span>
				</span>
			}
		>
			<DropdownItem onClick={() => commands.setTextCase("uppercase")}>
				UPPERCASE
			</DropdownItem>
			<DropdownItem onClick={() => commands.setTextCase("lowercase")}>
				lowercase
			</DropdownItem>
			<DropdownItem onClick={() => commands.setTextCase("capitalize")}>
				Capitalize Each Word
			</DropdownItem>
			<DropdownItem onClick={() => commands.setTextCase("small-caps")}>
				Small caps
			</DropdownItem>
			<DropdownItem onClick={() => commands.setTextCase("none")}>
				Clear text case
			</DropdownItem>
		</ToolbarDropdown>
	);
}

/* ── Font family dropdown ───────────────────────────────────── */

const FONT_FAMILIES = [
	{ label: "Default", value: "" },
	{ label: "Serif", value: "Georgia, Times, \"Times New Roman\", serif" },
	{ label: "Sans Serif", value: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", system-ui, sans-serif" },
	{ label: "Monospace", value: "\"SF Mono\", Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace" },
];

function FontFamilyDropdown() {
	const commands = useCommands();

	return (
		<ToolbarDropdown
			trigger={
				<span className="flex items-center gap-1.5">
					<span className="text-xs min-w-[60px]">
						Font
					</span>
				</span>
			}
		>
			{FONT_FAMILIES.map((font) => (
				<DropdownItem
					// No reliable active detection for font family yet
					key={font.label}
					onClick={() => commands.setFontFamily?.(font.value)}
				>
					<span
						className="text-sm"
						style={font.value ? { fontFamily: font.value } : {}}
					>
						{font.label}
					</span>
				</DropdownItem>
			))}
		</ToolbarDropdown>
	);
}

/* ── Insert dropdown (tables, images, TOC, link, etc.) ───────── */

function InsertDropdown({ includeLink = false }: { includeLink?: boolean }) {
	const commands = useCommands();
	const [hover, setHover] = useState({ rows: 0, cols: 0 });
	const maxRows = 8;
	const maxCols = 8;

	const handleImage = useCallback(() => {
		const url = window.prompt("Enter image URL:");
		if (url) {
			commands.insertImage?.({ src: url });
		}
	}, [commands]);

	const handleLink = useCallback(() => {
		const href = window.prompt("Enter URL:");
		if (href) {
			commands.updateLink?.({ href, auto: false });
		}
	}, [commands]);

	return (
		<ToolbarDropdown
			trigger={
				<span className="flex items-center gap-1.5">
					<Plus size={14} />
					<span className="text-xs">
						Insert
					</span>
				</span>
			}
			align="left"
		>
			<div className="px-3 py-2 space-y-3">
				<div>
					<p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2">
						Insert Table
					</p>
					<div
						className="grid gap-0.5"
						style={{ gridTemplateColumns: `repeat(${maxCols}, 1fr)` }}
						onMouseLeave={() => setHover({ rows: 0, cols: 0 })}
					>
						{Array.from({ length: maxRows * maxCols }, (_, i) => {
							const row = Math.floor(i / maxCols) + 1;
							const col = (i % maxCols) + 1;
							const isActive = row <= hover.rows && col <= hover.cols;
							return (
								<button
									key={i}
									type="button"
									onMouseEnter={() => setHover({ rows: row, cols: col })}
									onMouseDown={(e) => {
										e.preventDefault();
										commands.createTable?.({
											rowsCount: row,
											columnsCount: col,
											withHeaderRow: true,
										});
									}}
									className={`w-5 h-5 rounded-sm border transition-colors cursor-pointer ${isActive
											? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))]"
											: "bg-[hsl(var(--muted))] border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]"
										}`}
								/>
							);
						})}
					</div>
				</div>

				<div className="border-t border-[hsl(var(--border))] -mx-3" />

				<div className="space-y-1">
					<DropdownItem onClick={handleImage}>
						<div className="flex items-center gap-2">
							<ImageIcon size={14} />
							<span>Image</span>
						</div>
					</DropdownItem>
					{includeLink && (
						<DropdownItem onClick={handleLink}>
							<div className="flex items-center gap-2">
								<Link size={14} />
								<span>Link</span>
							</div>
						</DropdownItem>
					)}
					<DropdownItem
						onClick={() =>
							commands.insertText?.("## Table of Contents\n\n")
						}
					>
						<div className="flex items-center gap-2">
							<ListTree size={14} />
							<span>Table of contents</span>
						</div>
					</DropdownItem>
					<DropdownItem
						onClick={() => commands.insertHorizontalRule?.()}
					>
						<div className="flex items-center gap-2">
							<Minus size={14} />
							<span>Horizontal rule</span>
						</div>
					</DropdownItem>
				</div>
			</div>
		</ToolbarDropdown>
	);
}

/* ── Lists dropdown (bullet, ordered, checklist) ─────────────── */

function ListDropdown() {
	const commands = useCommands();
	const active = useActive();

	return (
		<ToolbarDropdown
			trigger={
				<span className="flex items-center gap-1.5">
					<List size={14} />
					<span className="text-xs">
						Lists
					</span>
				</span>
			}
		>
			<DropdownItem
				onClick={() => commands.toggleBulletList()}
				active={active.bulletList()}
			>
				<div className="flex items-center gap-2">
					<List size={14} />
					<span>Bullet list</span>
				</div>
			</DropdownItem>
			<DropdownItem
				onClick={() => commands.toggleOrderedList()}
				active={active.orderedList()}
			>
				<div className="flex items-center gap-2">
					<ListOrdered size={14} />
					<span>Numbered list</span>
				</div>
			</DropdownItem>
			<DropdownItem
				onClick={() => commands.toggleTaskList()}
				active={active.taskList()}
			>
				<div className="flex items-center gap-2">
					<CheckSquare size={14} />
					<span>Checklist</span>
				</div>
			</DropdownItem>
		</ToolbarDropdown>
	);
}

/* ── Text formatting dropdown for small / mid screens ────────── */

function TextFormattingDropdown() {
	const commands = useCommands();
	const active = useActive();

	return (
		<ToolbarDropdown
			trigger={
				<span className="flex items-center gap-1.5">
					<Type size={14} />
					<span className="text-xs">
						Text
					</span>
				</span>
			}
		>
			{/* Font family */}
			<div className="px-2 pb-1">
				<p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">
					Font family
				</p>
				{FONT_FAMILIES.map((font) => (
					<DropdownItem
						key={font.label}
						onClick={() => commands.setFontFamily?.(font.value)}
					>
						<span
							className="text-sm"
							style={font.value ? { fontFamily: font.value } : {}}
						>
							{font.label}
						</span>
					</DropdownItem>
				))}
			</div>

			<div className="border-t border-[hsl(var(--border))] my-1" />

			{/* Basic styles */}
			<DropdownItem
				onClick={() => commands.toggleBold()}
				active={active.bold()}
			>
				<div className="flex items-center gap-2">
					<Bold size={14} />
					<span>Bold</span>
				</div>
			</DropdownItem>
			<DropdownItem
				onClick={() => commands.toggleItalic()}
				active={active.italic()}
			>
				<div className="flex items-center gap-2">
					<Italic size={14} />
					<span>Italic</span>
				</div>
			</DropdownItem>
			<DropdownItem
				onClick={() => commands.toggleUnderline()}
				active={active.underline()}
			>
				<div className="flex items-center gap-2">
					<Underline size={14} />
					<span>Underline</span>
				</div>
			</DropdownItem>
			<DropdownItem
				onClick={() => commands.toggleStrike()}
				active={active.strike()}
			>
				<div className="flex items-center gap-2">
					<Strikethrough size={14} />
					<span>Strikethrough</span>
				</div>
			</DropdownItem>

			<div className="border-t border-[hsl(var(--border))] my-1" />

			{/* Sub / Sup */}
			<DropdownItem
				onClick={() => commands.toggleSubscript()}
				active={active.sub()}
			>
				<div className="flex items-center gap-2">
					<Subscript size={14} />
					<span>Subscript</span>
				</div>
			</DropdownItem>
			<DropdownItem
				onClick={() => commands.toggleSuperscript()}
				active={active.sup()}
			>
				<div className="flex items-center gap-2">
					<Superscript size={14} />
					<span>Superscript</span>
				</div>
			</DropdownItem>

			<div className="border-t border-[hsl(var(--border))] my-1" />

			{/* Text case */}
			<DropdownItem onClick={() => commands.setTextCase("uppercase")}>
				UPPERCASE
			</DropdownItem>
			<DropdownItem onClick={() => commands.setTextCase("lowercase")}>
				lowercase
			</DropdownItem>
			<DropdownItem onClick={() => commands.setTextCase("capitalize")}>
				Capitalize Each Word
			</DropdownItem>
			<DropdownItem onClick={() => commands.setTextCase("small-caps")}>
				Small caps
			</DropdownItem>
			<DropdownItem onClick={() => commands.setTextCase("none")}>
				Clear text case
			</DropdownItem>
		</ToolbarDropdown>
	);
}

/* ── Main Toolbar ──────────────────────────────────────────── */

export function EditorToolbar() {
	const commands = useCommands();
	const active = useActive();

	return (
		<div className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 bg-[hsl(var(--editor-toolbar))]">
			{/* History */}
			<ToolbarButton
				onClick={() => commands.undo?.()}
				disabled={commands.undo?.enabled ? !commands.undo.enabled() : false}
				title="Undo (Ctrl+Z)"
			>
				<Undo2 size={15} />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => commands.redo?.()}
				disabled={commands.redo?.enabled ? !commands.redo.enabled() : false}
				title="Redo (Ctrl+Shift+Z)"
			>
				<Redo2 size={15} />
			</ToolbarButton>

			<ToolbarDivider />

			{/* Heading / Paragraph dropdown */}
			<HeadingDropdown />

			{/* Text formatting - responsive */}
			<div className="hidden lg:flex items-center gap-0.5">
				<FontFamilyDropdown />

				<ToolbarDivider />

				<ToolbarButton
					onClick={() => commands.toggleBold()}
					active={active.bold()}
					title="Bold (Ctrl+B)"
				>
					<Bold size={15} />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => commands.toggleItalic()}
					active={active.italic()}
					title="Italic (Ctrl+I)"
				>
					<Italic size={15} />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => commands.toggleUnderline()}
					active={active.underline()}
					title="Underline (Ctrl+U)"
				>
					<Underline size={15} />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => commands.toggleStrike()}
					active={active.strike()}
					title="Strikethrough"
				>
					<Strikethrough size={15} />
				</ToolbarButton>

				<ToolbarDivider />

				<ToolbarButton
					onClick={() => commands.toggleSubscript()}
					active={active.sub()}
					title="Subscript"
				>
					<Subscript size={15} />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => commands.toggleSuperscript()}
					active={active.sup()}
					title="Superscript"
				>
					<Superscript size={15} />
				</ToolbarButton>

				<TextCaseDropdown />

				<ToolbarDivider />

				<HighlightDropdown />
				<TextColorDropdown />
				<TableCellBackgroundDropdown />
			</div>
			<div className="lg:hidden">
				<TextFormattingDropdown />
			</div>

			<ToolbarDivider />

			{/* Lists - responsive */}
			<div className="hidden lg:flex items-center gap-0.5">
				<ToolbarButton
					onClick={() => commands.toggleBulletList()}
					active={active.bulletList()}
					title="Bullet List"
				>
					<List size={15} />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => commands.toggleOrderedList()}
					active={active.orderedList()}
					title="Ordered List"
				>
					<ListOrdered size={15} />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => commands.toggleTaskList()}
					active={active.taskList()}
					title="Checkbox List"
				>
					<CheckSquare size={15} />
				</ToolbarButton>
			</div>
			<div className="lg:hidden">
				<ListDropdown />
			</div>

			<ToolbarDivider />

			{/* Alignment - Responsive: dropdown on small/medium, buttons on large */}
			<div className="hidden lg:flex items-center gap-0.5">
				<ToolbarButton onClick={() => commands.leftAlign()} title="Align Left">
					<AlignLeft size={15} />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => commands.centerAlign()}
					title="Align Center"
				>
					<AlignCenter size={15} />
				</ToolbarButton>
				<ToolbarButton onClick={() => commands.rightAlign()} title="Align Right">
					<AlignRight size={15} />
				</ToolbarButton>
				<ToolbarButton onClick={() => commands.justifyAlign()} title="Justify">
					<AlignJustify size={15} />
				</ToolbarButton>
			</div>
			<div className="lg:hidden">
				<AlignmentDropdown commands={commands} active={active} />
			</div>

			<ToolbarDivider />

			{/* Link + Insert - responsive */}
			<div className="hidden lg:flex items-center gap-0.5">
				<LinkButton />
				<InsertDropdown />
			</div>
			<div className="lg:hidden">
				<InsertDropdown includeLink />
			</div>
		</div>
	);
}
