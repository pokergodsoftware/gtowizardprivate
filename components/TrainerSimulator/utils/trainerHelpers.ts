/**
 * TrainerSimulator Helper Utilities
 * 
 * Pure helper functions with no dependencies on React state.
 * Extracted from TrainerSimulator.tsx during Phase 1 refactoring.
 */

import type { AppData } from '../../../types.ts';

/**
 * Calculates the initial bounty based on the solution filename
 * @param solutionFileName - The filename of the solution (e.g., "speed32_1")
 * @returns The initial bounty value
 */
export const getInitialBounty = (solutionFileName: string): number => {
    const fileName = solutionFileName.toLowerCase();
    if (fileName.includes('speed32')) return 7.5;
    if (fileName.includes('speed50')) return 12.5;
    if (fileName.includes('speed108')) return 25;
    if (fileName.includes('speed20')) return 5;
    return 7.5; // Default
};

/**
 * Formats bounty display based on show mode
 * @param bounty - The bounty value (in chips)
 * @param showInDollars - Whether to show in dollars (true) or as multiplier (false)
 * @param solutionFileName - The solution filename for calculating multiplier
 * @returns Formatted bounty string (e.g., "$3.75" or "0.5x")
 */
export const formatBounty = (
    bounty: number, 
    showInDollars: boolean,
    solutionFileName: string
): string => {
    const actualBounty = bounty / 2; // Bounty real em dólar
    
    if (showInDollars) {
        // Modo $: exibir em dólar
        return `$${actualBounty.toFixed(2)}`;
    } else {
        // Modo x: exibir como multiplicador do bounty inicial
        const initialBounty = getInitialBounty(solutionFileName);
        const multiplier = actualBounty / initialBounty;
        return `${multiplier.toFixed(1)}x`;
    }
};

/**
 * Calculates the average stack in big blinds for all players
 * @param solution - The AppData solution containing settings
 * @returns Average stack in BB
 */
export const getAverageStackBB = (solution: AppData): number => {
    const stacks = solution.settings.handdata.stacks;
    const blinds = solution.settings.handdata.blinds;
    const bigBlind = Math.max(blinds[0], blinds[1]);
    const avgStack = stacks.reduce((a, b) => a + b, 0) / stacks.length;
    return avgStack / bigBlind;
};
