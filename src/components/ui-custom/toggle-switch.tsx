"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"

interface ToggleSwitchProps {
    checked: boolean
    options: { value: string, label?: string, icon?: React.ReactNode }[]
    className?: string
    disabled?: boolean
    onCheckedChange?: (checked: boolean) => void
    variant?: "default" | "purple"
}

/**
 * ToggleSwitch Component
 */
// --- Component: ToggleSwitch ---
export const ToggleSwitch = ({
    checked,
    onCheckedChange,
    options = [{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }],
    className,
    disabled = false,
    variant = "default",
}: ToggleSwitchProps) => {
    const trackColors = variant === "purple"
        ? (checked ? "justify-end bg-primary" : "justify-start bg-gray-200 dark:bg-gray-700")
        : (checked ? "justify-end bg-primary" : "justify-start bg-primary/10");

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation(); // Stop event from bubbling up
        if (!disabled && onCheckedChange) {
            onCheckedChange(!checked);
        }
    };

    return (
        <motion.button
            type="button"
            role="switch"
            aria-checked={checked}
            className={cn(
                "relative cursor-pointer flex items-center p-1 rounded-full transition-colors duration-300 ease-in-out",
                // Default size
                "h-8 w-12 sm:h-10 sm:w-32",
                // Track Colors
                trackColors,
                disabled && "opacity-50 cursor-not-allowed",
                className,
                variant === "purple" && "border-purple-500/60 dark:border-purple-400/50"
            )}
            onClick={handleClick}
            whileTap={{ scale: disabled ? 1 : 0.97 }}
            disabled={disabled}
        >
            <div className="absolute inset-0 z-20 flex items-center text-[10px] font-bold uppercase tracking-wider pointer-events-none">

                {/* LEFT LABEL (Index 0) */}
                <span
                    className={cn(
                        "flex-1 flex items-center gap-2 justify-center transition-colors duration-300",
                        // When !checked: LEFT label is ON the thumb (active) - needs contrast with thumb
                        // When checked: LEFT label is on track (inactive) - uses category tab colors
                        !checked
                            ? (variant === "purple" 
                                ? "text-white dark:text-white" // White on purple thumb
                                : "text-gray-900 dark:text-gray-900") // Dark on white thumb
                            : (variant === "purple"
                                ? "text-gray-700 dark:text-gray-300" // Visible on gray track
                                : "text-gray-600 dark:text-gray-400") // Category tab inactive color
                    )}
                >
                    {options[0].icon}
                    <span className="hidden sm:inline">{options[0]?.label ?? ""}</span>
                </span>

                {/* RIGHT LABEL (Index 1) */}
                <span
                    className={cn(
                        "flex-1 flex items-center gap-2 justify-center transition-colors duration-300",
                        // When checked: RIGHT label is ON the thumb (active) - needs contrast with thumb
                        // When !checked: RIGHT label is on track (inactive) - uses category tab colors
                        checked
                            ? (variant === "purple" 
                                ? "text-white dark:text-white" // White on purple thumb
                                : "text-gray-900 dark:text-gray-900") // Dark on white thumb
                            : (variant === "purple"
                                ? "text-gray-700 dark:text-gray-300" // Visible on gray track
                                : "text-gray-600 dark:text-gray-400") // Category tab inactive color
                    )}
                >
                    {options[1].icon}
                    <span className="hidden sm:inline">{options[1]?.label ?? ""}</span>
                </span>
            </div>

            {/* THUMB LAYER (z-10):  Slides underneath the text. */}
            <motion.div
                className={cn(
                    "h-full w-1/2 rounded-full shadow-md z-10",
                    variant === "purple" ? "bg-purple-500 dark:bg-purple-600" : "bg-white"
                )}
                layout
                transition={{
                    type: "spring",
                    stiffness: 700,
                    damping: 30,
                }}
            />
        </motion.button>
    );
};