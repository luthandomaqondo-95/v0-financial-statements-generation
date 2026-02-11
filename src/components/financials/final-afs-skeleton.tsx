import { Skeleton } from "@/components/ui/skeleton";

// Skeleton for the Final AFS view:
// - Top toolbar
// - Left section + order controls
// - Right-hand cover + table-of-contents pages
export function FinalAFSSkeleton() {
    return (
        <div className="h-full flex flex-col bg-background">
            {/* Toolbar skeleton */}
            <div className="h-12 border-b bg-background/60 flex items-center px-4 gap-3 shrink-0">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-md" />
                <Skeleton className="h-8 w-28 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-md" />

                <div className="flex-1 flex justify-center gap-3">
                    <Skeleton className="h-8 w-40 rounded-full" />
                    <Skeleton className="h-8 w-32 rounded-full" />
                </div>

                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-24 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden bg-muted/10">
                {/* Sections + order controls */}
                <div className="w-72 border-r bg-background/80 px-4 py-4 space-y-4 shrink-0">
                    <div className="flex items-center justify-between mb-2">
                        <Skeleton className="h-4 w-28 rounded" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>

                    <div className="space-y-3">
                        {[...Array(6)].map((_, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2"
                            >
                                {/* Drag / index circle */}
                                <Skeleton className="h-7 w-7 rounded-full" />

                                {/* Section title + meta */}
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-4 w-32 rounded" />
                                    <Skeleton className="h-3 w-20 rounded" />
                                </div>

                                {/* Order controls (up/down) */}
                                <div className="flex flex-col gap-1">
                                    <Skeleton className="h-3 w-6 rounded-full" />
                                    <Skeleton className="h-3 w-6 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right-hand preview pages */}
                <div className="flex-1 overflow-auto">
                    <div className="flex flex-col items-center py-8 gap-10">
                        {/* Cover page */}
                        <div className="relative group">
                            <div
                                className="bg-background shadow-lg border rounded-sm overflow-hidden"
                                style={{ width: "210mm", minHeight: "297mm", padding: "20mm 25mm" }}
                            >
                                {/* Top right logo / badge */}
                                <div className="flex justify-between items-start mb-16">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24 rounded" />
                                        <Skeleton className="h-4 w-32 rounded" />
                                    </div>
                                    <Skeleton className="h-14 w-14 rounded-full" />
                                </div>

                                {/* Entity name */}
                                <div className="space-y-4 mb-10">
                                    <Skeleton className="h-5 w-40 rounded" />
                                    <Skeleton className="h-10 w-3/4 rounded" />
                                    <Skeleton className="h-6 w-1/2 rounded" />
                                </div>

                                {/* Statement title */}
                                <div className="space-y-3 mb-12">
                                    <Skeleton className="h-4 w-1/3 rounded" />
                                    <Skeleton className="h-8 w-3/5 rounded" />
                                    <Skeleton className="h-4 w-1/4 rounded" />
                                </div>

                                {/* Prepared by / firm info */}
                                <div className="mt-auto space-y-4">
                                    <Skeleton className="h-4 w-1/3 rounded" />
                                    <Skeleton className="h-4 w-1/2 rounded" />
                                    <Skeleton className="h-4 w-2/5 rounded" />
                                </div>
                            </div>

                            {/* Page number */}
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                        </div>

                        {/* Table of contents page */}
                        <div className="relative group">
                            <div
                                className="bg-background shadow-lg border rounded-sm overflow-hidden"
                                style={{ width: "210mm", minHeight: "297mm", padding: "15mm 20mm" }}
                            >
                                {/* Heading */}
                                <div className="mb-10">
                                    <Skeleton className="h-7 w-1/3 rounded mb-3" />
                                    <Skeleton className="h-4 w-1/4 rounded" />
                                </div>

                                {/* Contents list */}
                                <div className="space-y-4 mb-10">
                                    {[...Array(8)].map((_, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between gap-6"
                                        >
                                            <div className="flex-1 flex items-center gap-2">
                                                <Skeleton className="h-4 w-6 rounded" />
                                                <Skeleton className="h-4 w-2/3 rounded" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Skeleton className="h-px w-24 rounded-full" />
                                                <Skeleton className="h-4 w-8 rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Notes / additional sections */}
                                <div className="space-y-4">
                                    <Skeleton className="h-5 w-1/3 rounded" />
                                    {[...Array(4)].map((_, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between gap-6"
                                        >
                                            <div className="flex-1 flex items-center gap-2">
                                                <Skeleton className="h-4 w-2/3 rounded" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Skeleton className="h-px w-24 rounded-full" />
                                                <Skeleton className="h-4 w-8 rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Page number */}
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}