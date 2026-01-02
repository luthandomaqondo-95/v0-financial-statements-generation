"use client"

import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface PDFExportProps {
  content: string
  filename?: string
}

export function PDFExport({ content, filename = "financial-statement.pdf" }: PDFExportProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      // Import libraries dynamically to reduce initial bundle size
      const html2canvas = (await import("html2canvas")).default
      const { jsPDF } = await import("jspdf")

      // Find all A4 preview pages
      const pages = document.querySelectorAll("[data-pdf-page]")

      if (pages.length === 0) {
        toast.error("No content to export")
        return
      }

      // A4 dimensions in mm
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const pdfWidth = 210 // A4 width in mm
      const pdfHeight = 297 // A4 height in mm

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement

        // Capture the page as canvas
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        })

        const imgData = canvas.toDataURL("image/png")

        // Add new page if not first page
        if (i > 0) {
          pdf.addPage()
        }

        // Add image to PDF
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      }

      // Save the PDF
      pdf.save(filename)
      toast.success("PDF exported successfully!")
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast.error("Failed to export PDF")
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button onClick={handleExport} disabled={exporting} size="sm" className="gap-2">
      {exporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Export
        </>
      )}
    </Button>
  )
}
