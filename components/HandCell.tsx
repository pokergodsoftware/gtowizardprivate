
import React from 'react';
import type { HandData, Action, SettingsData } from '../types.ts';
import { getActionColor, getActionName } from '../lib/pokerUtils.ts';

interface HandCellProps {
  handName: string;
  handData: HandData | undefined;
  actions: Action[];
  bigBlind: number;
  playerStack: number;
  selectedHand: string | null;
  setSelectedHand: (hand: string) => void;
  displayMode: 'bb' | 'chips';
  playerIndex: number;
  numPlayers: number;
  settings: SettingsData;
}

const HandCellMemo: React.FC<HandCellProps> = ({ handName, handData, actions, bigBlind, playerStack, selectedHand, setSelectedHand, displayMode, playerIndex, numPlayers, settings }) => {
    const isSelected = handName === selectedHand;
    
    // If handData is missing or the hand is never played, render a disabled-looking cell.
    if (!handData || handData.played.every(p => p === 0)) {
        return (
            <div 
                className={`bg-[#1a4d5c] flex flex-col items-center justify-center text-center leading-tight p-1 cursor-pointer ${isSelected ? 'ring-2 ring-white z-10' : ''}`}
                onClick={() => setSelectedHand(handName)}
            >
                <span className="text-base font-bold text-white">{handName}</span>
                <span className="text-xs font-semibold text-white/70">0</span>
            </div>
        );
    }
    
    // Find the largest raise index (same logic as ActionsBar)
    const raiseIndices = actions
        .map((action, index) => ({ action, index }))
        .filter(({ action }) => action.type === 'R');
    
    const largestRaiseIndex = raiseIndices.length > 0
        ? raiseIndices[raiseIndices.length - 1].index
        : -1;

    // Create segments for gradient background (colors per action)
    const segments = handData.played
        .map((freq, index) => {
            const action = actions[index];
            if (!action) return null;
            
            // Get action name
            let actionName = getActionName(action, bigBlind, playerStack, displayMode, settings.handdata.stacks);
            
            // Override to "All-in" if this is the largest raise (same logic as ActionsBar)
            // Use a case-insensitive, hyphen-tolerant test to avoid mismatches.
            if (index === largestRaiseIndex && action.type === 'R' && !/all-?in/i.test(actionName)) {
                const sizeMatch = actionName.match(/Raise (.+)/);
                if (sizeMatch) {
                    actionName = `All-in ${sizeMatch[1]}`;
                }
            }
            
            const color = getActionColor(actionName, playerIndex, numPlayers);
            return { freq, color };
        })
        .filter((item): item is { freq: number; color: string } => item !== null && item.freq > 0.001);

    // Calculate weighted EV (weighted by action frequencies)
    const weightedEV = handData.played.reduce((acc, freq, index) => {
        if (freq > 0 && handData.evs[index] !== undefined) {
            return acc + (freq * handData.evs[index]);
        }
        return acc;
    }, 0);
    const displayEV = weightedEV.toFixed(2);

    return (
        <div 
            className={`relative flex overflow-hidden text-white items-center justify-center cursor-pointer ${isSelected ? 'ring-2 ring-white z-10' : ''}`}
            onClick={() => setSelectedHand(handName)}
        >
            {/* Background Gradient: colors per action */}
            {segments.length === 1 ? (
                <div className={`absolute inset-0 ${segments[0].color}`}></div>
            ) : (
                <div className="absolute inset-0 flex w-full h-full">
                    {segments.map((segment, index) => (
                        <div key={index} className={`${segment.color}`} style={{ width: `${segment.freq * 100}%`, height: '100%' }} />
                    ))}
                </div>
            )}
            
            {/* Foreground Text: exibe EV */}
            <div className="relative flex flex-col items-center justify-center text-center leading-tight p-1">
                <span className="text-base font-bold" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.9)'}}>{handName}</span>
                <span className="text-xs font-semibold" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.9)'}}>
                    {displayEV}
                </span>
            </div>
        </div>
    );
};

export const HandCell = React.memo(HandCellMemo);