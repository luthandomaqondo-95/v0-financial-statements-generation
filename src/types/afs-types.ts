export interface PageSettings {
    orientation: "portrait" | "landscape"
    margins: {
        top: number
        right: number
        bottom: number
        left: number
    }
}

export interface PageData {
	id: string
	content: string
	settings: PageSettings
	isTableOfContents?: boolean
}

export interface DocumentSettings {
    orientation: "portrait" | "landscape"
    margins: {
        top: number
        right: number
        bottom: number
        left: number
    }
}