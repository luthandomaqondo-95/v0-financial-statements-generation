"use client"

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { motion } from "framer-motion"
import { Upload, Trash, Trash2, Eye, CheckCircle, File, Image as ImageIcon, X } from "lucide-react"
import CircularProgress from "@/components/ui-custom/circular-progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn, formatFileSize, getFileIcon } from "@/lib/utils"
import { toast } from "sonner"
import Image from "next/image"


const documentCategories = [
    { id: "trial-balance", label: "Trial Balance", accept: ".xlsx,.xls,.csv" },
    { id: "bank-statements", label: "Bank Statements", accept: ".pdf,.xlsx,.csv" },
    { id: "prior-year", label: "Prior Year Financials", accept: ".pdf,.docx" },
    { id: "supporting", label: "Supporting Documents", accept: ".pdf,.docx,.xlsx,.jpg,.png" }
]

interface UploadedFile {
    id: string
    file: File
    progress: number | null
    status: "uploading" | "complete" | "error"
    retry_func?: () => void
}


const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, }, }, };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 }, }

interface Step2UploadsProps {
    project_id: string
    handleNextStep: () => void
    handlePreviousStep: () => void
}
export function Step2Uploads({
    project_id,
    handleNextStep,
    handlePreviousStep,
}: Step2UploadsProps) {
    const [uploadSegment, setUploadSegment] = useState("bank-statements")
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [previewType, setPreviewType] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false);
    const [existingDocuments, setExistingDocuments] = useState<any[]>([])

    // Track previous documents to avoid unnecessary updates
    const prevDocumentsRef = useRef<any[]>([])
    const isLoadingExistingRef = useRef<boolean>(false);
    const totalFiles = useMemo(() => uploadedFiles.length, [uploadedFiles]);
    const completedFiles = useMemo(() => uploadedFiles.filter(f => f.status === "complete").length, [uploadedFiles]);

    // Store completed documents for external use (e.g., saving to database)
    const completedDocumentsRef = useRef<any[]>([])

    const simulateUpload = useCallback((file: File): Promise<void> => {
        return new Promise((resolve, reject) => {
            const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9)

            const uploadedFile: UploadedFile = {
                id: fileId,
                file: file,
                progress: 0,
                status: "uploading"
            }

            setUploadedFiles(prev => [...prev, uploadedFile])

            // Simulate upload progress
            let progress = 0
            const interval = setInterval(() => {
                progress += Math.random() * 25 + 5
                if (progress >= 100) {
                    progress = 100
                    clearInterval(interval)
                    setUploadedFiles(prev => prev.map(f =>
                        f.id === fileId
                            ? { ...f, status: "complete" as const, progress: 100 }
                            : f
                    ))
                    toast.success("File uploaded", {
                        description: `${file.name} has been uploaded successfully.`
                    })
                    resolve()
                } else {
                    setUploadedFiles(prev => prev.map(f =>
                        f.id === fileId
                            ? { ...f, progress }
                            : f
                    ))
                }
            }, 150)
        })
    }, [])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        const filesArray = Array.from(files)

        // Process all files simultaneously
        const uploadPromises = filesArray.map(file => simulateUpload(file))
        await Promise.allSettled(uploadPromises)

        // Clear the input
        e.target.value = ""
    }

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const files = Array.from(e.dataTransfer.files)
        const uploadPromises = files.map(file => simulateUpload(file))
        await Promise.allSettled(uploadPromises)
    }, [simulateUpload])

    const handleSelectFile = (file: File, index: number) => {
        setSelectedFileIndex(index)
        setPreviewType(file.type)

        if (file.type.startsWith("image/")) {
            const reader = new FileReader()
            reader.onloadend = () => setPreviewUrl(reader.result as string)
            reader.readAsDataURL(file)
        } else if (file.type === "application/pdf") {
            setPreviewUrl(URL.createObjectURL(file))
        } else if (
            file.type === "text/plain" ||
            file.type === "text/csv" ||
            file.name.endsWith(".csv") ||
            file.name.endsWith(".txt")
        ) {
            const reader = new FileReader()
            reader.onloadend = () => setPreviewUrl(reader.result as string)
            reader.readAsText(file)
        } else {
            setPreviewUrl(null)
        }
    }

    const deleteDocument = (index: number | null) => {
        if (index === null) {
            // Delete all
            setUploadedFiles([])
            setSelectedFileIndex(null)
            setPreviewUrl(null)
            setPreviewType(null)
            toast.success("All documents deleted")
        } else {
            // Delete single
            setUploadedFiles(prev => {
                const updated = prev.filter((_, i) => i !== index)
                // Clear preview if selected file was deleted
                if (selectedFileIndex === index) {
                    setSelectedFileIndex(null)
                    setPreviewUrl(null)
                    setPreviewType(null)
                }
                return updated
            })
            toast.success("Document deleted")
        }
    };
    // Load existing documents when component mounts
    useEffect(() => {
        const prevDocuments = prevDocumentsRef.current
        const hasChanged = !existingDocuments ||
            !prevDocuments ||
            existingDocuments.length !== prevDocuments.length ||
            JSON.stringify(existingDocuments) !== JSON.stringify(prevDocuments)

        if (hasChanged && existingDocuments && Array.isArray(existingDocuments) && existingDocuments.length > 0) {
            isLoadingExistingRef.current = true

            // Create loaded documents from existing documents
            // This is simplified since we don't have the actual File objects
            prevDocumentsRef.current = existingDocuments

            setTimeout(() => {
                isLoadingExistingRef.current = false
            }, 100)
        }
    }, [existingDocuments])

    // Track completed documents for external use (e.g., saving to database)
    useEffect(() => {
        if (isLoadingExistingRef.current) return

        if (uploadedFiles.length > 0) {
            const completedDocuments = uploadedFiles.filter(f => f.status === "complete")
            if (completedDocuments.length > 0) {
                completedDocumentsRef.current = completedDocuments.map(f => ({
                    id: f.id,
                    filename: f.file.name,
                    fileSize: f.file.size,
                    fileType: f.file.type
                }))
            }
        }
    }, [uploadedFiles])




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
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Upload className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Document Uploads</h1>
                            <p className="text-muted-foreground text-sm">
                                Upload your financial documents for processing
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Document Categories Tabs */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={itemVariants}>
                        <Card className="border-0 shadow-lg shadow-black/5">
                            <CardContent className="p-0">
                                <Tabs
                                    value={uploadSegment}
                                    onValueChange={(value) => setUploadSegment(value)}
                                >
                                    <TabsList className="grid grid-cols-4 mb-4 hidden ">
                                        {documentCategories.map(cat => (
                                            <TabsTrigger key={cat.id} value={cat.id}>
                                                {cat.label}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                    {documentCategories.map(cat => (
                                        <TabsContent key={cat.id} value={cat.id}>
                                            {/* {renderUploadArea(cat.id, cat.accept)} */}

                                            <div className="space-y-4">
                                                <div
                                                    className={cn(
                                                        "text-center p-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
                                                        "hover:bg-gray-50 dark:hover:bg-gray-800",
                                                        isDragging
                                                            ? "border-primary bg-primary/10"
                                                            : "border-muted-foreground/20"
                                                    )}
                                                    onDragOver={handleDragOver}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={handleDrop}
                                                >
                                                    <Input
                                                        type="file"
                                                        multiple
                                                        className="hidden"
                                                        id={`file-upload-${cat.id}`}
                                                        onChange={handleFileUpload}
                                                        accept={cat.accept}
                                                    />
                                                    <label htmlFor={`file-upload-${cat.id}`} className="cursor-pointer">
                                                        <Upload className="h-10 w-10 mx-auto text-gray-400" />
                                                        <p className="mt-2 text-sm text-gray-500">Click to upload or drag and drop</p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            Accepts: {cat.accept.split(",").join(", ")}
                                                        </p>
                                                    </label>
                                                </div>

                                                {/* Uploaded Files List */}
                                                {uploadedFiles.length > 0 && (
                                                    <div className="mt-4">
                                                        <h3 className="font-medium mb-2 flex justify-between">
                                                            Uploaded Files ({uploadedFiles.length})
                                                            <Button
                                                                variant="outline"
                                                                className="mr-2 h-8"
                                                                onClick={() => deleteDocument(null)}
                                                            >
                                                                Delete all
                                                                <Trash2 className="ml-2 h-4 w-4" />
                                                            </Button>
                                                        </h3>

                                                        {/* Preview Section */}
                                                        {selectedFileIndex !== null && previewUrl && (
                                                            <div className="mb-4 p-4 border rounded-lg bg-muted/30">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <h4 className="font-semibold">Preview</h4>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8"
                                                                        onClick={() => {
                                                                            setSelectedFileIndex(null)
                                                                            setPreviewUrl(null)
                                                                            setPreviewType(null)
                                                                        }}
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                                {previewType?.startsWith("image/") && previewUrl && (
                                                                    <div className="flex justify-center">
                                                                        <Image
                                                                            src={previewUrl}
                                                                            alt="Preview"
                                                                            width={800}
                                                                            height={600}
                                                                            className="max-w-full max-h-96 rounded shadow object-contain"
                                                                            style={{ width: 'auto', height: 'auto' }}
                                                                        />
                                                                    </div>
                                                                )}
                                                                {previewType === "application/pdf" && (
                                                                    <embed
                                                                        src={previewUrl}
                                                                        type="application/pdf"
                                                                        width="100%"
                                                                        height="500px"
                                                                        className="rounded"
                                                                    />
                                                                )}
                                                                {(previewType === "text/plain" || previewType === "text/csv" ||
                                                                    (uploadedFiles[selectedFileIndex]?.file?.name.endsWith(".csv") ||
                                                                        uploadedFiles[selectedFileIndex]?.file?.name.endsWith(".txt"))) && (
                                                                        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded max-h-96 overflow-auto text-sm">
                                                                            {previewUrl}
                                                                        </pre>
                                                                    )}
                                                                {!previewType && (
                                                                    <div className="text-gray-500 text-center py-8">
                                                                        Preview not available for this file type.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* File List */}
                                                        <ul className="space-y-2">
                                                            {uploadedFiles.map((each_file, index) => (
                                                                <motion.li
                                                                    key={each_file.id}
                                                                    initial={{ opacity: 0, x: -20 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    exit={{ opacity: 0, x: 20 }}
                                                                    className={cn(
                                                                        "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors",
                                                                        selectedFileIndex === index
                                                                            ? "bg-primary/20 ring-2 ring-primary/50"
                                                                            : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                                    )}
                                                                >
                                                                    <span className="flex flex-row items-center w-full gap-3">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="icon"
                                                                            className="w-8 h-8 shrink-0"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                deleteDocument(index)
                                                                            }}
                                                                        >
                                                                            <Trash className="w-4 h-4" />
                                                                        </Button>
                                                                        <div className="shrink-0">
                                                                            {getFileIcon(each_file.file.type, each_file.file.name)}
                                                                        </div>
                                                                        <div
                                                                            className="flex-1 min-w-0 cursor-pointer"
                                                                            onClick={() => handleSelectFile(each_file.file, index)}
                                                                        >
                                                                            <p className="text-sm font-medium truncate text-primary hover:underline">
                                                                                {each_file.file.name}
                                                                            </p>
                                                                            {/* {each_file.status === "uploading" && each_file.progress !== null && (
                                                                                <Progress value={each_file.progress} className="h-1 mt-1" />
                                                                            )} */}
                                                                        </div>
                                                                    </span>
                                                                    <div className="flex items-center gap-2 ml-2">
                                                                        <span className="text-xs text-gray-500 whitespace-nowrap">
                                                                            {formatFileSize(each_file.file.size)}
                                                                        </span>
                                                                        {each_file.progress !== null ? (
                                                                            each_file.progress < 100 ? (
                                                                                <div className="flex items-center">
                                                                                    <CircularProgress percentage={each_file.progress} className="w-8 h-8 mr-1" />
                                                                                    <span className="text-xs text-blue-500">Uploading...</span>
                                                                                </div>
                                                                            ) : each_file.status === "complete" ? (
                                                                                <div className="flex items-center gap-1">
                                                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                                                    <span className="text-xs text-green-500">Complete</span>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex items-center gap-1">
                                                                                    <CheckCircle className="w-5 h-5 text-blue-500" />
                                                                                    <span className="text-xs text-blue-500">Uploaded</span>
                                                                                </div>
                                                                            )
                                                                        ) : (
                                                                            <Button
                                                                                variant="destructive"
                                                                                size="sm"
                                                                                className="h-6 text-xs"
                                                                                onClick={() => each_file.retry_func && each_file.retry_func()}
                                                                            >
                                                                                Retry
                                                                            </Button>
                                                                        )}
                                                                        {each_file.status === "complete" && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    handleSelectFile(each_file.file, index)
                                                                                }}
                                                                            >
                                                                                <Eye className="h-4 w-4" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </motion.li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>
                                    ))}
                                </Tabs>
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