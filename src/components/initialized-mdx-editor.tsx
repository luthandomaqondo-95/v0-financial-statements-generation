"use client"

import type { ForwardedRef } from "react"
import {
  MDXEditor,
  type MDXEditorMethods,
  type MDXEditorProps,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  tablePlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  ListsToggle,
  CreateLink,
  InsertTable,
  InsertThematicBreak,
  Separator,
} from "@mdxeditor/editor"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

// Only import this to the next file
export default function InitializedMDXEditor({
  editorRef,
  containerClassName,
  ...props
}: { editorRef: ForwardedRef<MDXEditorMethods> | null; containerClassName?: string } & MDXEditorProps) {
  const { theme } = useTheme()

  return (
    <div
      className={cn(
        "mdx-editor-wrapper h-full border rounded-md overflow-hidden bg-background",
        theme === "dark" ? "dark-theme" : "",
        containerClassName,
      )}
    >
      <MDXEditor
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          tablePlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                {" "}
                <UndoRedo />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <BoldItalicUnderlineToggles />
                <Separator />
                <ListsToggle />
                <Separator />
                <CreateLink />
                <InsertTable />
                <InsertThematicBreak />{" "}
              </>
            ),
          }),
        ]}
        {...props}
        ref={editorRef}
        className="h-full"
        contentEditableClassName="prose dark:prose-invert max-w-none p-4 h-full overflow-auto outline-none"
      />
    </div>
  )
}
