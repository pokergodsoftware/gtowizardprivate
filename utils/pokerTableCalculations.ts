/**
 * Utility functions for poker table calculations and formatting
 */

import type { VillainAction } from '../types';

/**
 * Calculate the position of a player around the poker table
 * Rotates the table so the hero is always at the bottom center
 * 
 * @param index - Player index
 * @param total - Total number of players
 * @param heroPosition - Position of the hero player
 * @returns Object with top and left percentage values
 */
export const calculatePlayerPosition = (
    index: number,
    total: number,
    heroPosition: number
): { top: string; left: string } => {
    // Calculate offset to rotate the table so hero is at bottom center
    const heroAngleOffset = (heroPosition / total) * 2 * Math.PI;
    
    // Base angle of the player
    const baseAngle = (index / total) * 2 * Math.PI;
    
    // Rotated angle to place hero at the bottom (90 degrees = Math.PI / 2)
    const angle = baseAngle - heroAngleOffset + Math.PI / 2;
    
    // Ellipse radii for the poker table
    const RADIUS_X = 42; // Horizontal radius
    const RADIUS_Y = 35; // Vertical radius
    
    // Calculate x and y positions as percentages
    const x = 50 + RADIUS_X * Math.cos(angle);
    const y = 50 + RADIUS_Y * Math.sin(angle);
    
    return { top: `${y}%`, left: `${x}%` };
};

/**
 * Determines the initial bounty value based on the solution filename
 */
export const getInitialBounty = (solutionFileName?: string): number => {
    if (!solutionFileName) return 7.5; // Default
    
    const fileName = solutionFileName.toLowerCase();
    if (fileName.includes('speed32')) return 7.5;
    if (fileName.includes('speed50')) return 12.5;
    if (fileName.includes('speed108')) return 25;
    if (fileName.includes('speed20')) return 5;
    
    return 7.5; // Default
};

/**
 * Formats bounty display as dollar amount or multiplier
 */
export const formatBounty = (
    bounty: number,
    showInDollars: boolean,
    solutionFileName?: string
): string => {
    const actualBounty = bounty / 2; // Real bounty in dollars
    
    if (showInDollars) {
        // Dollar mode: display in dollars
        return `$${actualBounty.toFixed(2)}`;
    } else {
        // Multiplier mode: display as multiplier of initial bounty
        const initialBounty = getInitialBounty(solutionFileName);
        const multiplier = actualBounty / initialBounty;
        return `${multiplier.toFixed(1)}x`;
    }
};

/**
 * Formats stack display in BB or chips
 */
export const formatStack = (
    stack: number,
    bigBlind: number,
    displayMode: 'bb' | 'chips',
    ante: number,
    isBB: boolean = false,
    isSB: boolean = false,
    smallBlind: number = 0,
    villainBet: number = 0
): string => {
    // Deduct ante from stack (everyone paid ante)
    let effectiveStack = stack - ante;
    
    // Deduct blinds if player is BB or SB
    if (isBB) {
        effectiveStack -= bigBlind;
    } else if (isSB) {
        effectiveStack -= smallBlind;
    }
    
    // Deduct villain bet (for "Any" type)
    if (villainBet > 0) {
        effectiveStack -= villainBet;
    }
    
    // Ensure stack is never negative
    effectiveStack = Math.max(0, effectiveStack);
    
    if (displayMode === 'bb') {
        const stackBB = bigBlind > 0 ? (effectiveStack / bigBlind).toFixed(1) : '0';
        return `${stackBB}bb`;
    }
    // Divide by 100 when displaying as chips
    return (effectiveStack / 100).toLocaleString();
};

/**
 * Extracts and formats tournament name from solution filename
 */
export const getTournamentName = (solutionFileName?: string): string => {
    if (!solutionFileName) return '';
    
    const fileName = solutionFileName.toLowerCase();
    
    // Extract tournament type and value
    if (fileName.includes('speed32')) return 'Speed Racer $32';
    if (fileName.includes('speed50')) return 'Speed Racer $50';
    if (fileName.includes('speed108')) return 'Speed Racer $108';
    if (fileName.includes('speed20')) return 'Speed Racer $20';
    if (fileName.includes('speed')) return 'Speed Racer';
    
    // Fallback: try to extract numeric value
    const match = fileName.match(/\$?(\d+)/);
    if (match) {
        return `Tournament $${match[1]}`;
    }
    
    return 'Tournament';
};

/**
 * Calculates total pot (SB + BB + antes)
 */
export const calculateTotalPot = (
    smallBlind: number,
    bigBlind: number,
    ante: number,
    numPlayers: number
): number => {
    return smallBlind + bigBlind + (ante * numPlayers);
};

/**
 * Determines if a player has folded
 */
export const hasPlayerFolded = (
    playerIndex: number,
    heroPosition: number
): boolean => {
    // If it's the hero, they haven't folded
    if (playerIndex === heroPosition) return false;
    
    // Players before the hero in action order have folded
    // Order is circular, starts at 0 and goes to heroPosition
    if (playerIndex < heroPosition) return true;
    
    return false;
};

/**
 * Calculates player bet amount based on position and actions
 */
export const calculatePlayerBet = (
    index: number,
    isRaiser: boolean,
    isShover: boolean,
    isMultiwayShover: boolean,
    isAutoAllin: boolean,
    isBB: boolean,
    isSB: boolean,
    stack: number,
    bigBlind: number,
    smallBlind: number,
    ante: number,
    totalPot: number,
    villainAction?: VillainAction
): number => {
    let playerBet = 0;
    
    // For "Any" type, use villain action amount
    if (villainAction && villainAction.amount !== undefined) {
        playerBet = villainAction.amount;
        
        // If it's a Call and player is SB or BB, add initial blind
        if (villainAction.action === 'Call') {
            if (isSB) {
                playerBet += smallBlind; // SB call = 0.5 BB (blind) + 0.5 BB (call) = 1 BB
            } else if (isBB) {
                playerBet += bigBlind; // BB call = 1 BB (blind) + additional call
            }
        }
    }
    // Raiser and Shovers always show bet (regardless of pot)
    else if (isRaiser) {
        playerBet = bigBlind * 2;
    } else if (isShover || isMultiwayShover) {
        playerBet = stack;
    } else if (isAutoAllin) {
        // Player with negative/zero stack: automatic all-in (pays only ante)
        playerBet = ante;
    } else if (totalPot > 0) {
        // Blinds only appear if there's a pot
        if (isBB) {
            playerBet = bigBlind;
        } else if (isSB) {
            playerBet = smallBlind;
        }
    }
    
    return playerBet;
};
