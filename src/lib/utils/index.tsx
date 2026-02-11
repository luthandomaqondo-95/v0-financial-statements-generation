import { clsx, type ClassValue } from 'clsx'
import { FileSpreadsheet, FileText, Image as ImageIcon, File as FileIcon } from 'lucide-react'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}
export const sleep = (n: number) => new Promise(r => setTimeout(r, n));

export const formatFileSize = (bytes: number) => {
	if (bytes === 0) return "0 Bytes"
	const k = 1024
	const sizes = ["Bytes", "KB", "MB", "GB"]
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
export const getFileIcon = (type: string, name: string) => {
	if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv") || name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls")) {
		return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
	}
	if (type.includes("pdf") || name.endsWith(".pdf")) {
		return <FileText className="h-5 w-5 text-red-500" />
	}
	if (type.includes("image") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png")) {
		return <ImageIcon className="h-5 w-5 text-blue-500" />
	}
	return <FileIcon className="h-5 w-5 text-gray-500" />
}