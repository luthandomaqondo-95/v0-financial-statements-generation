export interface Director {
    id: string;
    name: string;
    designation: string;
    idNumber: string;
}

export interface ReportingFramework {
    id: string;
    name: string;
    description: string;
    recommended?: boolean;
}
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