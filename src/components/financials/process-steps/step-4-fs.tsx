"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { FileText, Eye, Check, ChevronRight, FileCheck, BookOpen, BarChart3, Scale, DollarSign, TrendingUp, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface StatementOption {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    included: boolean;
    required: boolean;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
}

export function Step4FS() {
    const [statements, setStatements] = useState<StatementOption[]>([
        {
            id: "balance-sheet",
            title: "Statement of Financial Position",
            description: "Balance sheet showing assets, liabilities, and equity",
            icon: <Scale className="h-5 w-5" />,
            included: true,
            required: true,
        },
        {
            id: "income-statement",
            title: "Statement of Comprehensive Income",
            description: "Income statement showing revenue and expenses",
            icon: <DollarSign className="h-5 w-5" />,
            included: true,
            required: true,
        },
        {
            id: "cash-flow",
            title: "Statement of Cash Flows",
            description: "Cash flow from operating, investing, and financing activities",
            icon: <TrendingUp className="h-5 w-5" />,
            included: true,
            required: true,
        },
        {
            id: "changes-equity",
            title: "Statement of Changes in Equity",
            description: "Movement in share capital and retained earnings",
            icon: <BarChart3 className="h-5 w-5" />,
            included: true,
            required: true,
        },
        {
            id: "notes",
            title: "Notes to Financial Statements",
            description: "Accounting policies and detailed disclosures",
            icon: <BookOpen className="h-5 w-5" />,
            included: true,
            required: true,
        },
        {
            id: "directors-report",
            title: "Directors' Report",
            description: "Report on business activities and state of affairs",
            icon: <FileText className="h-5 w-5" />,
            included: true,
            required: false,
        },
        {
            id: "accountant-report",
            title: "Independent Accountant's Report",
            description: "Compilation or review report",
            icon: <FileCheck className="h-5 w-5" />,
            included: true,
            required: false,
        },
    ])

    const toggleStatement = (id: string) => {
        setStatements(prev => prev.map(s => 
            s.id === id && !s.required ? { ...s, included: !s.included } : s
        ))
    }

    const includedCount = statements.filter(s => s.included).length

    return (
        <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
            <div className="mx-auto p-8">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Financial Statements</h1>
                            <p className="text-muted-foreground text-sm">Configure your Annual Financial Statements output</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6"
                >
                    {/* Statement Selection */}
                    <motion.div variants={itemVariants}>
                        <Card className="border-0 m-0 p-0 shadow-lg shadow-black/5">
                            <CardHeader className="p-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-violet-50 dark:bg-violet-950 flex items-center justify-center">
                                            <FileCheck className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Included Statements</CardTitle>
                                            <CardDescription>Select which statements to include in your AFS</CardDescription>
                                        </div>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        {includedCount} of {statements.length} selected
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 p-0 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {statements.map((statement, index) => (
                                    <div
                                        key={index}
                                        // whileHover={{ x: 4 }}
                                        onClick={() => toggleStatement(statement.id)}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                                            statement.included
                                                ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900"
                                                : "bg-muted/30 border-transparent hover:bg-muted/50",
                                            statement.required && "cursor-default"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                                            statement.included
                                                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400"
                                                : "bg-muted text-muted-foreground"
                                        )}>
                                            {statement.icon}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{statement.title}</p>
                                                {statement.required && (
                                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                                                        Required
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{statement.description}</p>
                                        </div>
                                        <div className={cn(
                                            "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0",
                                            statement.included
                                                ? "border-emerald-500 bg-emerald-500"
                                                : "border-muted-foreground/30"
                                        )}>
                                            {statement.included && (
                                                <Check className="h-4 w-4 text-white" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Info Box */}
                    <motion.div variants={itemVariants}>
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-blue-900 dark:text-blue-100">Ready to Generate</p>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                    Once you proceed to the next step, our AI will generate your complete Annual Financial Statements 
                                    based on your trial balance data and the options you've selected. You'll be able to review and 
                                    edit each page before finalizing.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Preview Summary */}
                    <motion.div variants={itemVariants}>
                        <Card className="border-0 shadow-lg shadow-black/5 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-1">Your AFS Preview</h3>
                                        <p className="text-slate-400 text-sm">
                                            {includedCount} statements selected
                                        </p>
                                    </div>
                                    <Button 
                                        variant="secondary" 
                                        className="gap-2 bg-white text-slate-900 hover:bg-slate-100"
                                    >
                                        <Eye className="h-4 w-4" />
                                        Preview
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>

                {/* Spacer */}
                <div className="h-8" />
            </div>
        </div>
    )
}
