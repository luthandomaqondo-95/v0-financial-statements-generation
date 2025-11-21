"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AIGenerationDialogProps {
  onGenerate: (markdown: string) => void
}

export function AIGenerationDialog({ onGenerate }: AIGenerationDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [companyName, setCompanyName] = useState("")
  const [financialYear, setFinancialYear] = useState(new Date().getFullYear().toString())
  const [additionalInfo, setAdditionalInfo] = useState("")

  const handleGenerate = async () => {
    if (!companyName) {
      toast.error("Please enter a company name")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/generate-afs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate an Annual Financial Statement for ${companyName} for the financial year ending ${financialYear}. ${additionalInfo}`,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate financial statement")
      }

      const data = await response.json()
      onGenerate(data.markdown)
      setOpen(false)
      toast.success("Financial statement generated successfully!")

      // Reset form
      setCompanyName("")
      setFinancialYear(new Date().getFullYear().toString())
      setAdditionalInfo("")
    } catch (error) {
      console.error("Error generating statement:", error)
      toast.error("Failed to generate financial statement")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Sparkles className="h-4 w-4" />
          AI Generate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Generate Financial Statement with AI</DialogTitle>
          <DialogDescription>
            Provide company details and let AI generate a comprehensive Annual Financial Statement.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="company-name">Company Name *</Label>
            <Input
              id="company-name"
              placeholder="Acme Corporation Ltd."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="financial-year">Financial Year End</Label>
            <Input
              id="financial-year"
              type="number"
              placeholder="2024"
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="additional-info">Additional Information (Optional)</Label>
            <Textarea
              id="additional-info"
              placeholder="E.g., Industry sector, revenue range, specific financial details..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
