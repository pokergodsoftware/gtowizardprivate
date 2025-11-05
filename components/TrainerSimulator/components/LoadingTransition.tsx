import React from 'react';

/**
 * LoadingTransition Component
 * 
 * Shows a loading overlay when transitioning between training spots.
 * Appears during auto-advance or manual next hand navigation.
 */

interface LoadingTransitionProps {
    show: boolean;
}

export const LoadingTransition: React.FC<LoadingTransitionProps> = ({ show }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1a1d24] rounded-2xl p-8 shadow-2xl border border-gray-700/50">
                <div className="flex flex-col items-center gap-4">
                    {/* Spinning poker chip icon */}
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xl font-bold">♠</span>
                        </div>
                    </div>
                    
                    {/* Loading text */}
                    <div className="text-center">
                        <p className="text-white font-bold text-lg mb-1">Loading next hand...</p>
                        <p className="text-gray-400 text-sm">Preparing your training spot</p>
                    </div>
                    
                    {/* Animated dots */}
                    <div className="flex gap-2">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
