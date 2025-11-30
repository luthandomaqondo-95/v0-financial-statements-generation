"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Calculator, Search, Filter, Download, Upload, ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, RefreshCw, ArrowUpDown, Layers } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface TrialBalanceAccount {
    id: string;
    accountCode: string;
    accountName: string;
    category: string;
    subCategory: string;
    debit: number;
    credit: number;
    isExpanded?: boolean;
    children?: TrialBalanceAccount[];
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: "ZAR",
        minimumFractionDigits: 2,
    }).format(amount)
}

const sampleTrialBalance: TrialBalanceAccount[] = [
    {
        id: "1",
        accountCode: "1000",
        accountName: "Assets",
        category: "Assets",
        subCategory: "",
        debit: 2450000,
        credit: 0,
        children: [
            { id: "1.1", accountCode: "1100", accountName: "Current Assets", category: "Assets", subCategory: "Current", debit: 1200000, credit: 0 },
            { id: "1.2", accountCode: "1200", accountName: "Property, Plant & Equipment", category: "Assets", subCategory: "Non-Current", debit: 850000, credit: 0 },
            { id: "1.3", accountCode: "1300", accountName: "Investments", category: "Assets", subCategory: "Non-Current", debit: 400000, credit: 0 },
        ]
    },
    {
        id: "2",
        accountCode: "2000",
        accountName: "Liabilities",
        category: "Liabilities",
        subCategory: "",
        debit: 0,
        credit: 980000,
        children: [
            { id: "2.1", accountCode: "2100", accountName: "Current Liabilities", category: "Liabilities", subCategory: "Current", debit: 0, credit: 450000 },
            { id: "2.2", accountCode: "2200", accountName: "Long-term Liabilities", category: "Liabilities", subCategory: "Non-Current", debit: 0, credit: 530000 },
        ]
    },
    {
        id: "3",
        accountCode: "3000",
        accountName: "Equity",
        category: "Equity",
        subCategory: "",
        debit: 0,
        credit: 1470000,
        children: [
            { id: "3.1", accountCode: "3100", accountName: "Share Capital", category: "Equity", subCategory: "", debit: 0, credit: 100000 },
            { id: "3.2", accountCode: "3200", accountName: "Retained Earnings", category: "Equity", subCategory: "", debit: 0, credit: 1370000 },
        ]
    },
    {
        id: "4",
        accountCode: "4000",
        accountName: "Revenue",
        category: "Income",
        subCategory: "",
        debit: 0,
        credit: 3200000,
        children: [
            { id: "4.1", accountCode: "4100", accountName: "Sales Revenue", category: "Income", subCategory: "", debit: 0, credit: 3000000 },
            { id: "4.2", accountCode: "4200", accountName: "Other Income", category: "Income", subCategory: "", debit: 0, credit: 200000 },
        ]
    },
    {
        id: "5",
        accountCode: "5000",
        accountName: "Expenses",
        category: "Expenses",
        subCategory: "",
        debit: 3200000,
        credit: 0,
        children: [
            { id: "5.1", accountCode: "5100", accountName: "Cost of Sales", category: "Expenses", subCategory: "", debit: 1800000, credit: 0 },
            { id: "5.2", accountCode: "5200", accountName: "Operating Expenses", category: "Expenses", subCategory: "", debit: 950000, credit: 0 },
            { id: "5.3", accountCode: "5300", accountName: "Finance Costs", category: "Expenses", subCategory: "", debit: 450000, credit: 0 },
        ]
    },
]

export function Step3GLAndTrial() {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(["1", "2", "3", "4", "5"]))
    const [trialBalance] = useState<TrialBalanceAccount[]>(sampleTrialBalance)

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedRows)
        if (newExpanded.has(id)) {
            newExpanded.delete(id)
        } else {
            newExpanded.add(id)
        }
        setExpandedRows(newExpanded)
    }

    const totalDebits = trialBalance.reduce((sum, acc) => sum + acc.debit, 0)
    const totalCredits = trialBalance.reduce((sum, acc) => sum + acc.credit, 0)
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

    const filteredAccounts = trialBalance.filter(account => {
        const matchesSearch = searchTerm === "" || 
            account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.accountCode.includes(searchTerm)
        const matchesCategory = selectedCategory === "all" || account.category === selectedCategory
        return matchesSearch && matchesCategory
    })

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
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Calculator className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Trial Balance Review</h1>
                            <p className="text-muted-foreground text-sm">Review and verify your general ledger accounts</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6"
                >
                    {/* Summary Cards */}
                    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="border-0 shadow-lg shadow-black/5">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Debits</p>
                                        <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalDebits)}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
                                        <ArrowUpDown className="h-5 w-5 text-emerald-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-lg shadow-black/5">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Credits</p>
                                        <p className="text-xl font-bold text-blue-600">{formatCurrency(totalCredits)}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                                        <ArrowUpDown className="h-5 w-5 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-lg shadow-black/5">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Difference</p>
                                        <p className={cn(
                                            "text-xl font-bold",
                                            isBalanced ? "text-emerald-600" : "text-red-600"
                                        )}>
                                            {formatCurrency(Math.abs(totalDebits - totalCredits))}
                                        </p>
                                    </div>
                                    <div className={cn(
                                        "h-10 w-10 rounded-lg flex items-center justify-center",
                                        isBalanced 
                                            ? "bg-emerald-50 dark:bg-emerald-950" 
                                            : "bg-red-50 dark:bg-red-950"
                                    )}>
                                        {isBalanced 
                                            ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                            : <AlertTriangle className="h-5 w-5 text-red-600" />
                                        }
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className={cn(
                            "border-0 shadow-lg shadow-black/5",
                            isBalanced 
                                ? "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900"
                                : "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900"
                        )}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
                                        <p className={cn(
                                            "text-xl font-bold",
                                            isBalanced ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"
                                        )}>
                                            {isBalanced ? "Balanced" : "Unbalanced"}
                                        </p>
                                    </div>
                                    {isBalanced 
                                        ? <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                                        : <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                                    }
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Filters and Actions */}
                    <motion.div variants={itemVariants}>
                        <Card className="border-0 shadow-lg shadow-black/5">
                            <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by account name or code..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 h-10"
                                        />
                                    </div>
                                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                        <SelectTrigger className="w-full md:w-[180px] h-10">
                                            <Filter className="h-4 w-4 mr-2" />
                                            <SelectValue placeholder="Filter by category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            <SelectItem value="Assets">Assets</SelectItem>
                                            <SelectItem value="Liabilities">Liabilities</SelectItem>
                                            <SelectItem value="Equity">Equity</SelectItem>
                                            <SelectItem value="Income">Income</SelectItem>
                                            <SelectItem value="Expenses">Expenses</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="h-10 gap-2">
                                            <Upload className="h-4 w-4" />
                                            Import
                                        </Button>
                                        <Button variant="outline" size="sm" className="h-10 gap-2">
                                            <Download className="h-4 w-4" />
                                            Export
                                        </Button>
                                        <Button variant="outline" size="sm" className="h-10 gap-2">
                                            <RefreshCw className="h-4 w-4" />
                                            Refresh
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Trial Balance Table */}
                    <motion.div variants={itemVariants}>
                        <Card className="border-0 shadow-lg shadow-black/5 overflow-hidden">
                            <CardHeader className="pb-0">
                                <div className="flex items-center gap-2">
                                    <Layers className="h-5 w-5 text-muted-foreground" />
                                    <CardTitle className="text-lg">Account Balances</CardTitle>
                                </div>
                                <CardDescription>
                                    Click on a row to expand and view sub-accounts
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 mt-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="text-left p-4 font-medium text-xs uppercase tracking-wider text-muted-foreground w-8"></th>
                                                <th className="text-left p-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">Code</th>
                                                <th className="text-left p-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">Account Name</th>
                                                <th className="text-left p-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">Category</th>
                                                <th className="text-right p-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">Debit</th>
                                                <th className="text-right p-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">Credit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAccounts.map((account) => (
                                                <>
                                                    <tr 
                                                        key={account.id}
                                                        className={cn(
                                                            "border-b transition-colors cursor-pointer hover:bg-muted/50",
                                                            expandedRows.has(account.id) && "bg-muted/30"
                                                        )}
                                                        onClick={() => toggleExpand(account.id)}
                                                    >
                                                        <td className="p-4">
                                                            {account.children && account.children.length > 0 && (
                                                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                                                    {expandedRows.has(account.id) 
                                                                        ? <ChevronDown className="h-4 w-4" />
                                                                        : <ChevronRight className="h-4 w-4" />
                                                                    }
                                                                </Button>
                                                            )}
                                                        </td>
                                                        <td className="p-4 font-mono text-sm font-medium">{account.accountCode}</td>
                                                        <td className="p-4 font-medium">{account.accountName}</td>
                                                        <td className="p-4">
                                                            <span className={cn(
                                                                "text-xs px-2 py-1 rounded-full font-medium",
                                                                account.category === "Assets" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
                                                                account.category === "Liabilities" && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
                                                                account.category === "Equity" && "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
                                                                account.category === "Income" && "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
                                                                account.category === "Expenses" && "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
                                                            )}>
                                                                {account.category}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-right font-mono text-sm">
                                                            {account.debit > 0 ? formatCurrency(account.debit) : "-"}
                                                        </td>
                                                        <td className="p-4 text-right font-mono text-sm">
                                                            {account.credit > 0 ? formatCurrency(account.credit) : "-"}
                                                        </td>
                                                    </tr>
                                                    {/* Child rows */}
                                                    {expandedRows.has(account.id) && account.children?.map((child) => (
                                                        <motion.tr
                                                            key={child.id}
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            className="border-b bg-muted/20 hover:bg-muted/40"
                                                        >
                                                            <td className="p-4"></td>
                                                            <td className="p-4 pl-10 font-mono text-sm text-muted-foreground">{child.accountCode}</td>
                                                            <td className="p-4 text-muted-foreground">{child.accountName}</td>
                                                            <td className="p-4 text-xs text-muted-foreground">{child.subCategory || "-"}</td>
                                                            <td className="p-4 text-right font-mono text-sm text-muted-foreground">
                                                                {child.debit > 0 ? formatCurrency(child.debit) : "-"}
                                                            </td>
                                                            <td className="p-4 text-right font-mono text-sm text-muted-foreground">
                                                                {child.credit > 0 ? formatCurrency(child.credit) : "-"}
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-muted font-bold">
                                                <td className="p-4" colSpan={4}>
                                                    <span className="text-sm uppercase tracking-wider">Totals</span>
                                                </td>
                                                <td className="p-4 text-right font-mono">{formatCurrency(totalDebits)}</td>
                                                <td className="p-4 text-right font-mono">{formatCurrency(totalCredits)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
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
