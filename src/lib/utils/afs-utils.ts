import { PageData } from "@/types/afs-types";


// Constants for page break estimation
export const LINE_HEIGHT_PX = 24 // Average line height in pixels
export const CHAR_PER_LINE_PORTRAIT = 80
export const CHAR_PER_LINE_LANDSCAPE = 110
export const DEFAULT_MARGIN = 20 // Default margin in mm


// Generate unique ID
export const generateId = () => `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper function to find a good break point in content
export function findBreakPoint(content: string, maxLines: number, charPerLine: number, thresholdRatio: number = 0.75): { keepContent: string; overflowContent: string } | null {
    const lines = content.split('\n')
    let currentLines = 0
    let breakIndex = -1
    let inTable = false
    let inCodeBlock = false
    let tableStartIndex = -1
    let codeBlockStartIndex = -1
    let tableRowCount = 0

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmedLine = line.trim()

        // Track code blocks
        if (trimmedLine.startsWith('```')) {
            if (!inCodeBlock) {
                inCodeBlock = true
                codeBlockStartIndex = i
            } else {
                inCodeBlock = false
                codeBlockStartIndex = -1
            }
        }

        // Track tables (lines starting with |)
        if (trimmedLine.startsWith('|')) {
            if (!inTable) {
                inTable = true
                tableStartIndex = i
                tableRowCount = 0
            }
            tableRowCount++
        } else if (inTable && trimmedLine !== '' && !trimmedLine.startsWith('|')) {
            inTable = false
            tableStartIndex = -1
            tableRowCount = 0
        }

        // Calculate line contribution
        let lineContribution = 1
        if (trimmedLine === '') {
            lineContribution = 0.5
        } else if (trimmedLine.startsWith('#')) {
            lineContribution = 2
        } else if (trimmedLine.startsWith('|')) {
            lineContribution = 1.2
        } else {
            const wrappedLines = Math.ceil(line.length / charPerLine)
            lineContribution = Math.max(1, wrappedLines)
        }

        currentLines += lineContribution

        // Check if we've exceeded max lines
        if (currentLines > maxLines * thresholdRatio) { // Use thresholdRatio to leave buffer
            // Find the best break point
            if (inTable && tableStartIndex >= 0) {
                // If table is too large (more than 15 rows or started near beginning), break within the table
                if (tableRowCount > 15 || tableStartIndex < 3) {
                    // Break at the current table row (but not on header or separator)
                    // Find the last table row before current position that's not a separator
                    for (let j = i; j > tableStartIndex + 2; j--) {
                        const checkLine = lines[j].trim()
                        if (checkLine.startsWith('|') && !checkLine.includes('---') && !checkLine.includes('|-')) {
                            breakIndex = j
                            break
                        }
                    }
                    // If we couldn't find a good row, break before the table
                    if (breakIndex === -1 && tableStartIndex > 0) {
                        breakIndex = tableStartIndex
                    }
                } else if (tableStartIndex > 0) {
                    // Break before the table if it's small and we have content before it
                    breakIndex = tableStartIndex
                }
            } else if (inCodeBlock && codeBlockStartIndex > 0) {
                // Break before the code block
                breakIndex = codeBlockStartIndex
            }
            
            // If we still don't have a break point, find nearest paragraph break
            if (breakIndex === -1) {
                for (let j = i; j >= Math.max(0, i - 10); j--) {
                    const checkLine = lines[j].trim()
                    if (checkLine === '' || checkLine.startsWith('#')) {
                        breakIndex = j + 1
                        break
                    }
                }
            }
            
            // If still no break point, just break at current line
            if (breakIndex === -1) {
                breakIndex = i
            }
            break
        }
    }

    if (breakIndex > 0 && breakIndex < lines.length) {
        const keepContent = lines.slice(0, breakIndex).join('\n').trimEnd()
        let overflowContent = lines.slice(breakIndex).join('\n').trimStart()
        
        // If we broke inside a table, prepend the table header to overflow content
        if (tableStartIndex >= 0 && breakIndex > tableStartIndex + 2) {
             // Check if we have a valid header structure (row + separator)
             if (lines.length > tableStartIndex + 1 && 
                 (lines[tableStartIndex+1].includes('---') || lines[tableStartIndex+1].includes('|-'))) {
                 
                 // Capture header
                 const header = lines.slice(tableStartIndex, tableStartIndex + 2).join('\n')
                 overflowContent = header + '\n' + overflowContent
             }
        }
        
        if (overflowContent.trim().length > 0) {
            return { keepContent, overflowContent }
        }
    }

    return null
}

// Helper to estimate if content will overflow a page
export function estimateOverflow(content: string, orientation: "portrait" | "landscape" = "portrait"): boolean {
    const PAGE_HEIGHT_MM = orientation === "portrait" ? 297 : 210
    const pageHeightPx = (PAGE_HEIGHT_MM * 96) / 25.4
    const marginPx = (DEFAULT_MARGIN * 96) / 25.4
    const availableHeightPx = pageHeightPx - (marginPx * 2) - 40
    const maxLines = Math.floor(availableHeightPx / LINE_HEIGHT_PX)
    const charPerLine = orientation === "portrait" ? CHAR_PER_LINE_PORTRAIT : CHAR_PER_LINE_LANDSCAPE

    let totalLines = 0
    content.split('\n').forEach(line => {
        const trimmedLine = line.trim()
        if (trimmedLine === '') {
            totalLines += 0.5
        } else if (trimmedLine.startsWith('#')) {
            totalLines += 2
        } else if (trimmedLine.startsWith('|')) {
            totalLines += 1.2
        } else {
            totalLines += Math.max(1, Math.ceil(line.length / charPerLine))
        }
    })

    // Use 0.75 threshold to be more aggressive about catching overflows
    // This accounts for rendering differences between estimation and actual DOM
    return totalLines > maxLines * 0.75
}

// Helper to get max lines for a page
export function getMaxLines(orientation: "portrait" | "landscape" = "portrait"): number {
    const PAGE_HEIGHT_MM = orientation === "portrait" ? 297 : 210
    const pageHeightPx = (PAGE_HEIGHT_MM * 96) / 25.4
    const marginPx = (DEFAULT_MARGIN * 96) / 25.4
    const availableHeightPx = pageHeightPx - (marginPx * 2) - 40
    return Math.floor(availableHeightPx / LINE_HEIGHT_PX)
}

// Helper to get char per line for orientation
export function getCharPerLine(orientation: "portrait" | "landscape" = "portrait"): number {
    return orientation === "portrait" ? CHAR_PER_LINE_PORTRAIT : CHAR_PER_LINE_LANDSCAPE
}

// Helper to process overflows
export const processPageOverflows = (pages: PageData[]): { pages: PageData[], splitCount: number } => {
	let newPages = [...pages]
	let splitCount = 0
	let iterations = 0
	const maxIterations = 100 // Prevent infinite loops

	while (iterations < maxIterations) {
		let foundOverflow = false

		for (let i = 0; i < newPages.length; i++) {
			const page = newPages[i]
			const orientation = page.settings.orientation

			if (estimateOverflow(page.content, orientation)) {
				const maxLines = getMaxLines(orientation)
				const charPerLine = getCharPerLine(orientation)
				const breakResult = findBreakPoint(page.content, maxLines, charPerLine)

				if (breakResult) {
					// Update current page
					newPages[i] = { ...page, content: breakResult.keepContent }

					// Insert new page with overflow content
					const newPage: PageData = {
						id: generateId(),
						content: breakResult.overflowContent,
						settings: { ...page.settings },
					}
					newPages.splice(i + 1, 0, newPage)

					splitCount++
					foundOverflow = true
					break // Restart from the beginning since indices changed
				}
			}
		}

		if (!foundOverflow) {
			break // No more overflows found
		}
		iterations++
	}

	return { pages: newPages, splitCount }
}