import React from 'react';
import type { NodeData, SettingsData } from '../types.ts';
import { getActionName, getActionColor, getCombosForHand, suits } from '../lib/pokerUtils.ts';

interface ComboDetailProps {
  selectedHand: string | null;
  currentNode: NodeData;
  bigBlind: number;
  settings: SettingsData;
  displayMode: 'bb' | 'chips';
}

export const ComboDetail: React.FC<ComboDetailProps> = ({ selectedHand, currentNode, bigBlind, settings, displayMode }) => {
  if (!selectedHand) {
    return (
      <div className="flex-1 bg-[#1e2227] rounded-lg flex items-center justify-center text-gray-500">
        <p>Selecione uma mão para ver os detalhes</p>
      </div>
    );
  }

  const handData = currentNode.hands[selectedHand];
  const allCombos = getCombosForHand(selectedHand);
  const playerStack = settings.handdata.stacks[currentNode.player];
  const numPlayers = settings.handdata.stacks.length;

  if (!handData) {
     return (
      <div className="flex-1 bg-[#1e2227] rounded-lg flex items-center justify-center text-gray-500">
        <p>Nenhuma informação para {selectedHand}</p>
      </div>
    );
  }

  const actionDetails = currentNode.actions
    .map((action, index) => {
        const frequency = handData.played[index];
        if (frequency < 0.001) return null;
        
        const actionName = getActionName(action, bigBlind, playerStack, displayMode, settings.handdata.stacks);
        const color = getActionColor(actionName, currentNode.player, numPlayers);
        const ev = handData.evs[index];

        return { actionName, color, frequency, ev };
    })
    .filter(Boolean);

  const totalEV = handData.evs.reduce((acc, ev, index) => acc + (ev * handData.played[index]), 0);

  return (
    <div className="flex-1 bg-[#1e2227] rounded-lg p-3 flex flex-col space-y-3 overflow-y-auto">
      <div>
        <h3 className="text-xl font-bold text-white">{selectedHand}</h3>
        <p className="text-sm text-gray-400 font-mono">
          EV Total: <span className="font-semibold text-gray-200">{totalEV.toFixed(3)}</span>
        </p>
      </div>

      {/* Action Breakdown */}
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-300">Ações</h4>
        {actionDetails.map((detail, index) => detail && (
          <div key={index} className="bg-[#2d3238] p-2 rounded-md">
            <div className="flex justify-between items-center">
                <span className={`font-bold text-base ${detail.color.replace('bg-', 'text-')}`}>{detail.actionName}</span>
                <span className="text-lg font-bold text-white">{(detail.frequency * 100).toFixed(1)}%</span>
            </div>
             <p className="text-xs text-gray-400 font-mono text-right">
                EV: <span className="font-semibold text-gray-300">{detail.ev.toFixed(3)}</span>
            </p>
          </div>
        ))}
      </div>
      
      {/* Combos List */}
       <div className="flex-grow overflow-y-auto">
        <h4 className="font-semibold text-gray-300 mb-2 sticky top-0 bg-[#1e2227] py-1">Combos ({allCombos.length})</h4>
        <div className="grid grid-cols-4 gap-x-2 gap-y-1 text-center">
            {allCombos.map(combo => {
                const r1 = combo[0];
                const s1 = combo[1];
                const r2 = combo[2];
                const s2 = combo[3];
                return (
                    <div key={combo} className="font-mono text-sm text-gray-300 bg-[#2d3238] rounded-sm p-1">
                        <span>{r1}</span>
                        <span className={suits[s1]?.color || ''}>{suits[s1]?.char}</span>
                        <span>{r2}</span>
                        <span className={suits[s2]?.color || ''}>{suits[s2]?.char}</span>
                    </div>
                )
            })}
        </div>
      </div>
    </div>
  );
};
