"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { A4Preview } from "@/components/a4-preview"
import { AIGenerationDialog } from "@/components/ai-generation-dialog"
import { PDFExport } from "@/components/pdf-export"
import { FinancialTemplates } from "@/components/financial-templates"
import { Save, FileText, ChevronLeft, ChevronsLeft, ChevronsRight, ZoomIn, ZoomOut, Eye, Edit, Plus, Loader2, List, Check } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageEditor, PageSettings } from "@/components/page-editor"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const defaultPageSettings: PageSettings = {
	orientation: "portrait",
	margins: { top: 20, right: 20, bottom: 20, left: 20 },
}

const defaultContent = `
# Annual Financial Statement 2024

## Company Information
**Company Name:** Acme Corporation Ltd.  
**Registration Number:** 12345678  
**Financial Year End:** December 31, 2024

---

## Statement of Financial Position

### Assets

#### Non-Current Assets
| Description | 2024 ($) | 2023 ($) |
|-------------|----------|----------|
| Property, Plant & Equipment | 2,450,000 | 2,100,000 |
| Intangible Assets | 350,000 | 280,000 |
| **Total Non-Current Assets** | **2,800,000** | **2,380,000** |

#### Current Assets
| Description | 2024 ($) | 2023 ($) |
|-------------|----------|----------|
| Cash and Cash Equivalents | 450,000 | 380,000 |
| Trade Receivables | 620,000 | 540,000 |
| Inventory | 380,000 | 320,000 |
| **Total Current Assets** | **1,450,000** | **1,240,000** |

**Total Assets:** $4,250,000

---

## Financial Performance

### Revenue Growth

\`\`\`chart
{
  "type": "bar",
  "title": "Revenue vs Expenses (2020-2024)",
  "data": [
    { "year": "2020", "revenue": 3500000, "expenses": 2800000 },
    { "year": "2021", "revenue": 4100000, "expenses": 3200000 },
    { "year": "2022", "revenue": 4500000, "expenses": 3400000 },
    { "year": "2023", "revenue": 4800000, "expenses": 3600000 },
    { "year": "2024", "revenue": 5200000, "expenses": 3900000 }
  ],
  "xAxisKey": "year",
  "dataKeys": ["revenue", "expenses"],
  "colors": ["#2563eb", "#dc2626"]
}
\`\`\`

---

## Statement of Comprehensive Income

### Revenue and Expenses

| Description | 2024 ($) | 2023 ($) |
|-------------|----------|----------|
| Revenue | 5,200,000 | 4,800,000 |
| Cost of Sales | (3,100,000) | (2,900,000) |
| **Gross Profit** | **2,100,000** | **1,900,000** |
| Operating Expenses | (1,200,000) | (1,100,000) |
| **Operating Profit** | **900,000** | **800,000** |
| Finance Costs | (50,000) | (45,000) |
| **Profit Before Tax** | **850,000** | **755,000** |
| Income Tax Expense | (212,500) | (188,750) |
| **Profit for the Year** | **637,500** | **566,250** |

---

## Notes to the Financial Statements

### 1. Accounting Policies

The financial statements have been prepared in accordance with International Financial Reporting Standards (IFRS) and the Companies Act 2006.

### 2. Revenue Recognition

Revenue is recognized when control of goods or services is transferred to the customer, typically upon delivery.

### 3. Property, Plant & Equipment

Property, plant and equipment are stated at cost less accumulated depreciation. Depreciation is calculated on a straight-line basis over the estimated useful lives of the assets.

---

## Director's Statement

The directors are responsible for preparing the financial statements in accordance with applicable law and regulations. The directors consider that the financial statements give a true and fair view of the state of affairs of the company.

**Signed:**

_________________________  
John Smith, Director  
Date: March 15, 2025
`

interface PageData {
	id: string
	content: string
	settings: PageSettings
	isTableOfContents?: boolean
}

// Generate unique ID
const generateId = () => `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

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
	// Initialize pages by splitting the default content
	const [pages, setPages] = useState<PageData[]>(() => {
		return defaultContent.split(/\n---\n/).map((p) => ({
			id: generateId(),
			content: p.trim(),
			settings: { ...defaultPageSettings },
		}))
	})

	const [currentPage, setCurrentPage] = useState(1)
	const [zoom, setZoom] = useState("100")
	const [activeTab, setActiveTab] = useState("edit")
	const [isChatOpen, setIsChatOpen] = useState(true)
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
		if (hasUnsavedChanges && debouncedContent) {
			performAutoSave()
		}
	}, [debouncedContent])

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
		const newPages = templateContent.split(/\n---\n/).map((p) => ({
			id: generateId(),
			content: p.trim(),
			settings: { ...defaultPageSettings },
		}))
		setPages(newPages)
		setHasUnsavedChanges(true)
		setHasTableOfContents(false)
		toast.success("Template loaded successfully")
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
				<Link href="/">
					<Button variant="ghost" size="sm" className="gap-2">
						<ChevronLeft className="h-4 w-4" />
						Back
					</Button>
				</Link>
				<div className="flex items-center gap-2">
					<FileText className="h-5 w-5 text-muted-foreground" />
					<span className="font-medium">Annual Financial Statement 2024</span>
				</div>

				{/* Auto-save indicator */}
				<div className="flex items-center gap-2 ml-4">
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

					<FinancialTemplates onSelectTemplate={handleTemplateSelect} />
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
					<PDFExport content={fullContent} />
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
								</div>
							</div>
						</div>
					</div>

					<TabsContent
						value="edit"
						className="flex-1 flex flex-row mt-0 border-0 p-0 overflow-hidden data-[state=inactive]:hidden h-full"
					>

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
				</Tabs>
			</div>
		</div>
	)
}
