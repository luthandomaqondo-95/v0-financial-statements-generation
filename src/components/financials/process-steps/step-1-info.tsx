"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { z } from "zod"
import { Building2, Calendar, Users, Briefcase, FileCheck, MapPin, Plus, Trash2, Settings, Check, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UseFormReturn } from "react-hook-form"
import { projectInfoSchema } from "@/lib/definitions"
import { cn } from "@/lib/utils"
import { Director, ReportingFramework } from "@/types/afs-types"
import { frameworkMapping, reverseFrameworkMapping } from "@/lib/definitions"



const reportingFrameworks: ReportingFramework[] = [
    { id: "ifrs-small", name: "IFRS for SMEs", description: "International Financial Reporting Standard for Small and Medium-sized Entities", recommended: true },
    { id: "ifrs", name: "Full IFRS", description: "Full International Financial Reporting Standards" },
    { id: "sa-gaap", name: "SA GAAP", description: "South African Generally Accepted Accounting Practice" },
    { id: "micro", name: "Micro Entity", description: "Simplified reporting for micro entities" },
]

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
}

export function Step1Info({
    projectInfoForm,
    setIsSaving,
    setHasUnsavedChanges
}: {
    projectInfoForm: UseFormReturn<z.infer<typeof projectInfoSchema>>
    setIsSaving: (isSaving: boolean) => void
    setHasUnsavedChanges: (hasUnsavedChanges: boolean) => void
}) {
    // Initialize directors from form or use default.
    const [directors, setDirectors] = useState<Director[]>(() => {
        const formDirectors = projectInfoForm.getValues("directors")
        if (formDirectors && formDirectors.length > 0) {
            return formDirectors.map((name: string, index: number) => ({
                id: String(index + 1),
                name,
                designation: "Director",
                idNumber: ""
            }))
        }
        return [{ id: "1", name: "", designation: "Director", idNumber: "" }]
    })

    const addDirector = () => {
        setDirectors([
            ...directors,
            { id: Date.now().toString(), name: "", designation: "Director", idNumber: "" }
        ])
    }
    const removeDirector = (id: string) => {
        if (directors.length > 1) {
            setDirectors(directors.filter(d => d.id !== id))
        }
    }
    const updateDirector = (id: string, field: keyof Director, value: string) => {
        setDirectors(directors.map(d =>
            d.id === id ? { ...d, [field]: value } : d
        ))
    }

    // Sync directors to form when they change
    useEffect(() => {
        const directorNames = directors.map(d => d.name).filter(name => name.trim() !== "")
        if (directorNames.length > 0) {
            projectInfoForm.setValue("directors", directorNames)
            setHasUnsavedChanges(true)
        }
    }, [directors, projectInfoForm, setHasUnsavedChanges])



    return (
        <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
            <div className="mx-auto p-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-0"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Project Information</h1>
                            {/* <p className="text-muted-foreground text-sm">Enter the company details for your Annual Financial Statements</p> */}
                        </div>
                    </div>
                </motion.div>

                <Form {...projectInfoForm}>
                    <form className="space-y-6">
                        {/* Reporting Framework Selection */}
                        <motion.div variants={itemVariants}>
                            <Card className="border-0 shadow-lg shadow-black/5">
                                <CardHeader className="pb-0">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
                                            <Settings className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Reporting Framework</CardTitle>
                                            <CardDescription>Select the accounting standard for your financial statements</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={projectInfoForm.control}
                                        name="reportingFramework"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                                        {reportingFrameworks.map((framework) => {
                                                            const isSelected = field.value ? frameworkMapping[field.value] === framework.id : false
                                                            return (
                                                                <motion.button
                                                                    type="button"
                                                                    key={framework.id}
                                                                    whileHover={{ scale: 1.01 }}
                                                                    whileTap={{ scale: 0.99 }}
                                                                    onClick={() => {
                                                                        const formValue = reverseFrameworkMapping[framework.id] as "ifrs-small" | "ifrs" | "sa-gaap" | "micro"
                                                                        field.onChange(formValue)
                                                                        setHasUnsavedChanges(true)
                                                                    }}
                                                                    className={cn(
                                                                        "cursor-pointer relative p-4 rounded-xl border-2 text-left transition-all",
                                                                        isSelected
                                                                            ? "border-primary bg-primary/5 shadow-md"
                                                                            : "border-transparent bg-muted/50 hover:bg-muted"
                                                                    )}
                                                                >
                                                                    {framework.recommended && (
                                                                        <span className="absolute -top-2 -right-2 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                                                                            <Sparkles className="h-3 w-3" />
                                                                            Recommended
                                                                        </span>
                                                                    )}
                                                                    <div className="flex items-start gap-3">
                                                                        <div className={cn(
                                                                            "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                                                                            isSelected
                                                                                ? "border-primary bg-primary"
                                                                                : "border-muted-foreground/30"
                                                                        )}>
                                                                            {isSelected && (
                                                                                <Check className="h-3 w-3 text-primary-foreground" />
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-medium">{framework.name}</p>
                                                                            <p className="text-xs text-muted-foreground mt-0.5">{framework.description}</p>
                                                                        </div>
                                                                    </div>
                                                                </motion.button>
                                                            )
                                                        })}
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-red-400" />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Fiscal Year Card */}
                            <motion.div variants={itemVariants}>
                                <Card className="border-0 shadow-lg shadow-black/5">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-violet-50 dark:bg-violet-950 flex items-center justify-center">
                                                <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">Financial Period</CardTitle>
                                                <CardDescription>Year-end and reporting period</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid gap-6">
                                        <div className="grid md:grid-cols-3 gap-4">
                                            <FormField
                                                control={projectInfoForm.control}
                                                name="financialYear"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                                                            Financial Year End <span className="text-red-500">*</span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="date"
                                                                className="h-11"
                                                                value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""}
                                                                onChange={(e) => {
                                                                    const dateValue = e.target.value ? new Date(e.target.value) : undefined
                                                                    field.onChange(dateValue)
                                                                    setHasUnsavedChanges(true)
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-red-400" />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={projectInfoForm.control}
                                                name="comparativePeriod"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                                                            Comparative Period
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Select
                                                                value={field.value}
                                                                onValueChange={(value) => {
                                                                    field.onChange(value)
                                                                    setHasUnsavedChanges(true)
                                                                }}
                                                            >
                      sibabalwe.ntoyi@appimate.com                                          <FormControl>
                                                                    <SelectTrigger className="h-11 w-full">
                                                                        <SelectValue placeholder="Select comparative period" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="none">No comparatives</SelectItem>
                                                                    <SelectItem value="1-year">1 year comparative</SelectItem>
                                                                    <SelectItem value="2-year">2 year comparative</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormControl>
                                                        <FormMessage className="text-red-400" />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={projectInfoForm.control}
                                                name="currency"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                                                            Currency <span className="text-red-500">*</span>
                                                        </FormLabel>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={(value) => {
                                                                field.onChange(value)
                                                                setHasUnsavedChanges(true)
                                                            }}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="h-11 w-full">
                                                                    <SelectValue placeholder="Select currency" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="ZAR">South African Rand (ZAR)</SelectItem>
                                                                <SelectItem value="USD">US Dollar (USD)</SelectItem>
                                                                <SelectItem value="EUR">Euro (EUR)</SelectItem>
                                                                <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage className="text-red-400" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                                            <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                                The financial period is automatically calculated as 12 months ending on your year-end date.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </motion.div>


                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid gap-6"
                        >
                            {/* Company Details Card */}
                            <motion.div variants={itemVariants}>
                                <Card className="border-0 shadow-lg shadow-black/5">
                                    <CardHeader className="pb-0">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                                                <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">Company Details</CardTitle>
                                                <CardDescription>Legal entity information</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid gap-6">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <FormField
                                                control={projectInfoForm.control}
                                                name="category"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                                                            Business Category <span className="text-red-500">*</span>
                                                        </FormLabel>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={(value) => {
                                                                field.onChange(value)
                                                                setHasUnsavedChanges(true)
                                                            }}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="h-14 w-full">
                                                                    <SelectValue placeholder="Select business category" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="product">Product-based business</SelectItem>
                                                                <SelectItem value="service">Service-based business</SelectItem>
                                                                <SelectItem value="all">Any business activity</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage className="text-red-400" />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={projectInfoForm.control}
                                                name="natureOfBusiness"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                                                            Nature of Business <span className="text-red-500">*</span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Describe your business nature"
                                                                className="h-11"
                                                                {...field}
                                                                onChange={(e) => {
                                                                    field.onChange(e)
                                                                    setHasUnsavedChanges(true)
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-red-400" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <FormField
                                                control={projectInfoForm.control}
                                                name="country"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                                                            Country of Incorporation <span className="text-red-500">*</span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="South Africa"
                                                                className="h-11"
                                                                {...field}
                                                                onChange={(e) => {
                                                                    field.onChange(e)
                                                                    setHasUnsavedChanges(true)
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-red-400" />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={projectInfoForm.control}
                                                name="bankers"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                                                            Bankers (optional)
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Bank name"
                                                                className="h-11"
                                                                {...field}
                                                                onChange={(e) => {
                                                                    field.onChange(e)
                                                                    setHasUnsavedChanges(true)
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-red-400" />
                                                    </FormItem>
                                                )}
                                            />

                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <FormField
                                                control={projectInfoForm.control}
                                                name="auditor"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                                                            Auditor <span className="text-red-500">*</span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <FileCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                <Input
                                                                    placeholder="Enter auditor name"
                                                                    className="h-11 pl-10"
                                                                    {...field}
                                                                    onChange={(e) => {
                                                                        field.onChange(e)
                                                                        setHasUnsavedChanges(true)
                                                                    }}
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage className="text-red-400" />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={projectInfoForm.control}
                                                name="preparedBy"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                                                            Prepared By (optional)
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Preparer name"
                                                                className="h-11"
                                                                {...field}
                                                                onChange={(e) => {
                                                                    field.onChange(e)
                                                                    setHasUnsavedChanges(true)
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-red-400" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Directors Card */}
                            <motion.div variants={itemVariants}>
                                <Card className="border-0 shadow-lg shadow-black/5">
                                    <CardHeader className="pb-0">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-lg bg-orange-50 dark:bg-orange-950 flex items-center justify-center">
                                                    <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">Directors / Members</CardTitle>
                                                    <CardDescription>Company directors or members</CardDescription>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={addDirector}
                                                className="gap-1"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Add Director
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {directors.map((director, index) => (
                                            <motion.div
                                                key={director.id}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="grid md:grid-cols-[1fr_1fr_1fr_auto] gap-4 p-4 rounded-lg bg-muted/50 border"
                                            >
                                                <div className="space-y-2">
                                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                                        Full Name
                                                    </Label>
                                                    <Input
                                                        placeholder="John Smith"
                                                        value={director.name}
                                                        onChange={(e) => updateDirector(director.id, "name", e.target.value)}
                                                        className="h-10"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                                        Designation
                                                    </Label>
                                                    <Select
                                                        value={director.designation}
                                                        onValueChange={(value) => updateDirector(director.id, "designation", value)}
                                                    >
                                                        <SelectTrigger className="h-10">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Director">Director</SelectItem>
                                                            <SelectItem value="Managing Director">Managing Director</SelectItem>
                                                            <SelectItem value="Non-Executive Director">Non-Executive Director</SelectItem>
                                                            <SelectItem value="Member">Member</SelectItem>
                                                            <SelectItem value="Trustee">Trustee</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                                        ID / Passport Number
                                                    </Label>
                                                    <Input
                                                        placeholder="8501015800083"
                                                        value={director.idNumber}
                                                        onChange={(e) => updateDirector(director.id, "idNumber", e.target.value)}
                                                        className="h-10"
                                                    />
                                                </div>
                                                <div className="flex items-end">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeDirector(director.id)}
                                                        disabled={directors.length === 1}
                                                        className="h-10 w-10 text-muted-foreground hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Contact Information Card */}
                            <motion.div variants={itemVariants}>
                                <Card className="border-0 shadow-lg shadow-black/5">
                                    <CardHeader className="pb-0">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950 flex items-center justify-center">
                                                <MapPin className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">Contact Information</CardTitle>
                                                {/* <CardDescription>Business address and contact details</CardDescription> */}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid gap-6">
                                        <FormField
                                            control={projectInfoForm.control}
                                            name="businessAddress"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                                                        Business Address
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="123 Business Street, Sandton, Gauteng"
                                                            className="h-11"
                                                            {...field}
                                                            onChange={(e) => {
                                                                field.onChange(e)
                                                                setHasUnsavedChanges(true)
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-red-400" />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={projectInfoForm.control}
                                            name="postalAddress"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                                                        Postal Address
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="PO Box 1234, Sandton, 2146"
                                                            className="h-11"
                                                            {...field}
                                                            onChange={(e) => {
                                                                field.onChange(e)
                                                                setHasUnsavedChanges(true)
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-red-400" />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </motion.div>
                    </form>
                </Form>
            </div>
        </div>
    )
}
