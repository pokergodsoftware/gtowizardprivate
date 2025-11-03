import { useState, useRef, useEffect, useCallback, RefObject, MouseEvent } from 'react';

interface Position {
    x: number;
    y: number;
}

interface UseDraggableOptions {
    storageKey?: string;
    initialPosition?: Position;
}

interface UseDraggableReturn {
    position: Position;
    isDragging: boolean;
    dragRef: RefObject<HTMLDivElement>;
    handleMouseDown: (e: MouseEvent) => void;
    handleResetPosition: (e: MouseEvent) => void;
}

/**
 * Validates if a value is a valid position object
 */
const isValidPosition = (pos: any): pos is Position => {
    return typeof pos?.x === 'number' && typeof pos?.y === 'number';
};

/**
 * Custom hook for making elements draggable with position persistence
 * @param options - Configuration options
 * @returns Draggable state and handlers
 */
export const useDraggable = ({
    storageKey,
    initialPosition = { x: 0, y: 0 }
}: UseDraggableOptions = {}): UseDraggableReturn => {
    const [position, setPosition] = useState<Position>(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
    const dragRef = useRef<HTMLDivElement>(null);

    // Load saved position from localStorage
    useEffect(() => {
        if (storageKey) {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                try {
                    const pos = JSON.parse(saved);
                    if (isValidPosition(pos)) {
                        setPosition(pos);
                    }
                } catch (e) {
                    console.error('Invalid position data');
                }
            }
        }
    }, [storageKey]);

    // Handle reset position
    const handleResetPosition = (e: MouseEvent) => {
        e.stopPropagation();
        setPosition(initialPosition);
        if (storageKey) {
            localStorage.removeItem(storageKey);
        }
    };

    // Handle mouse down - start dragging
    const handleMouseDown = (e: MouseEvent) => {
        // Prevent drag if clicking on scrollable content or buttons
        const target = e.target as HTMLElement;
        if (target.closest('.payout-content') || target.closest('button')) {
            return;
        }
        
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    // Handle mouse move - update position while dragging
    const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
        if (!dragRef.current) return;
        
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // Get panel and window dimensions
        const panelRect = dragRef.current.getBoundingClientRect();
        const panelWidth = panelRect.width;
        const panelHeight = panelRect.height;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Limit position to stay within screen (with 20px margin)
        const margin = 20;
        const limitedX = Math.max(margin, Math.min(newX, windowWidth - panelWidth - margin));
        const limitedY = Math.max(margin, Math.min(newY, windowHeight - panelHeight - margin));
        
        setPosition({ x: limitedX, y: limitedY });
    }, [dragStart]);

    // Handle mouse up - end dragging and save position
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        // Save position to localStorage
        if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify(position));
        }
    }, [position, storageKey]);

    // Add/remove event listeners for dragging
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return {
        position,
        isDragging,
        dragRef,
        handleMouseDown,
        handleResetPosition
    };
};
