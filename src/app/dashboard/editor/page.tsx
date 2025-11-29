"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import type { MDXEditorMethods } from "@mdxeditor/editor"
import { Button } from "@/components/ui/button"
import { A4Preview } from "@/components/a4-preview"
import { PDFExport } from "@/components/pdf-export"
import { FinancialTemplates } from "@/components/financial-templates"
import { StickyEditorToolbar } from "@/components/sticky-editor-toolbar"
import { EditorProvider, useEditorContext } from "@/components/mdx-editor/editor-context"
import { Save, FileText, ChevronLeft, ChevronsLeft, ChevronsRight, ZoomIn, ZoomOut, Eye, Edit, Plus, Loader2, List, Check, Scissors } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageEditor, PageSettings, findBreakPoint, estimateOverflow, getMaxLines, getCharPerLine } from "@/components/page-editor"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const defaultPageSettings: PageSettings = {
	orientation: "portrait",
	margins: { top: 10, right: 15, bottom: 10, left: 15 },
}

interface PageData {
	id: string
	content: string
	settings: PageSettings
	isTableOfContents?: boolean
}

// Generate unique ID
const generateId = () => `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Helper to process overflows
const processPageOverflows = (pages: PageData[]): { pages: PageData[], splitCount: number } => {
	let newPages = [...pages]
	let splitCount = 0
	let iterations = 0
	const maxIterations = 100 // Prevent infinite loops

	while (iterations < maxIterations) {
		let foundOverflow = false

		for (let i = 0; i < newPages.length; i++) {
			const page = newPages[i]
			const orientation = page.settings.orientation

			if (estimateOverflow(page.content, orientation)) {
				const maxLines = getMaxLines(orientation)
				const charPerLine = getCharPerLine(orientation)
				const breakResult = findBreakPoint(page.content, maxLines, charPerLine)

				if (breakResult) {
					// Update current page
					newPages[i] = { ...page, content: breakResult.keepContent }

					// Insert new page with overflow content
					const newPage: PageData = {
						id: generateId(),
						content: breakResult.overflowContent,
						settings: { ...page.settings },
					}
					newPages.splice(i + 1, 0, newPage)

					splitCount++
					foundOverflow = true
					break // Restart from the beginning since indices changed
				}
			}
		}

		if (!foundOverflow) {
			break // No more overflows found
		}
		iterations++
	}

	return { pages: newPages, splitCount }
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value)

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value)
		}, delay)

		return () => {
			clearTimeout(handler)
		}
	}, [value, delay])

	return debouncedValue
}

export default function EditorPage() {
	return (
		<EditorProvider>
			<EditorPageContent />
		</EditorProvider>
	)
}

function EditorPageContent() {
	const router = useRouter()
	const { setActiveEditor, setActivePageIndex } = useEditorContext()

	const [pages, setPages] = useState<PageData[]>([])

	const { data: initialContent, isLoading, isError } = useQuery({
		queryKey: ["afs-default-content"],
		queryFn: async () => {
			const res = await fetch("/api/afs")
			if (!res.ok) throw new Error("Failed to fetch")
			const { content } = await res.json()
			return content as string
		},
		staleTime: Number.POSITIVE_INFINITY,
	})

	useEffect(() => {
		if (initialContent && pages.length === 0) {
			const initialPages = initialContent.split(/\n---\n/).map((p: string) => ({
				id: generateId(),
				content: p.trim(),
				settings: { ...defaultPageSettings },
			}))

			const { pages: processedPages } = processPageOverflows(initialPages)
			setPages(processedPages)
		}
	}, [initialContent, pages.length])

	useEffect(() => {
		if (isError) {
			toast.error("Failed to load content")
		}
	}, [isError])

	const [currentPage, setCurrentPage] = useState(1)
	const [zoom, setZoom] = useState("100")
	const [activeTab, setActiveTab] = useState("edit")
	const [isChatOpen, setIsChatOpen] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
	const [lastSaved, setLastSaved] = useState<Date | null>(null)
	const [hasTableOfContents, setHasTableOfContents] = useState(false)

	// Computed full content for preview/export
	const fullContent = useMemo(() => pages.map((p) => p.content).join("\n\n---\n\n"), [pages]);

	// Debounced content for auto-save (2 second delay)
	const debouncedContent = fullContent; //useDebounce(fullContent, 2000)

	// Auto-save effect
	useEffect(() => {
		if (!isLoading && hasUnsavedChanges && debouncedContent) {
			performAutoSave()
		}
	}, [debouncedContent, isLoading, hasUnsavedChanges])

	const performAutoSave = useCallback(async () => {
		setIsSaving(true)
		try {
			// Simulate save delay for demo (in production this would be an API call)
			await new Promise((resolve) => setTimeout(resolve, 500))

			const saveData = {
				content: fullContent,
				pages: pages,
				savedAt: new Date().toISOString(),
			}
			localStorage.setItem("afs-draft", JSON.stringify(saveData))

			setLastSaved(new Date())
			setHasUnsavedChanges(false)
		} catch (error) {
			console.error("Auto-save failed:", error)
		} finally {
			setIsSaving(false)
		}
	}, [fullContent, pages])

	const handleTemplateSelect = (templateContent: string) => {
		const initialPages = templateContent.split(/\n---\n/).map((p) => ({
			id: generateId(),
			content: p.trim(),
			settings: { ...defaultPageSettings },
		}))

		const { pages: processedPages, splitCount } = processPageOverflows(initialPages)
		setPages(processedPages)
		setHasUnsavedChanges(true)
		setHasTableOfContents(false)

		if (splitCount > 0) {
			toast.success(`Template loaded and split into ${processedPages.length} pages (${splitCount} splits)`)
		} else {
			toast.success("Template loaded successfully")
		}
	}

	const handleManualSave = () => {
		performAutoSave()
		toast.success("Draft saved successfully!")
	}

	const updatePage = (index: number, content: string) => {
		setPages((prev) => {
			const newPages = [...prev]
			newPages[index] = { ...newPages[index], content }
			return newPages
		})
		setHasUnsavedChanges(true)
	}

	const updatePageSettings = (index: number, settings: PageSettings) => {
		setPages((prev) => {
			const newPages = [...prev]
			newPages[index] = { ...newPages[index], settings }
			return newPages
		})
		setHasUnsavedChanges(true)
	}

	const addPage = (afterIndex: number) => {
		const newPage: PageData = {
			id: generateId(),
			content: "# New Page\n\nStart writing here...",
			settings: { ...defaultPageSettings },
		}

		setPages((prev) => {
			const newPages = [...prev]
			// Insert new page after the specified index
			newPages.splice(afterIndex + 1, 0, newPage)
			return newPages
		})
		setHasUnsavedChanges(true)
		toast.success(`New page added after page ${afterIndex + 1}`)
	}

	const deletePage = (index: number) => {
		if (pages.length <= 1) {
			toast.error("Cannot delete the last page")
			return
		}

		// Check if this is the table of contents page
		if (pages[index].isTableOfContents) {
			setHasTableOfContents(false)
		}

		setPages((prev) => prev.filter((_, i) => i !== index))
		setHasUnsavedChanges(true)
		toast.success("Page deleted")
	}

	const movePage = (fromIndex: number, toIndex: number) => {
		if (toIndex < 0 || toIndex >= pages.length) return

		setPages((prev) => {
			const newPages = [...prev]
			const [movedPage] = newPages.splice(fromIndex, 1)
			newPages.splice(toIndex, 0, movedPage)
			return newPages
		})
		setHasUnsavedChanges(true)
		toast.success(`Page moved ${toIndex < fromIndex ? "up" : "down"}`)
	}

	// Handle splitting overflow content to a new page
	const handleSplitOverflow = useCallback((pageIndex: number, currentContent: string, overflowContent: string) => {
		setPages((prev) => {
			const newPages = [...prev]
			// Update current page with trimmed content
			newPages[pageIndex] = { ...newPages[pageIndex], content: currentContent }
			// Insert new page with overflow content
			const newPage: PageData = {
				id: generateId(),
				content: overflowContent,
				settings: { ...newPages[pageIndex].settings },
			}
			newPages.splice(pageIndex + 1, 0, newPage)
			return newPages
		})
		setHasUnsavedChanges(true)
		toast.success("Content split to new page")
	}, [])

	// Split all overflowing pages
	const splitAllOverflows = useCallback(() => {
		setPages((prevPages) => {
			const { pages: newPages, splitCount } = processPageOverflows(prevPages)

			if (splitCount > 0) {
				toast.success(`Split ${splitCount} page${splitCount > 1 ? 's' : ''} to fix overflows`)
			} else {
				toast.info("No overflowing pages to split")
			}

			return newPages
		})
		setHasUnsavedChanges(true)
	}, [])

	// Handle editor focus to update the active editor in context
	const handleEditorFocus = useCallback((ref: React.RefObject<MDXEditorMethods | null>, pageIndex: number) => {
		setActiveEditor(ref)
		setActivePageIndex(pageIndex)
	}, [setActiveEditor, setActivePageIndex])

	const addTableOfContents = () => {
		if (hasTableOfContents) {
			toast.error("Table of Contents already exists")
			return
		}

		// Generate Table of Contents based on headings in all pages
		const headings: { title: string; page: number; level: number }[] = []

		pages.forEach((page, pageIndex) => {
			// Skip if this is the table of contents page itself
			if (page.isTableOfContents) return

			const lines = page.content.split("\n")
			lines.forEach((line, sectionIndex) => {
				if (sectionIndex > 0) {
					const trimmedLine = line.trim()

					// Match headings - check from most specific (####) to least specific (#)
					// to avoid false matches
					if (trimmedLine.startsWith("#### ")) {
						const title = trimmedLine.replace(/^####\s+/, "")
						headings.push({ title, page: pageIndex + 2, level: 4 })
					} else if (trimmedLine.startsWith("### ")) {
						const title = trimmedLine.replace(/^###\s+/, "")
						headings.push({ title, page: pageIndex + 2, level: 3 })
					} else if (trimmedLine.startsWith("## ")) {
						const title = trimmedLine.replace(/^##\s+/, "")
						headings.push({ title, page: pageIndex + 2, level: 2 })
					} else if (trimmedLine.startsWith("# ")) {
						const title = trimmedLine.replace(/^#\s+/, "")
						headings.push({ title, page: pageIndex + 2, level: 1 })
					}
				}
			})
		})

		// Configuration for ToC line formatting
		const LINE_WIDTH = 70 // Total character width for each ToC line
		const INDENT_SIZE = 4 // Spaces per indent level
		const MIN_DOTS = 3 // Minimum dots between title and page number

		// Helper function to create a properly formatted ToC line
		const formatTocLine = (title: string, pageNum: number, level: number): string => {
			const indent = " ".repeat((level - 1) * INDENT_SIZE)
			const pageStr = pageNum.toString()

			// Calculate available space for dots
			// Format: [indent][title] [dots] [pageNum]
			const titleWithIndent = indent + title
			const availableForDots = LINE_WIDTH - titleWithIndent.length - pageStr.length - 2 // -2 for spaces
			const numDots = Math.max(MIN_DOTS, availableForDots)
			const dots = ".".repeat(numDots)

			// For H1 (level 1), make the title bold
			if (level === 1) {
				return `**${title}** ${dots} ${pageStr}`
			}

			return `${indent}${title} ${dots} ${pageStr}`
		}

		// Generate markdown for Table of Contents with professional formatting
		let tocContent = `# **Contents**\n\n`
		tocContent += `---\n\n`

		if (headings.length === 0) {
			tocContent += `*No headings found in the document.*\n\n`
			tocContent += `*Add headings using # for H1, ## for H2, ### for H3, etc.*\n\n`
		} else {
			headings.forEach((heading) => {
				const line = formatTocLine(heading.title, heading.page, heading.level)
				tocContent += `${line}\n\n`
			})
		}

		tocContent += `---\n`

		// Insert ToC after the first page (cover page)
		const tocPage: PageData = {
			id: generateId(),
			content: tocContent,
			settings: { ...defaultPageSettings },
			isTableOfContents: true,
		}

		setPages((prev) => {
			const newPages = [...prev]
			newPages.splice(1, 0, tocPage) // Insert after first page
			return newPages
		})

		setHasTableOfContents(true)
		setHasUnsavedChanges(true)
		toast.success("Table of Contents added after cover page")
	}


	return (
		<div className="h-screen flex flex-col bg-background">
			{/* Header */}
			<header className="flex h-14 items-center gap-4 border-b bg-background px-4 shrink-0">
				<Button variant="ghost" size="sm" className="gap-2" onClick={() => router.back()}>
					<ChevronLeft className="h-4 w-4" />
					Back
				</Button>
				<div className="flex items-center gap-2">
					<FileText className="h-5 w-5 text-muted-foreground" />
					<span className="font-medium">Annual Financial Statement 2024</span>
				</div>

				{/* Auto-save indicator */}
				<div className="flex items-center gap-2 ml-4">

					<Button
						variant="outline"
						size="sm"
						className="gap-2 bg-transparent"
						onClick={handleManualSave}
						disabled={isSaving}
					>
						{isSaving ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Save className="h-4 w-4" />
						)}
						Save
					</Button>
					{isSaving ? (
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<Loader2 className="h-4 w-4 animate-spin" />
							<span>Saving...</span>
						</div>
					) : hasUnsavedChanges ? (
						<div className="flex items-center gap-2 text-amber-500 text-sm">
							<div className="h-2 w-2 rounded-full bg-amber-500" />
							<span>Unsaved changes</span>
						</div>
					) : lastSaved ? (
						<div className="flex items-center gap-2 text-green-600 text-sm">
							<Check className="h-4 w-4" />
							<span>Saved {lastSaved.toLocaleTimeString()}</span>
						</div>
					) : null}

				</div>

				<div className="ml-auto flex items-center gap-2">
					{/* Table of Contents Button */}

					<FinancialTemplates onSelectTemplate={handleTemplateSelect} />
				</div>
			</header>

			{/* Main Content */}
			<div className="flex-1 flex overflow-hidden">
				{/* Chat panel - sits alongside entire Editor/Preview area */}
				<div
					className={cn(
						"h-full flex flex-col border-r bg-background transition-all duration-300 ease-in-out overflow-hidden shrink-0",
						isChatOpen ? "w-[450px]" : "w-0 border-r-0"
					)}
				>
					{isChatOpen && (
						<div className="flex-1 flex flex-col p-4 w-[320px]">
							<h3 className="font-semibold text-sm mb-4">AI Assistant</h3>
							<div className="flex-1 text-sm text-muted-foreground">
								{/* Chat interface here */}
								Chat interface coming soon...
							</div>
						</div>
					)}
				</div>

				{/* Editor/Preview Tabs - fills remaining space */}
				<Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex-1 flex flex-col min-w-0">
					<div className="border-b px-4 bg-muted/30 flex items-center justify-between shrink-0">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="h-12 w-12 cursor-pointer"
										onClick={() => setIsChatOpen(!isChatOpen)}
									>
										{isChatOpen ? (
											<ChevronsLeft className="h-4 w-4" />
										) : (
											<ChevronsRight className="h-4 w-4" />
										)}
									</Button>
								</TooltipTrigger>
								<TooltipContent side="right">
									{isChatOpen ? "Hide chat panel" : "Show chat panel"}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
						<div className="flex items-center justify-between w-full">
							<TabsList className="h-12 bg-transparent p-0 gap-6">
								<TabsTrigger
									value="edit"
									className="cursor-pointer h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2"
								>
									<Edit className="h-4 w-4 mr-2" />
									Editor
								</TabsTrigger>
								<TabsTrigger
									value="preview"
									className="cursor-pointer h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2"
								>
									<Eye className="h-4 w-4 mr-2" />
									Preview
								</TabsTrigger>
							</TabsList>

							<div className="flex items-center gap-4">

								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												className="gap-2 bg-transparent"
												onClick={splitAllOverflows}
											>
												<Scissors className="h-4 w-4" />
												Split Overflows
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											Automatically split all overflowing pages
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>

								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												className={`gap-2 bg-transparent ${hasTableOfContents ? "opacity-50" : ""}`}
												onClick={addTableOfContents}
												disabled={hasTableOfContents}
											>
												<List className="h-4 w-4" />
												Add Contents
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											{hasTableOfContents
												? "Table of Contents already added"
												: "Add Table of Contents after cover page"}
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
								<div className="text-sm text-muted-foreground">
									{pages.length} page{pages.length !== 1 ? "s" : ""}
									{activeTab === "preview" && ` • Viewing page ${currentPage}`}
								</div>
								<div className="flex items-center gap-1">
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7"
										onClick={() => setZoom(Math.max(50, Number.parseInt(zoom) - 25).toString())}
									>
										<ZoomOut className="h-4 w-4" />
									</Button>
									<Select value={zoom} onValueChange={setZoom}>
										<SelectTrigger className="w-[70px] h-7 text-xs">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="50">50%</SelectItem>
											<SelectItem value="75">75%</SelectItem>
											<SelectItem value="100">100%</SelectItem>
											<SelectItem value="125">125%</SelectItem>
											<SelectItem value="150">150%</SelectItem>
										</SelectContent>
									</Select>
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7"
										onClick={() => setZoom(Math.min(200, Number.parseInt(zoom) + 25).toString())}
									>
										<ZoomIn className="h-4 w-4" />
									</Button>
									<PDFExport content={fullContent} />
								</div>
							</div>
						</div>
					</div>

					{
						(isLoading) ? (
							<div className="h-screen flex items-center justify-center bg-background">
								<div className="flex flex-col items-center gap-4">
									<Loader2 className="h-8 w-8 animate-spin text-primary" />
									<p className="text-muted-foreground">Loading financial statement...</p>
								</div>
							</div>
						) : (

							<>
								<TabsContent
									value="edit"
									className="flex-1 flex flex-col mt-0 border-0 p-0 overflow-hidden data-[state=inactive]:hidden h-full"
								>
									{/* Sticky Toolbar - Outside the transform container */}
									<StickyEditorToolbar />

									{/* Editor interface */}
									<div
										className={cn(
											"h-full flex-1 overflow-auto bg-muted/10 relative transition-all duration-300 ease-in-out"
										)}
									>
										<div
											className="relative flex flex-col items-center py-8 min-h-full"
											style={{
												transform: `scale(${Number.parseInt(zoom) / 100})`,
												transformOrigin: "top center",
											}}
										>
											{pages.map((pageData, index) => (
												<PageEditor
													key={pageData.id}
													pageNumber={index + 1}
													totalPages={pages.length}
													content={pageData.content}
													onChange={(content) => updatePage(index, content)}
													onAddNext={() => addPage(index)}
													onDelete={() => deletePage(index)}
													onMoveUp={() => movePage(index, index - 1)}
													onMoveDown={() => movePage(index, index + 1)}
													settings={pageData.settings}
													onSettingsChange={(settings) => updatePageSettings(index, settings)}
													hideToolbar={true}
													onEditorFocus={handleEditorFocus}
													onSplitOverflow={(currentContent, overflowContent) => handleSplitOverflow(index, currentContent, overflowContent)}
												/>
											))}

											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															variant="outline"
															size="icon"
															className="mt-4 mb-12 h-12 w-12 rounded-full border-dashed bg-transparent"
															onClick={() => addPage(pages.length - 1)}
														>
															<Plus className="h-5 w-5" />
														</Button>
													</TooltipTrigger>
													<TooltipContent>Add new page at the end</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										</div>
									</div>
								</TabsContent>

								<TabsContent
									value="preview"
									className="flex-1 mt-0 border-0 p-0 overflow-hidden data-[state=inactive]:hidden h-full"
								>
									<div className="h-full flex flex-col bg-muted/20">
										<div
											className="flex-1 overflow-auto p-6"
											style={{
												transform: `scale(${Number.parseInt(zoom) / 100})`,
												transformOrigin: "top center",
											}}
										>
											<A4Preview content={fullContent} onPageChange={setCurrentPage} />
										</div>
									</div>
								</TabsContent>
							</>
						)
					}
				</Tabs>
			</div>
		</div>
	)
}