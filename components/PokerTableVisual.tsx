/**
 * PokerTableVisual - TRAINER VERSION ONLY
 * 
 * ⚠️ WARNING: This is the TRAINER-SPECIFIC poker table wrapper
 * ⚠️ DO NOT use this in solution viewer (Sidebar.tsx)
 * ⚠️ Solution viewer uses: components/SolutionPokerTable.tsx
 * 
 * Refactored Version 2.0 - Uses modular component architecture
 * 
 * Components:
 * - PokerTable/index.tsx - Main orchestrator (TRAINER VERSION)
 * - PokerTable/PayoutPanel.tsx - Draggable payout display
 * - PokerTable/PlayerCard.tsx - Individual player cards
 * - PokerTable/ChipStack.tsx - Betting chips visualization
 * - PokerTable/PotDisplay.tsx - Center pot display
 * - PokerTable/TournamentInfo.tsx - Tournament name and stage
 * 
 * Hooks:
 * - hooks/useDraggable.ts - Draggable functionality
 * - hooks/usePlayerPositions.ts - Player positioning calculations
 * 
 * Utils:
 * - utils/pokerTableCalculations.ts - Formatting and calculations
 */

import React from 'react';
import type { NodeData, SettingsData, DisplaySettings, TournamentInfo, SpotContext } from '../types.ts';
import { PokerTable } from './PokerTable/index';

interface PokerTableVisualProps {
    currentNode: NodeData;
    settings: SettingsData;
    bigBlind: number;
    displayMode: 'bb' | 'chips';
    onToggleDisplayMode?: () => void;
    solutionFileName?: string;
    tournamentPhase?: string;
    raiserPosition?: number;
    shoverPositions?: number[];
    spotType?: string;
    villainActions?: SpotContext['villainActions'];
    showBountyInDollars?: boolean;
    onToggleBountyDisplay?: () => void;
}

export const PokerTableVisual: React.FC<PokerTableVisualProps> = ({
    currentNode,
    settings,
    bigBlind,
    displayMode,
    onToggleDisplayMode,
    solutionFileName,
    tournamentPhase,
    raiserPosition,
    shoverPositions,
    spotType,
    villainActions,
    showBountyInDollars = true,
    onToggleBountyDisplay
}) => {
    // Compose props into the new structure
    const display: DisplaySettings = {
        mode: displayMode,
        showBountyInDollars
    };

    const tournament: TournamentInfo = {
        phase: tournamentPhase,
        fileName: solutionFileName
    };

    const spotContext: SpotContext = {
        type: spotType,
        raiserPosition,
        shoverPositions,
        villainActions
    };

    // Delegate to the refactored PokerTable component with composed props
    return (
        <PokerTable
            node={currentNode}
            settings={settings}
            display={display}
            tournament={tournament}
            spotContext={spotContext}
            bigBlind={bigBlind}
            onDisplayChange={onToggleDisplayMode}
        />
    );
};
