"use client"

import { useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MultiPagePreviewProps {
  content: string
  onPageChange?: (totalPages: number) => void
}

export function MultiPagePreview({ content, onPageChange }: MultiPagePreviewProps) {
  const [pages, setPages] = useState<string[]>([])
  const measureRef = useRef<HTMLDivElement>(null)

  // A4 dimensions at 96 DPI
  const A4_WIDTH = 794
  const A4_HEIGHT = 1123
  const PADDING = 64 // 16 * 4 (p-16 in pixels)
  const CONTENT_HEIGHT = A4_HEIGHT - PADDING * 2

  useEffect(() => {
    // Split content into pages based on height
    // This is a simplified version - production would need more sophisticated logic
    const splitIntoPages = () => {
      if (!measureRef.current) return [content]

      // For now, return single page
      // TODO: Implement proper page splitting based on rendered height
      return [content]
    }

    const newPages = splitIntoPages()
    setPages(newPages)

    if (onPageChange) {
      onPageChange(newPages.length)
    }
  }, [content, onPageChange])

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Hidden measurement div */}
      <div ref={measureRef} className="invisible absolute" style={{ width: A4_WIDTH - PADDING * 2 }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>

      {/* Visible pages */}
      {pages.map((pageContent, index) => (
        <div
          key={index}
          className="bg-white shadow-2xl relative"
          style={{
            width: `${A4_WIDTH}px`,
            minHeight: `${A4_HEIGHT}px`,
            maxWidth: "100%",
          }}
        >
          <div className="p-16 h-full overflow-hidden">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="prose prose-sm max-w-none font-serif"
              components={{
                h1: ({ node, ...props }) => (
                  <h1 className="text-3xl font-bold mb-6 text-gray-900 font-serif" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 font-serif border-b pb-2" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-xl font-semibold mt-6 mb-3 text-gray-900 font-serif" {...props} />
                ),
                p: ({ node, ...props }) => <p className="mb-4 text-gray-800 leading-relaxed" {...props} />,
                table: ({ node, ...props }) => (
                  <div className="my-6 overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300" {...props} />
                  </div>
                ),
                thead: ({ node, ...props }) => <thead className="bg-gray-100" {...props} />,
                th: ({ node, ...props }) => (
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900" {...props} />
                ),
                td: ({ node, ...props }) => (
                  <td className="border border-gray-300 px-4 py-2 text-gray-800" {...props} />
                ),
                hr: ({ node, ...props }) => <hr className="my-8 border-t-2 border-gray-300" {...props} />,
              }}
            >
              {pageContent}
            </ReactMarkdown>
          </div>

          {/* Page number footer */}
          <div className="absolute bottom-8 right-16 text-xs text-gray-500">Page {index + 1}</div>
        </div>
      ))}
    </div>
  )
}
