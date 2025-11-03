/**
 * SolutionPokerTable - SPECIFIC FOR SOLUTION VIEWER ONLY
 * 
 * ⚠️ WARNING: DO NOT MODIFY THIS FOR TRAINER FEATURES
 * ⚠️ This is the ORIGINAL poker table used in the solution viewer (Sidebar.tsx)
 * ⚠️ For trainer modifications, use PokerTableVisual.tsx or PokerTable/index.tsx
 * 
 * This component maintains the classic solution viewer table layout:
 * - Simple circular player representation
 * - Traditional bet display with chips
 * - Minimal visual styling
 * - No drag-and-drop features
 * - No advanced trainer-specific badges
 * 
 * History: Restored after being accidentally replaced by trainer version
 * Date: 2025-11-03
 */

import React from 'react';
import type { NodeData, SettingsData, Action } from '../types.ts';
import { getPlayerPositions, formatChips, calculateBountyMultiplier } from '../lib/pokerUtils.ts';

// A more detailed component for each player at the table
const Player: React.FC<{
  position: string;
  stackChips: number;
  bounty: number;
  status: 'active' | 'waiting' | 'folded'; // Replaces isActive and isFolded
  isBB: boolean;
  bigBlind: number;
  displayMode: 'bb' | 'chips';
  fileName?: string;
}> = ({ position, stackChips, bounty, status, isBB, bigBlind, displayMode, fileName }) => {
  const stackDisplay = displayMode === 'bb' 
    ? (bigBlind > 0 ? ((stackChips / 100) / (bigBlind / 100)).toFixed(1) : '0.0')
    : formatChips(stackChips / 100);

  const bountyDisplay = displayMode === 'bb' && fileName
    ? calculateBountyMultiplier(bounty / 2, fileName)
    : formatChips(bounty / 2);

  // Determine styles based on player status
  const isFolded = status === 'folded';
  const isActive = status === 'active';

  const circleBgClass = isFolded ? 'bg-[#2d3238]' : 'bg-[#353a42]';
  const positionTextClass = isFolded ? 'text-gray-600' : 'text-white';
  const stackTextClass = isFolded ? 'text-gray-700' : 'text-gray-300';
  const bountyOpacityClass = isFolded ? 'opacity-40' : '';


  // The core circle element for the player
  const playerCircle = (
    <div
      className={`
        flex flex-col items-center justify-start pt-1
        w-14 h-14 rounded-full text-center transition-all duration-200
        border border-black/20
        shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]
        ${circleBgClass}
        ${isActive && !isBB ? 'ring-2 ring-teal-400' : ''}
      `}
    >
      <span className={`text-sm font-bold ${positionTextClass}`}>{position}</span>
      <span className={`text-xs ${stackTextClass}`}>{stackDisplay}</span>
    </div>
  );

  return (
    <div className={`relative flex flex-col items-center justify-center gap-1`}>
      {/* Player Circle */}
      <div className="flex items-center justify-center">
        {/* If player is BB and is active, wrap the circle in a square border */}
        {isActive && isBB ? (
          <div className="p-0.5 rounded-md border-2 border-teal-400">
            {playerCircle}
          </div>
        ) : (
          playerCircle
        )}
      </div>
      
      {/* Bounty Display - Logo abaixo do círculo */}
      {bounty > 0 && (
        <div className={`flex items-center justify-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-xs text-yellow-400 font-semibold transition-opacity duration-300 ${bountyOpacityClass}`}>
            <img src="https://waryhub.com/files/preview/960x960/11742569964ly8rjxfvuumzs0lup831ldwasvucbe4pnljcyq7voxhowhzlrmfowailtjbzxv8wrpn9ikcrlm3xqbl9uz9mxvyezd7boik50po6.png" alt="Bounty" className="w-3.5 h-3.5" />
            <span className="text-[11px]">{bountyDisplay}</span>
        </div>
      )}
    </div>
  );
};

// The dealer button, styled to match the reference
const DealerButton: React.FC = () => {
  return (
    <div className="absolute w-6 h-6 bg-white text-black text-xs font-bold rounded-full flex items-center justify-center border border-black/50 -translate-x-1/2 -translate-y-1/2">
      D
    </div>
  );
};


/**
 * SolutionPokerTable - Main Table Component
 * 
 * Displays the poker table for solution viewing with:
 * - Player positions in circular layout
 * - Stack sizes (in BB or chips)
 * - Bounty amounts
 * - Current pot
 * - Player bets
 * - Dealer button
 * - Folded player indication
 */
export const SolutionPokerTable: React.FC<{ settings: SettingsData; activePlayerIndex: number; bigBlind: number; currentNode: NodeData; allNodes: Map<number, NodeData>; pathNodeIds: number[]; displayMode: 'bb' | 'chips'; fileName?: string; }> = ({ settings, activePlayerIndex, bigBlind, currentNode, allNodes, pathNodeIds, displayMode, fileName }) => {
  const { stacks, blinds, bounties } = settings.handdata;
  const numPlayers = stacks.length;
  // Robustly determine SB and BB, regardless of order in the data file.
  const smallBlindAmount = blinds.length > 1 ? Math.min(blinds[0], blinds[1]) : (blinds[0] || 0);
  const bigBlindAmount = blinds.length > 1 ? Math.max(blinds[0], blinds[1]) : (blinds[0] || 0);
  
  // Ajustar bigBlind para cálculos em modo BB (dividir por 100)
  const adjustedBigBlind = displayMode === 'bb' ? bigBlindAmount / 100 : bigBlindAmount;
  const ante = blinds.length > 2 ? blinds[2] : 0;
  
  const positions = getPlayerPositions(numPlayers);
  const btnIndex = numPlayers > 2 ? numPlayers - 3 : (numPlayers === 2 ? 0 : -1);
  const sbIndex = numPlayers > 1 ? numPlayers - 2 : (numPlayers === 2 ? 0 : -1);
  const bbIndex = numPlayers > 1 ? numPlayers - 1 : (numPlayers === 2 ? 1 : -1);

  // --- State Calculation from Path ---
  const currentStacks = [...stacks];
  const foldedPlayerIndices = new Set<number>();
  const streetInvestments = new Map<number, number>();
  let totalPot = 0;

  // 1. Antes
  stacks.forEach((_, i) => {
    currentStacks[i] -= ante;
    totalPot += ante;
  });

  // 2. Blinds (preflop only)
  if (currentNode.street === 0) {
    if (sbIndex !== -1) {
      const sbPost = Math.min(smallBlindAmount, currentStacks[sbIndex]);
      currentStacks[sbIndex] -= sbPost;
      totalPot += sbPost;
      streetInvestments.set(sbIndex, sbPost);
    }
    if (bbIndex !== -1) {
      const bbPost = Math.min(bigBlindAmount, currentStacks[bbIndex]);
      currentStacks[bbIndex] -= bbPost;
      totalPot += bbPost;
      streetInvestments.set(bbIndex, bbPost);
    }
  }

  let currentStreet = 0;

  // 3. Actions from path
  for (let i = 0; i < pathNodeIds.length - 1; i++) {
    const parentNode = allNodes.get(pathNodeIds[i]);
    const childNodeId = pathNodeIds[i + 1];
    const childNode = allNodes.get(childNodeId);

    if (!parentNode || !childNode) continue;

    if (childNode.street > currentStreet) {
      streetInvestments.clear();
      currentStreet = childNode.street;
    }

    const actionTaken = parentNode.actions.find(a => a.node === childNodeId);
    if (!actionTaken) continue;

    const playerIndex = parentNode.player;
    
    switch (actionTaken.type) {
      case 'F':
        foldedPlayerIndices.add(playerIndex);
        break;
      case 'R':
      case 'C':
        const previousInvestment = streetInvestments.get(playerIndex) || 0;
        const additionalBet = actionTaken.amount - previousInvestment;

        if (additionalBet > 0) {
          const betAmount = Math.min(additionalBet, currentStacks[playerIndex]);
          currentStacks[playerIndex] -= betAmount;
          totalPot += betAmount;
          streetInvestments.set(playerIndex, previousInvestment + betAmount);
        }
        break;
    }
  }

  const potInChips = totalPot;
  
  let currentBetToCall = 0;
  for (const amount of streetInvestments.values()) {
      if (amount > currentBetToCall) {
          currentBetToCall = amount;
      }
  }
  // In an unopened pot preflop, the bet is the BB.
  if (currentNode.street === 0 && currentBetToCall <= bigBlindAmount && pathNodeIds.length <= 1) {
      currentBetToCall = bigBlindAmount;
  }
  // --- End of State Calculation ---

  const layouts: { [key: number]: { top: string; left: string }[] } = {
    9: [ { top: '50%', left: '10%' }, { top: '25%', left: '20%' }, { top: '10%', left: '35%' }, { top: '10%', left: '50%' }, { top: '10%', left: '65%' }, { top: '25%', left: '80%' }, { top: '50%', left: '90%' }, { top: '80%', left: '70%' }, { top: '80%', left: '30%' } ],
    8: [ { top: '50%', left: '10%' }, { top: '22%', left: '22%' }, { top: '10%', left: '40%' }, { top: '10%', left: '60%' }, { top: '22%', left: '78%' }, { top: '50%', left: '90%' }, { top: '85%', left: '70%' }, { top: '85%', left: '30%' } ],
    7: [ { top: '50%', left: '10%' }, { top: '15%', left: '30%' }, { top: '10%', left: '50%' }, { top: '15%', left: '70%' }, { top: '50%', left: '90%' }, { top: '90%', left: '70%' }, { top: '90%', left: '30%' } ],
    6: [ { top: '50%', left: '10%' }, { top: '15%', left: '30%' }, { top: '15%', left: '70%' }, { top: '50%', left: '90%' }, { top: '85%', left: '70%' }, { top: '85%', left: '30%' } ],
    5: [ { top: '50%', left: '10%' }, { top: '10%', left: '50%' }, { top: '50%', left: '90%' }, { top: '90%', left: '70%' }, { top: '90%', left: '30%' } ],
    4: [ { top: '50%', left: '12%' }, { top: '10%', left: '50%' }, { top: '90%', left: '70%' }, { top: '90%', left: '30%' } ],
    3: [ { top: '10%', left: '50%' }, { top: '90%', left: '75%' }, { top: '90%', left: '25%' } ],
    2: [ { top: '20%', left: '50%' }, { top: '80%', left: '50%' } ],
  };

  const layout = layouts[numPlayers];

  const getInFrontPosition = (playerStyle: { top: string; left: string }, distanceFactor: number = 0.4) => {
    const playerLeft = parseFloat(playerStyle.left);
    const playerTop = parseFloat(playerStyle.top);
    const centerLeft = 50;
    const centerTop = 50;

    const newLeft = playerLeft + (centerLeft - playerLeft) * distanceFactor;
    const newTop = playerTop + (centerTop - playerTop) * distanceFactor;

    return { top: `${newTop}%`, left: `${newLeft}%` };
  };

  return (
    <div className="bg-[#1e2227] flex items-center justify-center p-4 h-64 rounded-lg relative shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)]">
      <div className="absolute w-[95%] h-[85%] border-2 border-gray-600/50 rounded-[50%] shadow-[inset_0_0_15px_rgba(0,0,0,0.7)]"></div>
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center z-0">
          <span className="font-bold text-lg text-white whitespace-nowrap">
            {displayMode === 'bb' && adjustedBigBlind > 0
              ? `${((potInChips / 100) / adjustedBigBlind).toFixed(2)} bb` 
              : formatChips(potInChips / 100)}
          </span>
          {currentBetToCall > 0 && potInChips > currentBetToCall && (
              <span className="text-sm text-gray-400 whitespace-nowrap">
                {displayMode === 'bb' && adjustedBigBlind > 0
                  ? `${((currentBetToCall / 100) / adjustedBigBlind).toFixed(2)} bb` 
                  : formatChips(currentBetToCall / 100)}
              </span>
          )}
      </div>

      {/* Render Players */}
      {layout && currentStacks.map((stack, i) => {
        const playerStyle = layout[i];
        const bountyAmount = bounties && bounties.length > i ? bounties[i] : 0;
        const hasFolded = foldedPlayerIndices.has(i);

        let status: 'active' | 'waiting' | 'folded';
        if (hasFolded) {
          status = 'folded';
        } else if (i === activePlayerIndex) {
          status = 'active';
        } else {
          // A player is 'waiting' if they haven't folded and it's not their turn.
          status = 'waiting';
        }

        return (
          <div 
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={playerStyle}
          >
            <Player
              position={positions[i]}
              stackChips={stack}
              bounty={bountyAmount}
              status={status}
              bigBlind={bigBlind}
              isBB={i === bbIndex}
              displayMode={displayMode}
              fileName={fileName}
            />
          </div>
        );
      })}

      {/* Render Action Chips */}
      {layout && bigBlindAmount > 0 && [...streetInvestments.entries()].map(([playerIndex, amount]) => {
          if (amount <= 0 || !layout[playerIndex]) return null;
          
          const displayText = displayMode === 'bb' 
            ? parseFloat(((amount / 100) / adjustedBigBlind).toFixed(2)).toString() 
            : formatChips(amount / 100);

          const chipPosition = getInFrontPosition(layout[playerIndex]);

          return (
              <div
                  key={`bet-${playerIndex}`}
                  className="absolute flex items-center gap-1.5 -translate-x-1/2 -translate-y-1/2 z-10"
                  style={chipPosition}
              >
                  <div className="w-4 h-4 rounded-full bg-blue-600 border border-blue-400 shadow-sm"></div>
                  <span className="text-white font-bold text-sm" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}>{displayText}</span>
              </div>
          );
      })}

      {/* Render Dealer Button */}
      {layout && btnIndex !== -1 && (
        <div className="absolute" style={getInFrontPosition(layout[btnIndex], 0.15)}>
          <DealerButton />
        </div>
      )}
    </div>
  );
};