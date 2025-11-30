'use client';

import { useEffect, useRef, useState, useMemo } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface BarrelPickerProps {
    items: string[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    itemHeight?: number;
    visibleItems?: number;
}

export const BarrelPicker = ({ items, selectedIndex, onSelect, itemHeight = 44, visibleItems = 5 }: BarrelPickerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [offset, setOffset] = useState(() => -selectedIndex * itemHeight);
    const isDraggingRef = useRef(false);
    const startYRef = useRef(0);
    const startOffsetRef = useRef(0);
    const velocityRef = useRef(0);
    const lastYRef = useRef(0);
    const lastTimeRef = useRef(0);
    const animationRef = useRef<number | null>(null);

    const radius = useMemo(() => (itemHeight * visibleItems) / Math.PI, [itemHeight, visibleItems]);
    const anglePerItem = useMemo(() => 360 / (items.length * 2), [items.length]);
    const containerHeight = itemHeight * visibleItems;

    // Sync offset when selectedIndex changes from parent (only if not dragging)
    useEffect(() => {
        if (!isDraggingRef.current) {
            setOffset(-selectedIndex * itemHeight);
        }
    }, [selectedIndex, itemHeight]);

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current !== null) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    const snapToNearestItem = (currentOffset: number, currentVelocity: number = 0) => {
        // Cancel any existing animation
        if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        let velocity = currentVelocity;
        let animOffset = currentOffset;

        const animate = () => {
            // Apply momentum
            if (Math.abs(velocity) > 0.5) {
                animOffset += velocity;
                velocity *= 0.92;
                setOffset(animOffset);
                animationRef.current = requestAnimationFrame(animate);
            } else {
                // Snap to nearest item
                const nearestIndex = Math.round(-animOffset / itemHeight);
                const clampedIndex = Math.max(0, Math.min(items.length - 1, nearestIndex));
                const finalOffset = -clampedIndex * itemHeight;
                
                setOffset(finalOffset);
                
                // Only call onSelect if the index actually changed
                if (clampedIndex !== selectedIndex) {
                    onSelect(clampedIndex);
                }
                animationRef.current = null;
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    };

    const handlePointerDown = (clientY: number) => {
        // Cancel any ongoing animation
        if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        isDraggingRef.current = true;
        startYRef.current = clientY;
        startOffsetRef.current = offset;
        lastYRef.current = clientY;
        lastTimeRef.current = performance.now();
        velocityRef.current = 0;
    };

    const handlePointerMove = (clientY: number) => {
        if (!isDraggingRef.current) return;

        const deltaY = clientY - startYRef.current;
        const newOffset = startOffsetRef.current + deltaY;

        // Calculate velocity
        const now = performance.now();
        const dt = now - lastTimeRef.current;
        if (dt > 0) {
            velocityRef.current = (clientY - lastYRef.current) / dt * 16;
        }
        lastYRef.current = clientY;
        lastTimeRef.current = now;

        setOffset(newOffset);
    };

    const handlePointerUp = () => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        snapToNearestItem(offset, velocityRef.current);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        handlePointerDown(e.clientY);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        handlePointerMove(e.clientY);
    };

    const handleMouseUp = () => {
        handlePointerUp();
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        handlePointerDown(e.touches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        handlePointerMove(e.touches[0].clientY);
    };

    const handleTouchEnd = () => {
        handlePointerUp();
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const newOffset = offset - e.deltaY * 0.5;
        setOffset(newOffset);
        snapToNearestItem(newOffset, 0);
    };

    const handleItemClick = (index: number) => {
        if (index !== selectedIndex) {
            onSelect(index);
        }
        setOffset(-index * itemHeight);
    };

    const handlePrev = () => {
        if (selectedIndex > 0) {
            const newIndex = selectedIndex - 1;
            onSelect(newIndex);
            setOffset(-newIndex * itemHeight);
        }
    };

    const handleNext = () => {
        if (selectedIndex < items.length - 1) {
            const newIndex = selectedIndex + 1;
            onSelect(newIndex);
            setOffset(-newIndex * itemHeight);
        }
    };

    const getItemStyle = (index: number) => {
        const itemOffset = offset + index * itemHeight;
        const angle = (itemOffset / itemHeight) * anglePerItem;
        const normalizedAngle = Math.abs(angle);
        
        // Calculate 3D transform
        const translateZ = radius * Math.cos((angle * Math.PI) / 180) - radius;
        const translateY = radius * Math.sin((angle * Math.PI) / 180);
        const rotateX = -angle;
        
        // Opacity and scale based on distance from center
        const opacity = Math.max(0, 1 - normalizedAngle / 60);
        const scale = Math.max(0.7, 1 - normalizedAngle / 120);
        
        return {
            transform: `translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) scale(${scale})`,
            opacity,
            zIndex: Math.round(100 - normalizedAngle),
        };
    };

    return (
        <div className="relative flex flex-col items-center">
            {/* Up chevron */}
            <button 
                type="button"
                onClick={handlePrev}
                className="p-1 text-orange-500 hover:text-orange-600 transition-colors disabled:opacity-30"
                disabled={selectedIndex === 0}
            >
                <ChevronUp className="w-5 h-5" />
            </button>
            
            <div 
                ref={containerRef}
                className="relative overflow-hidden select-none cursor-grab active:cursor-grabbing"
                style={{ 
                    height: containerHeight,
                    width: 280,
                    perspective: '1000px',
                    perspectiveOrigin: 'center center'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
            >
                {/* Gradient overlays for depth effect */}
                <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-background via-background/80 to-transparent z-20 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background via-background/80 to-transparent z-20 pointer-events-none" />
                
                {/* Selection highlight */}
                <div 
                    className="absolute left-1/2 w-full border-y-2 border-orange-500/50 bg-orange-500/10 backdrop-blur-sm z-10 pointer-events-none rounded-lg"
                    style={{ 
                        height: itemHeight,
                        top: '50%',
                        transform: 'translate(-50%, -50%)'
                    }}
                />

                {/* 3D Barrel container */}
                <div 
                    className="absolute w-full"
                    style={{
                        transformStyle: 'preserve-3d',
                        top: '50%',
                        left: 0,
                        transform: 'translateY(-50%)'
                    }}
                >
                    {items.map((item, index) => {
                        const style = getItemStyle(index);
                        const isSelected = index === selectedIndex;
                        
                        return (
                            <div
                                key={index}
                                className={cn(
                                    "absolute w-full flex items-center justify-center",
                                    "text-sm font-medium whitespace-nowrap px-4",
                                    isSelected 
                                        ? "text-orange-600 dark:text-orange-400" 
                                        : "text-muted-foreground"
                                )}
                                style={{
                                    height: itemHeight,
                                    top: '50%',
                                    left: 0,
                                    marginTop: -itemHeight / 2,
                                    transformStyle: 'preserve-3d',
                                    backfaceVisibility: 'hidden',
                                    ...style,
                                }}
                                onClick={() => handleItemClick(index)}
                            >
                                <span className="flex items-center gap-2">
                                    {isSelected && (
                                        <span className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                                            <Check className="w-4 h-4 text-white" />
                                        </span>
                                    )}
                                    <span className="truncate max-w-[200px]">{item}</span>
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {/* Down chevron */}
            <button 
                type="button"
                onClick={handleNext}
                className="p-1 text-orange-500 hover:text-orange-600 transition-colors disabled:opacity-30"
                disabled={selectedIndex === items.length - 1}
            >
                <ChevronDown className="w-5 h-5" />
            </button>
            
            {/* Step counter */}
            <div className="text-xs text-muted-foreground mt-1">
                Step {selectedIndex + 1} of {items.length}
            </div>
        </div>
    );
};
