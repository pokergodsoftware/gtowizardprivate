import React from 'react';
import type { NodeData, SettingsData } from '../types.ts';
import { getActionName, getActionColor } from '../lib/pokerUtils.ts';

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
        
        const actionName = getActionName(action, bigBlind, playerStack, displayMode, settings.handdata.stacks);
        const color = getActionColor(actionName, currentNode.player, numPlayers);
        const ev = handData.evs[index];

        return { actionName, color, frequency, ev };
    });

  // Debug: log para verificar quantas ações existem
  console.log(`${selectedHand}: ${actionDetails.length} ações`, actionDetails.map(d => `${d.actionName} ${(d.frequency * 100).toFixed(1)}%`));

  const totalEV = handData.evs.reduce((acc, ev, index) => acc + (ev * handData.played[index]), 0);

  return (
    <div className="flex-1 bg-[#1e2227] rounded-lg p-4 flex flex-col gap-3 overflow-hidden">
      <div className="flex-shrink-0">
        <h3 className="text-2xl font-bold text-white mb-1">{selectedHand}</h3>
        <p className="text-sm text-gray-400 font-mono">
          EV Total: <span className="font-semibold text-emerald-400">{totalEV.toFixed(3)}</span>
        </p>
      </div>

      {/* Action Breakdown */}
      <div className="flex-shrink-0">
        <h4 className="font-semibold text-gray-300 text-sm uppercase tracking-wide mb-2">Ações</h4>
        <div className="grid grid-cols-2 gap-2 auto-rows-min">
          {actionDetails.map((detail, index) => (
            <div key={index} className="bg-[#2d3238] p-2.5 rounded-lg min-h-[60px]">
              <div className="flex justify-between items-center mb-0.5">
                  <span className={`font-bold text-sm ${detail.color.replace('bg-', 'text-')}`}>{detail.actionName}</span>
                  <span className="text-lg font-bold text-white">{(detail.frequency * 100).toFixed(1)}%</span>
              </div>
               <p className="text-xs text-gray-400 font-mono text-right">
                  EV: <span className="font-semibold text-emerald-400">{detail.ev.toFixed(3)}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
