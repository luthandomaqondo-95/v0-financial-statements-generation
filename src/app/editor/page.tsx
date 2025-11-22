"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { A4Preview } from "@/components/a4-preview"
import { AIGenerationDialog } from "@/components/ai-generation-dialog"
import { PDFExport } from "@/components/pdf-export"
import { FinancialTemplates } from "@/components/financial-templates"
import { Save, FileText, ChevronLeft, ZoomIn, ZoomOut, Eye, Edit, Plus } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageEditor } from "@/components/page-editor"

const defaultContent = `# Annual Financial Statement 2024

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

export default function EditorPage() {
	// Initialize pages by splitting the default content
	// We use a regex to handle potential variations in line breaks around the separator
	const [pages, setPages] = useState<string[]>(() => {
		return defaultContent.split(/\n---\n/).map((p) => p.trim())
	})

	const [currentPage, setCurrentPage] = useState(1)
	const [zoom, setZoom] = useState("100")
	const [activeTab, setActiveTab] = useState("edit")
	const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait")

	// Computed full content for preview/export
	const fullContent = useMemo(() => pages.join("\n\n---\n\n"), [pages])

	const handleAIGenerate = (markdown: string) => {
		const newPages = markdown.split(/\n---\n/).map((p) => p.trim())
		setPages(newPages)
		toast.success("Content updated with AI-generated statement")
	}

	const handleTemplateSelect = (templateContent: string) => {
		const newPages = templateContent.split(/\n---\n/).map((p) => p.trim())
		setPages(newPages)
		toast.success("Template loaded successfully")
	}

	const handleSave = () => {
		// In production, this would save to a database
		localStorage.setItem("afs-draft", fullContent)
		toast.success("Draft saved successfully!")
	}

	const updatePage = (index: number, content: string) => {
		setPages((prev) => {
			const newPages = [...prev]
			newPages[index] = content
			return newPages
		})
	}

	const addPage = (index: number) => {
		setPages((prev) => {
			const newPages = [...prev]
			// Insert empty page after current index
			newPages.splice(index + 1, 0, "")
			return newPages
		})
		toast.success("New page added")
	}

	const deletePage = (index: number) => {
		if (pages.length <= 1) {
			toast.error("Cannot delete the last page")
			return
		}
		setPages((prev) => prev.filter((_, i) => i !== index))
		toast.success("Page deleted")
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
				<div className="ml-auto flex items-center gap-2">
					<FinancialTemplates onSelectTemplate={handleTemplateSelect} />
					<AIGenerationDialog onGenerate={handleAIGenerate} />
					<Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handleSave}>
						<Save className="h-4 w-4" />
						Save
					</Button>
					<PDFExport content={fullContent} />
				</div>
			</header>

			{/* Main Content */}
			<div className="flex-1 overflow-hidden">
				<Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
					<div className="border-b px-4 bg-muted/30 flex items-center justify-between shrink-0">
						<TabsList className="h-12 bg-transparent p-0 gap-6">
							<TabsTrigger
								value="edit"
								className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2"
							>
								<Edit className="h-4 w-4 mr-2" />
								Editor
							</TabsTrigger>
							<TabsTrigger
								value="preview"
								className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2"
							>
								<Eye className="h-4 w-4 mr-2" />
								Preview
							</TabsTrigger>
						</TabsList>

						{activeTab === "edit" && (
							<Tabs value={orientation} onValueChange={(v) => setOrientation(v as "portrait" | "landscape")}>
								<TabsList className="h-9">
									<TabsTrigger value="portrait" className="text-xs">
										Portrait
									</TabsTrigger>
									<TabsTrigger value="landscape" className="text-xs">
										Landscape
									</TabsTrigger>
								</TabsList>
							</Tabs>
						)}

						{activeTab === "preview" && (
							<div className="flex items-center gap-3 py-2">
								<div className="flex items-center gap-2">
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7"
										onClick={() => {
											const newZoom = Math.max(50, Number.parseInt(zoom) - 25).toString()
											setZoom(newZoom)
										}}
									>
										<ZoomOut className="h-4 w-4" />
									</Button>
									<Select value={zoom} onValueChange={setZoom}>
										<SelectTrigger className="w-20 h-7 text-xs">
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
										onClick={() => {
											const newZoom = Math.min(200, Number.parseInt(zoom) + 25).toString()
											setZoom(newZoom)
										}}
									>
										<ZoomIn className="h-4 w-4" />
									</Button>
								</div>
								<div className="text-xs text-muted-foreground">Page {currentPage}</div>
							</div>
						)}
					</div>

					<TabsContent
						value="edit"
						className="flex-1 mt-0 border-0 p-0 overflow-hidden data-[state=inactive]:hidden h-full"
					>
						<div className="h-full overflow-auto bg-muted/10 relative">
							<div className="flex flex-col items-center py-8 min-h-full">
								{pages.map((pageContent, index) => (
									<PageEditor
										key={index}
										pageNumber={index + 1}
										totalPages={pages.length}
										content={pageContent}
										onChange={(content) => updatePage(index, content)}
										onAddNext={() => addPage(index)}
										onDelete={() => deletePage(index)}
										orientation={orientation}
									/>
								))}

								<Button
									variant="outline"
									size="lg"
									className="mt-4 mb-12 gap-2 border-dashed bg-transparent"
									onClick={() => addPage(pages.length - 1)}
								>
									<Plus className="h-4 w-4" />
									Add New Page
								</Button>
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
