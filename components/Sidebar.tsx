
import React, { useState, useMemo } from 'react';
import type { AppData, NodeData } from '../types.ts';
import { PokerTable } from './PokerTable.tsx';
import { ActionsBar } from './ActionsBar.tsx';
import { ComboDetail } from './ComboDetail.tsx';
import { DisplayModeToggle } from './DisplayModeToggle.tsx';
import { PayoutsModal } from './PayoutsModal.tsx';

interface SidebarProps {
  appData: AppData;
  currentNode: NodeData;
  bigBlind: number;
  selectedHand: string | null;
  pathNodeIds: number[];
  displayMode: 'bb' | 'chips';
  onDisplayModeToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ appData, currentNode, bigBlind, selectedHand, pathNodeIds, displayMode, onDisplayModeToggle }) => {
  const [isPayoutsModalOpen, setIsPayoutsModalOpen] = useState(false);
  
  const prizesArray = useMemo((): number[] | null => {
    const prizesObject = appData.settings.eqmodel.structure?.prizes;
    if (!prizesObject || typeof prizesObject !== 'object' || Object.keys(prizesObject).length === 0) {
      return null;
    }

    const positions = Object.keys(prizesObject).map(Number).filter(n => !isNaN(n) && n > 0).sort((a, b) => a - b);
    if (positions.length === 0) return null;

    const maxPosition = positions[positions.length - 1];
    const payouts: number[] = new Array(maxPosition);
    
    let lastKnownPrize = 0;
    // Iterate forwards from the first position to fill in prize gaps,
    // which is the standard for tournament payouts.
    for (let i = 1; i <= maxPosition; i++) {
        if (prizesObject[i] !== undefined) {
            lastKnownPrize = prizesObject[i];
        }
        // Payouts array is 0-indexed, positions are 1-indexed
        payouts[i - 1] = lastKnownPrize;
    }

    return payouts;
  }, [appData.settings.eqmodel.structure]);

  const hasPayouts = prizesArray && prizesArray.length > 0;

  return (
    <aside className="w-[380px] flex-shrink-0 bg-[#282c33] rounded-md flex flex-col p-2 space-y-2 overflow-hidden">
      <div className="flex justify-between items-center">
        <button
          onClick={() => hasPayouts && setIsPayoutsModalOpen(true)}
          disabled={!hasPayouts}
          className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
            hasPayouts
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          Payouts
        </button>
        <DisplayModeToggle displayMode={displayMode} onToggle={onDisplayModeToggle} />
      </div>
      
      <PokerTable 
        settings={appData.settings} 
        activePlayerIndex={currentNode.player} 
        bigBlind={bigBlind} 
        currentNode={currentNode}
        allNodes={appData.nodes}
        pathNodeIds={pathNodeIds}
        displayMode={displayMode}
      />
      <ActionsBar currentNode={currentNode} bigBlind={bigBlind} settings={appData.settings} displayMode={displayMode} />
      <ComboDetail 
        selectedHand={selectedHand} 
        currentNode={currentNode} 
        bigBlind={bigBlind}
        settings={appData.settings}
        displayMode={displayMode}
      />
      
      {hasPayouts && prizesArray && (
        <PayoutsModal 
          isOpen={isPayoutsModalOpen}
          onClose={() => setIsPayoutsModalOpen(false)}
          payouts={prizesArray}
        />
      )}
    </aside>
  );
};