
import React, { useState, useMemo } from 'react';
import type { AppData, NodeData, DisplaySettings, TournamentInfo, SpotContext } from '../types.ts';
import { PokerTable } from './PokerTable/index';
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
    <aside className="w-[600px] flex-shrink-0 bg-[#23272f] rounded-lg flex flex-col p-3 space-y-3 overflow-hidden">
      <div className="flex justify-between items-center">
        <button
          onClick={() => hasPayouts && setIsPayoutsModalOpen(true)}
          disabled={!hasPayouts}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            hasPayouts
              ? 'bg-[#2d3238] text-gray-200 hover:bg-[#353a42]'
              : 'bg-[#1e2227] text-gray-600 cursor-not-allowed'
          }`}
        >
          Payouts
        </button>
        <DisplayModeToggle displayMode={displayMode} onToggle={onDisplayModeToggle} />
      </div>
      
      <PokerTable 
        node={currentNode}
        settings={appData.settings}
        display={{
          mode: displayMode,
          showBountyInDollars: true
        }}
        tournament={{
          phase: appData.tournamentPhase,
          fileName: appData.fileName
        }}
        spotContext={{}}
        bigBlind={bigBlind}
        onDisplayChange={onDisplayModeToggle}
      />
      <div className="mt-6">
        <ActionsBar currentNode={currentNode} bigBlind={bigBlind} settings={appData.settings} displayMode={displayMode} />
      </div>
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