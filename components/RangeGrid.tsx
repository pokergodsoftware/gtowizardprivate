
import React from 'react';
import type { NodeData, SettingsData } from '../types.ts';
import { generateHandMatrix } from '../lib/pokerUtils.ts';
import { HandCell } from './HandCell.tsx';

interface RangeGridProps {
  currentNode: NodeData;
  bigBlind: number;
  playerStack: number;
  selectedHand: string | null;
  setSelectedHand: (hand: string) => void;
  displayMode: 'bb' | 'chips';
  playerIndex: number;
  numPlayers: number;
  settings: SettingsData;
}

const handMatrix = generateHandMatrix();

export const RangeGrid: React.FC<RangeGridProps> = ({ currentNode, bigBlind, playerStack, selectedHand, setSelectedHand, displayMode, playerIndex, numPlayers, settings }) => {
  return (
    <div 
      className="grid gap-[1px] w-full h-full"
      style={{ 
        gridTemplateColumns: 'repeat(13, 1fr)',
        gridTemplateRows: 'repeat(13, 1fr)',
        aspectRatio: '1 / 1',
        maxWidth: '100%',
        maxHeight: '100%'
      }}
    >
      {handMatrix.flat().map((hand, index) => (
        <HandCell 
          key={index} 
          handName={hand}
          handData={currentNode.hands[hand]}
          actions={currentNode.actions}
          bigBlind={bigBlind}
          playerStack={playerStack}
          selectedHand={selectedHand}
          setSelectedHand={setSelectedHand}
          displayMode={displayMode}
          playerIndex={playerIndex}
          numPlayers={numPlayers}
          settings={settings}
        />
      ))}
    </div>
  );
};