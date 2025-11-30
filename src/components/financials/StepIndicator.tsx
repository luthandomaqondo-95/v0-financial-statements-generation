'use client';

import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useState } from 'react';

interface StepIndicatorProps {
    variant?: 'progress' | 'dropdown';
    className?: string;
    currentStep: number;
    totalSteps: number;
    steps: string[];
    onStepClick?: (step: number) => void;
    onPrevClick?: () => void;
    onNextClick?: () => void;
}
const StepIndicator: React.FC<StepIndicatorProps> = ({ variant = 'progress', className, currentStep, totalSteps, steps, onStepClick, onPrevClick, onNextClick }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className={cn(`w-full rounded-md flex justify-between ${variant === 'dropdown' ? '' : 'gap-2'} mb-2`, className)}>
            <Button variant="outline" disabled={currentStep === 0} className={`h-9 cursor-pointer rounded-${variant === 'dropdown' ? 'md' : 'full -mt-1'}`} onClick={onPrevClick}>Prev</Button>
            <div className="relative w-[90%]">
                {
                    variant === 'dropdown' ? (
                        <div className="relative w-full flex justify-center border border rounded-md">
                            <DropdownMenu
                                open={open}
                                onOpenChange={setOpen}
                            >
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-9 rounded-full cursor-pointer">
                                        {currentStep + 1} / {totalSteps} <span className="w-28 text-xs text-muted-foreground">{steps[currentStep]}</span> <ChevronDown className="w-5 h-5 cursor-pointer" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    {steps.map((stepName, index) => (
                                        <DropdownMenuItem key={index} onClick={() => onStepClick?.(index)} className="cursor-pointer">
                                            <div className={` cursor-pointer
                                            w-6 h-6 rounded-full flex items-center justify-center z-10 border-2
                                            ${index < currentStep ? 'bg-orange-500 border-orange-500 text-white' :
                                                    index === currentStep ? 'bg-white dark:bg-gray-800 border-orange-500 text-orange-500' :
                                                        'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}
                                            `}
                                                onClick={() => onStepClick?.(index)}
                                            >
                                                {index < currentStep ? (
                                                    <Check className="h-4 w-4 text-white" />
                                                ) : (
                                                    <span className="text-xs">{index + 1}</span>
                                                )}
                                            </div>
                                            {stepName}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        <>
                            <Progress value={(currentStep / (totalSteps - 1)) * 100} className="h-8 rounded-full w-full" />

                            {/* Step dots */}
                            <div className="flex justify-between absolute top-6 w-full transform -translate-y-1/2 p-2">
                                {steps.map((stepName, index) => (
                                    <div key={index} className="flex flex-col items-center">
                                        <div className={` cursor-pointer
                                            w-6 h-6 rounded-full flex items-center justify-center z-10 border-2
                                            ${index < currentStep ? 'bg-orange-500 border-orange-500 text-white' :
                                                index === currentStep ? 'bg-white dark:bg-gray-800 border-orange-500 text-orange-500' :
                                                    'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'}
                                            `}
                                            onClick={() => onStepClick?.(index)}
                                        >
                                            {index < currentStep ? (
                                                <Check className="h-4 w-4" />
                                            ) : (
                                                <span className="text-xs">{index + 1}</span>
                                            )}
                                        </div>
                                        <span className={`text-[10px] sm:text-[10x] mt-1 text-center max-w-[60px] sm:max-w-[80px] md:max-w-none truncate sm:whitespace-normal ${index === currentStep ? 'font-medium text-primary' : ''}`}>
                                            {stepName}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )
                }
            </div>
            <Button variant="default" disabled={currentStep === totalSteps - 1} className={`h-9 cursor-pointer rounded-${variant === 'dropdown' ? 'md' : 'full -mt-1'}`} onClick={onNextClick}>Next</Button>
        </div>
    );
};

export default StepIndicator;