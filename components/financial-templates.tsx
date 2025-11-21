"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FileText, Building2, TrendingUp, DollarSign } from "lucide-react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface FinancialTemplatesProps {
  onSelectTemplate: (template: string) => void
}

const templates = [
  {
    id: "full-afs",
    name: "Complete Annual Financial Statement",
    description: "Full AFS with balance sheet, income statement, cash flow, and notes",
    icon: FileText,
    content: `# Annual Financial Statement {{YEAR}}

## Company Information
**Company Name:** {{COMPANY_NAME}}
**Registration Number:** {{REG_NUMBER}}
**Financial Year End:** {{YEAR_END}}

---

## Statement of Financial Position
...
`,
  },
  {
    id: "management-accounts",
    name: "Management Accounts",
    description: "Monthly/quarterly management reporting package",
    icon: TrendingUp,
    content: `# Management Accounts - {{PERIOD}}

## Executive Summary
...
`,
  },
  {
    id: "cash-flow",
    name: "Cash Flow Statement",
    description: "Detailed cash flow analysis and projections",
    icon: DollarSign,
    content: `# Cash Flow Statement

## Operating Activities
...
`,
  },
  {
    id: "consolidated",
    name: "Consolidated Financials",
    description: "Group financial statements with subsidiaries",
    icon: Building2,
    content: `# Consolidated Financial Statements

## Group Structure
...
`,
  },
]

export function FinancialTemplates({ onSelectTemplate }: FinancialTemplatesProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Financial Statement Templates</DialogTitle>
          <DialogDescription>Choose a template to get started quickly</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {templates.map((template) => {
            const Icon = template.icon
            return (
              <Card
                key={template.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => onSelectTemplate(template.content)}
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">{template.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
