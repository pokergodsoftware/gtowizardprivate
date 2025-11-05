/**
 * Hand Selection Utilities
 * 
 * Functions for filtering and selecting poker hands based on various criteria
 * such as frequency, EV ranges, and marginal decision thresholds.
 * 
 * Part of TrainerSimulator refactoring - Phase 4
 */

import type { NodeData, HandData } from '../../../types';

/**
 * Minimum EV difference between best and second-best action (in BB)
 * to consider a hand as having a "clear" decision (non-marginal)
 */
const MIN_EV_DIFF = 0.05;

/**
 * Filters hands to only include those that have at least one action played (freq > 0)
 * 
 * @param node - Current decision tree node
 * @returns Array of hand names that are played in the current node
 * 
 * @example
 * const playedHands = getPlayedHands(node);
 * console.log(`${playedHands.length} hands are played`);
 */
export function getPlayedHands(node: NodeData): string[] {
    return Object.keys(node.hands).filter(handName => {
        const handData = node.hands[handName];
        const totalFreq = handData.played.reduce((sum, freq) => sum + freq, 0);
        return totalFreq > 0;
    });
}

/**
 * Filters hands by EV range suitable for training difficult spots
 * 
 * Keeps hands where:
 * - EV is between -2.00 BB and +2.00 BB (challenging range)
 * - Excludes "trivial" range between -0.07 and +0.07 BB (too easy/neutral)
 * - Has at least 2 valid actions (creates decision complexity)
 * 
 * @param node - Current decision tree node
 * @param handNames - Array of hand names to filter
 * @returns Array of hand names within the EV range
 * 
 * @example
 * const playedHands = getPlayedHands(node);
 * const difficultHands = filterHandsByEV(node, playedHands);
 */
export function filterHandsByEV(node: NodeData, handNames: string[]): string[] {
    return handNames.filter(handName => {
        const handData = node.hands[handName];
        if (!handData.evs) return false;

        // Count valid actions (played > 0)
        const validActions = handData.played.filter(freq => freq > 0).length;
        if (validActions < 2) return false;

        // Get EVs for valid actions
        const validEvs = handData.evs.filter((_, idx) => handData.played[idx] > 0);
        const bestEv = Math.max(...validEvs);

        // Keep hands with EV between -2.00 and +2.00 BB, but exclude neutral range (-0.07 to +0.07)
        const inRange = bestEv >= -2.0 && bestEv <= 2.0;
        const notTrivial = bestEv < -0.07 || bestEv > 0.07;
        
        return inRange && notTrivial;
    });
}

/**
 * Filters hands to get the "worst" performing hands for training
 * 
 * Takes the bottom 30% of hands by EV (min 5, max 50 hands).
 * Used as a fallback when other filters produce too few results.
 * 
 * @param node - Current decision tree node
 * @param handNames - Array of hand names to filter
 * @returns Array of hand names with worst EVs
 * 
 * @example
 * const playedHands = getPlayedHands(node);
 * const worstHands = filterHandsByWorstEV(node, playedHands);
 */
export function filterHandsByWorstEV(node: NodeData, handNames: string[]): string[] {
    // Sort hands by best EV (ascending)
    const sortedByEV = [...handNames].sort((a, b) => {
        const aHandData = node.hands[a];
        const bHandData = node.hands[b];
        
        if (!aHandData.evs || !bHandData.evs) return 0;
        
        const aValidEvs = aHandData.evs.filter((_, idx) => aHandData.played[idx] > 0);
        const bValidEvs = bHandData.evs.filter((_, idx) => bHandData.played[idx] > 0);
        
        const aBestEv = aValidEvs.length > 0 ? Math.max(...aValidEvs) : -999;
        const bBestEv = bValidEvs.length > 0 ? Math.max(...bValidEvs) : -999;
        
        return aBestEv - bBestEv;
    });

    // Take bottom 30% (min 5, max 50)
    const count = Math.min(50, Math.max(5, Math.floor(sortedByEV.length * 0.3)));
    return sortedByEV.slice(0, count);
}

/**
 * Filters hands to only include "marginal" decisions
 * 
 * A marginal hand is one where the EV difference between the best action
 * and the second-best action is greater than MIN_EV_DIFF (0.05 BB).
 * This creates more interesting training spots.
 * 
 * @param node - Current decision tree node
 * @param handNames - Array of hand names to filter
 * @returns Array of hand names with marginal decisions
 * 
 * @example
 * const difficultHands = filterHandsByEV(node, playedHands);
 * const marginalHands = filterNonMarginalHands(node, difficultHands);
 */
export function filterNonMarginalHands(node: NodeData, handNames: string[]): string[] {
    return handNames.filter(handName => {
        const handData = node.hands[handName];
        if (!handData.evs) return false;

        // Get EVs for valid actions only
        const validEvs = handData.evs.filter((_, idx) => handData.played[idx] > 0);
        if (validEvs.length < 2) return false;

        // Sort EVs descending
        const sortedEvs = [...validEvs].sort((a, b) => b - a);
        const evDiff = sortedEvs[0] - sortedEvs[1];

        // Keep hands where the decision is NOT too obvious
        return evDiff > MIN_EV_DIFF;
    });
}

/**
 * Gets the poker hand name from a combo string
 * 
 * Converts a 4-character combo (e.g., "7s5h") into a hand name (e.g., "75o").
 * Handles pairs, suited, and offsuit hands correctly.
 * 
 * @param combo - 4-character combo string (e.g., "AsKh")
 * @returns Hand name in standard format (e.g., "AKo", "77", "AKs")
 * 
 * @example
 * getHandNameFromCombo("AsKh") // Returns "AKo"
 * getHandNameFromCombo("7s7h") // Returns "77"
 * getHandNameFromCombo("AsKs") // Returns "AKs"
 */
export function getHandNameFromCombo(combo: string): string {
    const rank1 = combo[0];
    const rank2 = combo[2];
    const suit1 = combo[1];
    const suit2 = combo[3];
    
    // Pair (e.g., "77")
    if (rank1 === rank2) {
        return `${rank1}${rank2}`;
    }
    
    // Suited (e.g., "AKs")
    if (suit1 === suit2) {
        return `${rank1}${rank2}s`;
    }
    
    // Offsuit (e.g., "AKo")
    return `${rank1}${rank2}o`;
}

/**
 * Selects a random combo from the available combos for a specific hand
 * 
 * @param handName - The hand name (e.g., "AKo", "77", "ATs")
 * @param allCombos - Nested array of combos (will be flattened)
 * @returns A random combo string (e.g., "AsKh") or null if no combos found
 * 
 * @example
 * const combo = selectRandomCombo("AKo", allCombos);
 * if (combo) {
 *   console.log(`Selected ${combo} from AKo`);
 * }
 */
export function selectRandomCombo(
    handName: string,
    allCombos: any
): string | null {
    // Flatten the array (handles nested or flat arrays)
    const flatCombos = Array.isArray(allCombos[0]) ? allCombos.flat() : allCombos;
    
    // Filter combos that belong to this hand
    const handCombos = flatCombos.filter((combo: string) => {
        const comboHand = getHandNameFromCombo(combo);
        
        // Check if combo matches hand (handles reversed ranks like "KA" vs "AK")
        const rank1 = combo[0];
        const rank2 = combo[2];
        const reversedHand = rank1 !== rank2 
            ? `${rank2}${rank1}${comboHand.slice(-1)}` 
            : comboHand;
        
        return comboHand === handName || reversedHand === handName;
    });
    
    if (handCombos.length === 0) {
        console.error('No combos found for hand:', handName);
        return null;
    }
    
    // Select random combo
    const randomIndex = Math.floor(Math.random() * handCombos.length);
    return handCombos[randomIndex];
}

/**
 * Applies a cascade of filters to select appropriate training hands
 * 
 * Tries filters in order of priority:
 * 1. Played hands → Filter by EV → Remove non-marginal → Use result
 * 2. If too few, use only played + EV filter
 * 3. If still too few, use worst EV hands
 * 4. If all else fails, use all played hands
 * 
 * @param node - Current decision tree node
 * @returns Array of hand names suitable for training
 * 
 * @example
 * const hands = selectTrainingHands(node);
 * const randomHand = hands[Math.floor(Math.random() * hands.length)];
 */
export function selectTrainingHands(node: NodeData): string[] {
    // 1. Start with all played hands
    const playedHands = getPlayedHands(node);
    console.log(`📊 Total played hands: ${playedHands.length}`);
    
    if (playedHands.length === 0) {
        console.error('No played hands found in node');
        return [];
    }
    
    // 2. Filter by EV range (-2.0 to +2.0 BB, excluding -0.07 to +0.07)
    const difficultHands = filterHandsByEV(node, playedHands);
    console.log(`🎯 Hands in EV range [-2.0, +2.0] (excluding trivial -0.07 to +0.07) with 2+ actions: ${difficultHands.length}`);
    
    // 3. Filter non-marginal decisions (EV diff > 0.05)
    const marginalHands = filterNonMarginalHands(node, difficultHands);
    console.log(`⚖️ Marginal hands (EV diff > 0.05): ${marginalHands.length}`);
    
    // 4. Decide which filter result to use
    if (marginalHands.length > 0) {
        console.log('✅ Using marginal hands');
        return marginalHands;
    } else if (difficultHands.length > 0) {
        console.log('⚠️ Using difficult hands (no marginal filter)');
        return difficultHands;
    } else {
        // Fallback: use worst EV hands
        const worstHands = filterHandsByWorstEV(node, playedHands);
        console.log(`⚠️ Fallback: using ${worstHands.length} worst EV hands`);
        return worstHands;
    }
}
