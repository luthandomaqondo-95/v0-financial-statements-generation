interface CircularProgressProps {
    percentage: number
    strokeWidth?: number
    className?: string
}

export default function CircularProgress({
    percentage,
    strokeWidth = 8,
    className = "w-8 h-8",
}: CircularProgressProps) {
    // Ensure percentage is between 0 and 100
    const normalizedPercentage = Math.max(0, Math.min(100, percentage))

    // Use viewBox for responsive SVG
    const viewBoxSize = 100
    const radius = (viewBoxSize - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDashoffset = circumference - (normalizedPercentage / 100) * circumference

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={viewBoxSize / 2}
                    cy={viewBoxSize / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-gray-200"
                />

                {/* Progress circle */}
                <circle
                    cx={viewBoxSize / 2}
                    cy={viewBoxSize / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="text-blue-500 transition-all duration-300 ease-in-out"
                />
            </svg>

            {/* Percentage text in the center */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-bold text-[10px]">{Math.round(normalizedPercentage)}%</span>
            </div>
        </div>
    )
}
