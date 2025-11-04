/**
 * PokerTable/index.tsx - TRAINER VERSION ONLY
 * 
 * ⚠️ WARNING: This is the TRAINER-SPECIFIC poker table
 * ⚠️ DO NOT use this in solution viewer (Sidebar.tsx)
 * ⚠️ Solution viewer uses: components/SolutionPokerTable.tsx
 * 
 * This version includes:
 * - Modular component architecture
 * - Draggable payout panel
 * - Advanced player badges (raiser, shover, etc)
 * - Tournament-specific features
 * - Enhanced visual effects
 * 
 * Used by: PokerTableVisual.tsx → TrainerSimulator.tsx
 */

import React from 'react';
import type { NodeData, SettingsData, DisplaySettings, TournamentInfo, SpotContext } from '../../types';
import { getPlayerPositions } from '../../lib/pokerUtils';
import { getTrainerAssetUrl } from '../../src/config';
import { usePlayerPositions } from '../../hooks/usePlayerPositions';
import {
    calculateTotalPot,
    hasPlayerFolded,
    calculatePlayerBet,
    getTournamentName
} from '../../utils/pokerTableCalculations';
import { PlayerCard, type PlayerBadge } from './PlayerCard';
import { ChipStack } from './ChipStack';
import { PotDisplay } from './PotDisplay';
import { TournamentInfo as TournamentInfoComponent } from './TournamentInfo';

// Export types for external use
export type { PlayerBadge };

// Chip positioning configuration
const CHIPS_CONFIG = {
    radiusPercent: -2.2,  // Adjust here (test 0.45 to 0.60)
};

interface PokerTableProps {
    node: NodeData;
    settings: SettingsData;
    display: DisplaySettings;
    tournament: TournamentInfo;
    spotContext: SpotContext;
    bigBlind: number;
    onDisplayChange?: (setting: keyof DisplaySettings) => void;
}

/**
 * Main Poker Table component that orchestrates all sub-components
 * Uses composition pattern with grouped props for better organization
 */
export const PokerTable: React.FC<PokerTableProps> = ({
    node: currentNode,
    settings,
    display,
    tournament,
    spotContext,
    bigBlind,
    onDisplayChange
}) => {
    try {
        // Validate required data
        if (!settings?.handdata || !currentNode) {
            console.error('PokerTable: Missing required data', { settings, currentNode });
            return null;
        }

    // Destructure composed props for easier access
    const { mode: displayMode, showBountyInDollars } = display;
    const { phase: tournamentPhase, fileName: solutionFileName } = tournament;
    const { type: spotType, raiserPosition, shoverPositions, villainActions } = spotContext;

    const { stacks, bounties, blinds } = settings.handdata;
    
    if (!stacks || stacks.length === 0) {
        console.error('PokerTable: Invalid stacks data', { stacks });
        return null;
    }

    const numPlayers = stacks.length;
    const positions = getPlayerPositions(numPlayers);
    const heroPosition = currentNode.player;
    
    // Validate positions array
    if (!positions || !Array.isArray(positions) || positions.length === 0) {
        console.error('PokerTable: Invalid positions array', { positions, numPlayers });
        return null;
    }
    
    const { getPlayerPosition, getPlayerAngle } = usePlayerPositions();
    
    // Identify SB, BB and BTN
    const bbPosition = numPlayers - 1;
    const sbPosition = numPlayers === 2 ? 0 : numPlayers - 2;
    const btnPosition = numPlayers === 2 ? 0 : numPlayers - 3;
    const smallBlind = blinds?.length > 1 ? Math.min(blinds[0], blinds[1]) : (blinds?.[0] / 2 || 0);
    const ante = blinds?.length > 2 ? blinds[2] : 0;
    
    const totalPot = calculateTotalPot(smallBlind, bigBlind, ante, numPlayers);
    
    // Determine table image
    const tableImage = tournamentPhase === 'Final table' 
        ? getTrainerAssetUrl('final_table.png')
        : getTrainerAssetUrl('table.png');
    
    const tournamentName = getTournamentName(solutionFileName);
    
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Poker table */}
            <div className="relative w-full max-w-3xl aspect-[16/10]">
                <img 
                    src={tableImage} 
                    alt="Poker Table" 
                    className="w-full h-full object-contain"
                />
                
                {/* Tournament Info */}
                <TournamentInfoComponent 
                    tournamentName={tournamentName}
                    tournamentPhase={tournamentPhase}
                />
                
                {/* Players around the table */}
                {stacks?.map((stack, index) => {
                    const pos = getPlayerPosition(index, numPlayers, heroPosition);
                    const isCurrentPlayer = index === currentNode.player;
                    const position = positions[index];
                    const bounty = bounties?.[index] || 0;
                    const isBB = index === bbPosition;
                    const isSB = index === sbPosition;
                    const isBTN = index === btnPosition;
                    const isRaiser = spotType === 'vs Open' && raiserPosition !== undefined && index === raiserPosition;
                    const isShover = spotType === 'vs Shove' && raiserPosition !== undefined && index === raiserPosition;
                    const isMultiwayShover = spotType === 'vs Multiway shove' && shoverPositions !== undefined && shoverPositions.includes(index);
                    
                    // Get villain action for this position (works for Any, vs Open, etc)
                    const villainAction = villainActions 
                        ? villainActions.find(va => va.position === index) 
                        : undefined;
                    
                    const isAutoAllin = stack <= 0;
                    const hasFolded = hasPlayerFolded(index, heroPosition);
                    
                    // Calculate player angle (for chip positioning)
                    const playerAngle = getPlayerAngle(index, numPlayers, heroPosition);
                    
                    // Calculate player bet
                    const playerBet = calculatePlayerBet(
                        index,
                        isRaiser,
                        isShover,
                        isMultiwayShover,
                        isAutoAllin,
                        isBB,
                        isSB,
                        stack,
                        bigBlind,
                        smallBlind,
                        ante,
                        totalPot,
                        villainAction
                    );
                    
                    // Calculate chip position
                    const tableRadiusX = 42;
                    const tableRadiusY = 35;
                    const betRadiusX = tableRadiusX * CHIPS_CONFIG.radiusPercent;
                    const betRadiusY = tableRadiusY * CHIPS_CONFIG.radiusPercent;
                    const centerX = 50;
                    const centerY = 50;
                    const betX = centerX + betRadiusX * Math.cos(playerAngle);
                    const betY = centerY + betRadiusY * Math.sin(playerAngle);
                    
                    const hasVillainFolded = villainAction && villainAction.action === 'Fold';
                    const hasVillainAction = villainAction && villainAction.action !== 'Fold';
                    
                    return (
                        <div
                            key={index}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2"
                            style={{ top: pos.top, left: pos.left }}
                        >
                            {/* Player bet with visual chips (if any) - in radial direction */}
                            {playerBet > 0 && (
                                <div 
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1"
                                    style={{ 
                                        top: `${betY}%`, 
                                        left: `${betX}%`,
                                        pointerEvents: 'none'
                                    }}
                                >
                                    <ChipStack
                                        amount={playerBet}
                                        bigBlind={bigBlind}
                                        displayMode={displayMode}
                                        isRaiser={isRaiser}
                                        isShover={isShover}
                                        isMultiwayShover={isMultiwayShover}
                                        isAutoAllin={isAutoAllin}
                                        isSB={isSB}
                                        isBB={isBB}
                                        hasFolded={hasFolded}
                                        hasVillainFolded={hasVillainFolded}
                                        hasVillainAction={hasVillainAction}
                                    />
                                </div>
                            )}
                            
                            {/* Player card */}
                            <PlayerCard
                                index={index}
                                position={position}
                                stack={stack}
                                bounty={bounty}
                                isCurrentPlayer={isCurrentPlayer}
                                isBB={isBB}
                                isSB={isSB}
                                isBTN={isBTN}
                                isRaiser={isRaiser}
                                isShover={isShover}
                                isMultiwayShover={isMultiwayShover}
                                isAutoAllin={isAutoAllin}
                                hasFolded={hasFolded}
                                villainAction={villainAction}
                                bigBlind={bigBlind}
                                smallBlind={smallBlind}
                                ante={ante}
                                displayMode={displayMode}
                                showBountyInDollars={showBountyInDollars}
                                solutionFileName={solutionFileName}
                                onToggleDisplayMode={onDisplayChange ? () => onDisplayChange('mode') : undefined}
                            />
                        </div>
                    );
                })}

                {/* Pot in center with chips */}
                <PotDisplay
                    totalPot={totalPot}
                    bigBlind={bigBlind}
                    displayMode={displayMode}
                />
            </div>
        </div>
    );
    } catch (error) {
        console.error('PokerTable Error:', error);
        console.error('Props:', { currentNode, settings, bigBlind, display });
        return (
            <div className="text-red-500 p-4">
                <p>Error rendering poker table</p>
                <p className="text-sm">{error instanceof Error ? error.message : String(error)}</p>
            </div>
        );
    }
};
