"use client"

import { useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { FinancialChart } from "@/components/financials/financial-chart"

interface A4PreviewProps {
	content: string,
	orientation: "portrait" | "landscape"
	onPageChange?: (page: number) => void
}

export function A4Preview({ content, orientation, onPageChange }: A4PreviewProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [pages, setPages] = useState<string[]>([content]);

	// A4 dimensions in pixels at 96 DPI (standard screen resolution)
	// A4 is 210mm x 297mm = 8.27in x 11.69in
	const A4_WIDTH = orientation === "portrait" ? 794 : 1123; // pixels (8.27in * 96dpi)
	const A4_HEIGHT = orientation === "portrait" ? 1123 : 794; // pixels (11.69in * 96dpi)

	useEffect(() => {
		const splitPages = content.split(/\n---\n/)
		setPages(splitPages)
		if (onPageChange) {
			onPageChange(splitPages.length)
		}
	}, [content, orientation])

	return (
		<div ref={containerRef} className="flex flex-col items-center gap-6">
			{pages.map((pageContent, index) => (
				<div
					key={index}
					data-pdf-page
					className="bg-white shadow-lg relative"
					style={{
						width: `${A4_WIDTH}px`,
						minHeight: `${A4_HEIGHT}px`,
						maxWidth: "100%",
						aspectRatio: (orientation === "portrait") ? "210 / 297" : "297 / 210",
					}}
				>
					<div className="p-16 h-full overflow-hidden">
						<div className="prose prose-sm max-w-none font-serif">
							<ReactMarkdown
								remarkPlugins={[remarkGfm]}
								components={{
									h1: ({ node, ...props }) => (
										<h1
											className="text-3xl font-bold mb-6 text-gray-900 font-serif border-b-2 border-gray-300 pb-3"
											{...props}
										/>
									),
									h2: ({ node, ...props }) => (
										<h2
											className="text-2xl font-semibold mt-8 mb-4 text-gray-900 font-serif border-b border-gray-300 pb-2"
											{...props}
										/>
									),
									h3: ({ node, ...props }) => (
										<h3 className="text-xl font-semibold mt-6 mb-3 text-gray-900 font-serif" {...props} />
									),
									p: ({ node, ...props }) => <p className="mb-4 text-gray-800 leading-relaxed text-justify" {...props} />,
									table: ({ node, ...props }) => (
										<div className="my-6 overflow-x-auto">
											<table className="min-w-full border-collapse border-2 border-gray-400" {...props} />
										</div>
									),
									thead: ({ node, ...props }) => <thead className="bg-gray-200" {...props} />,
									tbody: ({ node, ...props }) => <tbody className="bg-white" {...props} />,
									th: ({ node, ...props }) => (
										<th
											className="border border-gray-400 px-4 py-3 text-left font-bold text-gray-900 bg-gray-100"
											{...props}
										/>
									),
									td: ({ node, ...props }) => (
										<td className="border border-gray-400 px-4 py-2 text-gray-800" {...props} />
									),
									tr: ({ node, ...props }) => <tr className="even:bg-gray-50" {...props} />,
									hr: ({ node, ...props }) => <hr className="my-8 border-t-2 border-gray-400" {...props} />,
									strong: ({ node, ...props }) => <strong className="font-bold text-gray-900" {...props} />,
									em: ({ node, ...props }) => <em className="italic text-gray-800" {...props} />,
									ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-2 ml-4" {...props} />,
									ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2 ml-4" {...props} />,
									li: ({ node, ...props }) => <li className="text-gray-800 leading-relaxed" {...props} />,
									blockquote: ({ node, ...props }) => (
										<blockquote className="border-l-4 border-gray-400 pl-4 italic my-4 text-gray-700" {...props} />
									),
									code: ({ node, className, children, ...props }) => {
										const match = /language-(\w+)/.exec(className || "")
										const isChart = match && match[1] === "chart"

										if (isChart) {
											try {
												const config = JSON.parse(String(children).replace(/\n$/, ""))
												return <FinancialChart config={config} />
											} catch (e) {
												return (
													<div className="text-red-500 p-4 border border-red-200 rounded">
														Error parsing chart configuration
													</div>
												)
											}
										}

										return (
											<code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800" {...props}>
												{children}
											</code>
										)
									},
									pre: ({ children }) => <>{children}</>,
								}}
							>
								{pageContent}
							</ReactMarkdown>
						</div>
					</div>

					{/* Page footer with page number */}
					<div className="absolute bottom-8 left-0 right-0 flex justify-center">
						<span className="text-xs text-gray-500 font-serif">Page {index + 1} of {pages.length}</span>
					</div>
				</div>
			))}
		</div>
	)
}
