"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useCommands, useRemirrorContext } from "@remirror/react";
import {
  Plus,
  Trash2,
  Columns3,
  Rows3,
  PaintBucket,
  Palette,
} from "lucide-react";

const TABLE_BG_COLORS = [
  { label: "None", color: "" },
  { label: "Light Gray", color: "#f3f4f6" },
  { label: "Light Blue", color: "#dbeafe" },
  { label: "Light Green", color: "#dcfce7" },
  { label: "Light Yellow", color: "#fef9c3" },
  { label: "Light Pink", color: "#fce7f3" },
  { label: "Light Purple", color: "#f3e8ff" },
];

const TABLE_TEXT_COLORS = [
  { label: "Default", color: "" },
  { label: "Red", color: "#dc2626" },
  { label: "Blue", color: "#2563eb" },
  { label: "Green", color: "#16a34a" },
  { label: "Purple", color: "#9333ea" },
  { label: "Orange", color: "#ea580c" },
  { label: "Gray", color: "#6b7280" },
];

interface MenuPosition {
  x: number;
  y: number;
}

export function TableContextMenu() {
  const commands = useCommands();
  const { view } = useRemirrorContext();
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  const [showBgColors, setShowBgColors] = useState(false);
  const [showTextColors, setShowTextColors] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Detect if cursor is inside a table
  const isInsideTable = useCallback(() => {
    const { state } = view;
    const { $from } = state.selection;
    for (let depth = $from.depth; depth > 0; depth--) {
      if ($from.node(depth).type.name === "table") return true;
    }
    return false;
  }, [view]);

  // Right click handler on the editor
  useEffect(() => {
    const editorDom = view.dom;
    const handleContextMenu = (e: MouseEvent) => {
      if (!isInsideTable()) return;
      e.preventDefault();
      setMenuPos({ x: e.clientX, y: e.clientY });
      setShowBgColors(false);
      setShowTextColors(false);
    };
    editorDom.addEventListener("contextmenu", handleContextMenu);
    return () =>
      editorDom.removeEventListener("contextmenu", handleContextMenu);
  }, [view, isInsideTable]);

  // Close on outside click
  useEffect(() => {
    if (!menuPos) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPos(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuPos]);

  // Close on Escape
  useEffect(() => {
    if (!menuPos) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuPos(null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [menuPos]);

  const applyBgColor = useCallback(
    (color: string) => {
      // Apply background to table cells via DOM (ProseMirror cell attrs)
      const { state, dispatch } = view;
      const { $from } = state.selection;
      // Find the cell node
      for (let depth = $from.depth; depth > 0; depth--) {
        const node = $from.node(depth);
        if (
          node.type.name === "tableCell" ||
          node.type.name === "tableHeader"
        ) {
          const pos = $from.before(depth);
          const tr = state.tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            style: color
              ? `background-color: ${color}`
              : undefined,
          });
          dispatch(tr);
          break;
        }
      }
      setMenuPos(null);
    },
    [view],
  );

  const applyTextColor = useCallback(
    (color: string) => {
      if (color) {
        commands.setTextColor(color);
      } else {
        commands.removeTextColor();
      }
      setMenuPos(null);
    },
    [commands],
  );

  if (!menuPos) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-xl py-1 min-w-[200px]"
      style={{ left: menuPos.x, top: menuPos.y }}
    >
      {/* Row operations */}
      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
        Rows
      </p>
      <MenuItem
        icon={<Plus size={14} />}
        label="Insert row above"
        onClick={() => {
          commands.addTableRowBefore();
          setMenuPos(null);
        }}
      />
      <MenuItem
        icon={<Plus size={14} />}
        label="Insert row below"
        onClick={() => {
          commands.addTableRowAfter();
          setMenuPos(null);
        }}
      />
      <MenuItem
        icon={<Trash2 size={14} />}
        label="Delete row"
        onClick={() => {
          commands.deleteTableRow();
          setMenuPos(null);
        }}
        destructive
      />

      <div className="h-px bg-[hsl(var(--border))] my-1" />

      {/* Column operations */}
      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
        Columns
      </p>
      <MenuItem
        icon={<Plus size={14} />}
        label="Insert column left"
        onClick={() => {
          commands.addTableColumnBefore();
          setMenuPos(null);
        }}
      />
      <MenuItem
        icon={<Plus size={14} />}
        label="Insert column right"
        onClick={() => {
          commands.addTableColumnAfter();
          setMenuPos(null);
        }}
      />
      <MenuItem
        icon={<Trash2 size={14} />}
        label="Delete column"
        onClick={() => {
          commands.deleteTableColumn();
          setMenuPos(null);
        }}
        destructive
      />

      <div className="h-px bg-[hsl(var(--border))] my-1" />

      {/* Cell colors */}
      <div className="relative">
        <MenuItem
          icon={<PaintBucket size={14} />}
          label="Cell background"
          onClick={() => {
            setShowBgColors(!showBgColors);
            setShowTextColors(false);
          }}
          hasSubmenu
        />
        {showBgColors && (
          <div className="absolute left-full top-0 ml-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-lg p-2 min-w-[140px]">
            <div className="flex flex-wrap gap-1.5">
              {TABLE_BG_COLORS.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  title={c.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyBgColor(c.color)}
                  className="w-6 h-6 rounded border border-[hsl(var(--border))] cursor-pointer hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: c.color || "hsl(var(--card))",
                  }}
                >
                  {!c.color && (
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] flex items-center justify-center">
                      x
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <MenuItem
          icon={<Palette size={14} />}
          label="Text color"
          onClick={() => {
            setShowTextColors(!showTextColors);
            setShowBgColors(false);
          }}
          hasSubmenu
        />
        {showTextColors && (
          <div className="absolute left-full top-0 ml-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-lg p-2 min-w-[140px]">
            <div className="flex flex-wrap gap-1.5">
              {TABLE_TEXT_COLORS.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  title={c.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyTextColor(c.color)}
                  className="w-6 h-6 rounded border border-[hsl(var(--border))] cursor-pointer hover:scale-110 transition-transform flex items-center justify-center"
                  style={{ color: c.color || "hsl(var(--foreground))" }}
                >
                  <span className="text-xs font-bold">A</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-[hsl(var(--border))] my-1" />

      {/* Delete table */}
      <MenuItem
        icon={<Trash2 size={14} />}
        label="Delete table"
        onClick={() => {
          commands.deleteTable();
          setMenuPos(null);
        }}
        destructive
      />
    </div>
  );
}

/* ── Menu Item ─────────────────────────────────────────────── */

function MenuItem({
  icon,
  label,
  onClick,
  destructive = false,
  hasSubmenu = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
  hasSubmenu?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors cursor-pointer ${
        destructive
          ? "text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.08)]"
          : "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
      }`}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {hasSubmenu && <ChevronRight size={12} className="text-[hsl(var(--muted-foreground))]" />}
    </button>
  );
}

function ChevronRight({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
