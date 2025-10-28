
import React from 'react';
import type { NodeData, SettingsData } from '../types.ts';
import { getCombosForHand, getActionName, suits } from '../lib/pokerUtils.ts';

interface ComboDetailProps {
  selectedHand: string | null;
  currentNode: NodeData;
  bigBlind: number;
  settings: SettingsData;
  displayMode: 'bb' | 'chips';
}

const Card: React.FC<{ card: string }> = ({ card }) => {
  const rank = card[0];
  const suitKey = card[1];
  const suit = suits[suitKey];
  if (!suit) return <span>{card}</span>;
  return (
    <>
      {rank}
      <span className={`${suit.color} ml-px`}>{suit.char}</span>
    </>
  );
};

export const ComboDetail: React.FC<ComboDetailProps> = ({ selectedHand, currentNode, bigBlind, settings, displayMode }) => {
  const handData = selectedHand ? currentNode.hands[selectedHand] : null;
  const combos = selectedHand ? getCombosForHand(selectedHand) : [];
  const playerStack = settings.handdata.stacks[currentNode.player];

  const actionsWithEV = handData ? handData.evs.map((ev, index) => {
    const action = currentNode.actions[index];
    const frequency = handData.played[index];
    if (frequency < 0.001) return null;
    return {
      name: getActionName(action, bigBlind, playerStack, displayMode, settings.handdata.stacks),
      ev: ev.toFixed(2),
    };
  }).filter((action): action is { name: string, ev: string } => action !== null) : [];

  return (
    <div className="flex flex-col flex-1 bg-[#1e2227] rounded-md overflow-hidden">
        {/* Header Tabs */}
        <div className="flex px-2 pt-2 bg-[#282c33] text-sm text-gray-300 font-bold border-b border-gray-700 select-none">
            <span className="px-2 pb-1 border-b-2 border-white cursor-pointer">Hands</span>
            <span className="px-2 pb-1 text-gray-500 cursor-pointer hover:text-gray-400">Summary</span>
            <span className="px-2 pb-1 text-gray-500 cursor-pointer hover:text-gray-400">Filters</span>
            <span className="px-2 pb-1 text-gray-500 cursor-pointer hover:text-gray-400">Blockers</span>
        </div>

        {/* Combos Grid */}
        <div className="flex-1 overflow-y-auto p-2">
          {!handData || combos.length === 0 ? (
             <div className="flex h-full items-center justify-center text-gray-500">
                Select a hand to see combo details.
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-1">
                {combos.map((combo) => (
                    <div key={combo} className="bg-[#282c33] p-2 text-white text-sm rounded-sm">
                        <div className="flex justify-between items-center font-bold mb-1">
                            <div className="text-base tracking-tight">
                                <Card card={combo.slice(0, 2)} /> <Card card={combo.slice(2, 4)} />
                            </div>
                            <span className="text-xs text-gray-400">EV</span>
                        </div>
                        <div className="space-y-0.5">
                           {actionsWithEV.map((action, index) => (
                               <div key={index} className="flex justify-between text-xs">
                                   <span>{action.name}</span>
                                   <span className="font-mono">{action.ev}</span>
                               </div>
                           ))}
                        </div>
                    </div>
                ))}
            </div>
          )}
        </div>
    </div>
  );
};