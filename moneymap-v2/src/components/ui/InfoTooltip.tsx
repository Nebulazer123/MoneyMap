import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
    text: string;
    className?: string;
}

export function InfoTooltip({ text, className }: InfoTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.top - 8, // 8px gap above
                left: rect.left + rect.width / 2,
            });
        }
    };

    useEffect(() => {
        if (isVisible) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isVisible]);

    return (
        <div
            ref={triggerRef}
            className={cn("inline-flex items-center", className)}
            onMouseEnter={() => {
                updatePosition();
                setIsVisible(true);
            }}
            onMouseLeave={() => setIsVisible(false)}
        >
            <Info className="h-3 w-3 text-zinc-500 cursor-help hover:text-zinc-300 transition-colors" />
            {isVisible && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed z-[9999] w-48 p-2 rounded-lg bg-zinc-900/95 border border-zinc-800 text-[10px] text-zinc-300 shadow-xl backdrop-blur-sm pointer-events-none animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        top: position.top,
                        left: position.left,
                        transform: 'translate(-50%, -100%)',
                    }}
                >
                    {text}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 border-b border-r border-zinc-800 rotate-45"></div>
                </div>,
                document.body
            )}
        </div>
    );
}
