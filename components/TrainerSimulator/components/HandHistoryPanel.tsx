/**
 * HandHistoryPanel Component
 * 
 * Displays hand history in comic-book style bubbles.
 * Shows avatar, position, and action for each player.
 * Similar to GGPoker's hand history display.
 */

import React from 'react';
import type { HandHistoryData } from '../types';
import { getActionColor } from '../../../lib/pokerUtils';
import { getTrainerAssetUrl } from '../../../src/config';

interface HandHistoryPanelProps {
    history: HandHistoryData;
    numPlayers: number;
}

/**
 * Get player avatar image URL based on position
 */
const getPlayerAvatarUrl = (position: number): string => {
    const avatarNumber = (position % 8) + 1;
    return getTrainerAssetUrl(`avatar${avatarNumber}.png`);
};

/**
 * Get action color for bubble background
 */
const getActionBubbleColor = (action: string): string => {
    // Reuse the same color logic from action buttons
    const color = getActionColor(action);
    
    // Convert Tailwind bg-* classes to actual colors
    const colorMap: { [key: string]: string } = {
        'bg-[#d946ef]': '#d946ef', // Magenta (Allin)
        'bg-[#f97316]': '#f97316', // Orange (Raise)
        'bg-[#0ea5e9]': '#0ea5e9', // Cyan (Fold)
        'bg-[#10b981]': '#10b981', // Green (Call/Check)
        'bg-[#6b7280]': '#6b7280', // Gray (Check)
        'bg-[#4b5563]': '#4b5563', // Gray (Default)
    };
    
    return colorMap[color] || '#4b5563';
};

export const HandHistoryPanel: React.FC<HandHistoryPanelProps> = ({
    history,
    numPlayers
}) => {
    if (history.actions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-w-[200px] bg-[#1a1d24] rounded-lg p-4 border border-gray-700">
                <div className="text-gray-500 text-sm text-center">
                    <div className="text-2xl mb-2">📝</div>
                    <div>No actions yet</div>
                    <div className="text-xs mt-1">Hand history will appear here</div>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
            <div className="flex flex-col min-w-[200px] max-w-[250px] bg-[#1a1d24] rounded-lg border border-gray-700 overflow-hidden h-full">
            {/* Header */}
            <div className="bg-[#23272f] border-b border-gray-700 px-4 py-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold text-sm">Hand History</h3>
                </div>
                <div className="text-gray-400 text-xs mt-1">
                    {history.currentStreet}
                </div>
            </div>

            {/* Actions List - Scrollable */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {history.actions.map((action, index) => {
                    const bubbleColor = getActionBubbleColor(action.action);
                    const avatarUrl = getPlayerAvatarUrl(action.position);
                    
                    return (
                        <div 
                            key={index} 
                            className="flex items-start gap-3 opacity-0"
                            style={{ 
                                animation: `fadeIn 0.3s ease-in forwards`,
                                animationDelay: `${index * 0.05}s`
                            }}
                        >
                            {/* Avatar Circle */}
                            <div 
                                className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border-2"
                                style={{
                                    borderColor: bubbleColor
                                }}
                            >
                                <img 
                                    src={avatarUrl}
                                    alt={action.playerName}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            
                            {/* Action Bubble */}
                            <div className="flex-1 min-w-0">
                                {/* Position Name */}
                                <div className="text-xs text-gray-400 mb-1 font-semibold">
                                    {action.playerName}
                                </div>
                                
                                {/* Action Bubble */}
                                <div 
                                    className="relative rounded-lg px-3 py-2 text-sm font-medium text-white shadow-md"
                                    style={{
                                        backgroundColor: bubbleColor
                                    }}
                                >
                                    {/* Speech Bubble Pointer */}
                                    <div 
                                        className="absolute left-[-6px] top-3 w-0 h-0"
                                        style={{
                                            borderTop: '6px solid transparent',
                                            borderBottom: '6px solid transparent',
                                            borderRight: `6px solid ${bubbleColor}`
                                        }}
                                    />
                                    
                                    {/* Action Text */}
                                    <div className="break-words">
                                        {action.action}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer - Street Indicator */}
            <div className="bg-[#23272f] border-t border-gray-700 px-4 py-2">
                <div className="text-center text-xs text-gray-400">
                    {history.actions.length} action{history.actions.length !== 1 ? 's' : ''}
                </div>
            </div>
        </div>
        </>
    );
};
