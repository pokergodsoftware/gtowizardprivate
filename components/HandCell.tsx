
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
                className={`bg-[#2d3238] aspect-square flex flex-col items-center justify-center rounded-sm text-center leading-none p-0.5 cursor-pointer ${isSelected ? 'ring-2 ring-blue-500 z-10' : ''}`}
                onClick={() => setSelectedHand(handName)}
            >
                <span className="text-sm font-bold tracking-tighter text-gray-400">{handName}</span>
                <span className="text-xs font-mono text-gray-500">0.00</span>
            </div>
        );
    }
    
    // Create segments for gradient background
    const segments = handData.played
        .map((freq, index) => {
            const action = actions[index];
            if (!action) return null;
            const actionName = getActionName(action, bigBlind, playerStack, displayMode, settings.handdata.stacks);
            const color = getActionColor(actionName, playerIndex, numPlayers);
            return { freq, color };
        })
        .filter((item): item is { freq: number; color: string } => item !== null && item.freq > 0.001);

    // Calculate total EV for the hand
    const totalEV = handData.evs.reduce((acc, ev, index) => acc + (ev * handData.played[index]), 0);

    return (
        <div 
            className={`relative aspect-square flex rounded-sm overflow-hidden text-white items-center justify-center cursor-pointer ${isSelected ? 'ring-2 ring-blue-500 z-10' : ''}`}
            onClick={() => setSelectedHand(handName)}
        >
            {/* Background Gradient */}
            {segments.length === 1 ? (
                <div className={`absolute inset-0 ${segments[0].color}`}></div>
            ) : (
                <div className="absolute inset-0 flex w-full h-full">
                    {segments.map((segment, index) => (
                        <div key={index} className={`${segment.color}`} style={{ width: `${segment.freq * 100}%`, height: '100%' }} />
                    ))}
                </div>
            )}
            {/* Foreground Text */}
            <div className="relative flex flex-col items-center justify-center text-center leading-none p-0.5">
                <span className="text-sm font-bold tracking-tighter" style={{textShadow: '1px 1px 1px rgba(0,0,0,0.8)'}}>{handName}</span>
                <span className="text-xs font-mono opacity-90" style={{textShadow: '1px 1px 1px rgba(0,0,0,0.8)'}}>
                    {totalEV.toFixed(2)}
                </span>
            </div>
        </div>
    );
};

export const HandCell = React.memo(HandCellMemo);