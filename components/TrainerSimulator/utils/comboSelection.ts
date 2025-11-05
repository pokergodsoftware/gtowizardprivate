/**
 * Combo Selection Utilities
 * 
 * Functions for selecting specific combos that provide interesting training spots.
 * Filters combos based on EV ranges - both positive and negative EVs are valuable for training.
 * 
 * Logic:
 * - If hero has 2 actions: Check if EV is in range (+1.00 to +0.07) OR (-0.07 to -1.00)
 * - If hero has ≥3 actions: Find most used action, check if its EV is in range
 * 
 * Created to improve training quality by focusing on marginal decisions.
 */

import type { NodeData } from '../../../types';

/**
 * Configuration for combo selection
 */
export interface ComboSelectionConfig {
    /** Minimum positive EV (default: 0.07) */
    minPositiveEV?: number;
    /** Maximum positive EV (default: 1.00) */
    maxPositiveEV?: number;
    /** Minimum negative EV (default: -1.00) */
    minNegativeEV?: number;
    /** Maximum negative EV (default: -0.07) */
    maxNegativeEV?: number;
}

const DEFAULT_CONFIG: Required<ComboSelectionConfig> = {
    minPositiveEV: 0.07,
    maxPositiveEV: 1.00,
    minNegativeEV: -1.00,
    maxNegativeEV: -0.07
};

/**
 * Checks if a combo has EV within the desired training range
 * 
 * NEW LOGIC:
 * 
 * **2 Actions Available:**
 * - Check if EV is in POSITIVE range (+0.07 to +1.00)
 * - OR check if EV is in NEGATIVE range (-1.00 to -0.07)
 * 
 * **3+ Actions Available:**
 * - Find the MOST USED action (highest frequency)
 * - Check if that action's EV is in POSITIVE or NEGATIVE range
 * 
 * This filters out:
 * - Near-zero EV spots (-0.06 to +0.06) - too marginal
 * - Extreme EV spots (< -1.00 or > +1.00) - too obvious
 * 
 * Examples that PASS:
 * - 2 actions: Fold EV: -0.15, Raise EV: 0.50 ✅ (positive range)
 * - 2 actions: Fold EV: 0.10, Call EV: -0.20 ✅ (negative range)
 * - 3 actions: Most used is Raise (60%) with EV: 0.80 ✅ (positive range)
 * - 3 actions: Most used is Fold (50%) with EV: -0.50 ✅ (negative range)
 * 
 * Examples that FAIL:
 * - 2 actions: All EVs between -0.06 and +0.06 ❌ (too marginal)
 * - 3 actions: Most used action EV: 2.50 ❌ (too high)
 * - 3 actions: Most used action EV: 0.05 ❌ (too low positive)
 * 
 * @param handName - Name of the hand (e.g., "AKo")
 * @param combo - Specific combo (e.g., "AhKd")
 * @param node - Current decision tree node
 * @param config - Configuration for selection
 * @returns true if combo EV is within training range
 */
export function isInterestingCombo(
    handName: string,
    combo: string,
    node: NodeData,
    config: ComboSelectionConfig = {}
): boolean {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    
    const handData = node.hands[handName];
    if (!handData) return false;
    
    // Check EV range if EVs are available
    if (!handData.evs || handData.evs.length === 0) {
        return true; // No EV data, allow combo
    }
    
    const numActions = node.actions.length;
    
    // Case 1: Exactly 2 actions
    if (numActions === 2) {
        // Check if ANY action's EV is in valid range (positive or negative)
        for (const ev of handData.evs) {
            const inPositiveRange = ev >= cfg.minPositiveEV && ev <= cfg.maxPositiveEV;
            const inNegativeRange = ev >= cfg.minNegativeEV && ev <= cfg.maxNegativeEV;
            
            if (inPositiveRange || inNegativeRange) {
                return true; // At least one action in range
            }
        }
        return false; // No action in valid range
    }
    
    // Case 2: 3 or more actions
    if (numActions >= 3) {
        // Find most used action (highest frequency)
        let mostUsedActionIndex = 0;
        let maxFrequency = handData.played[0] || 0;
        
        for (let i = 1; i < handData.played.length; i++) {
            if (handData.played[i] > maxFrequency) {
                maxFrequency = handData.played[i];
                mostUsedActionIndex = i;
            }
        }
        
        // Check if most used action's EV is in range
        const mostUsedEV = handData.evs[mostUsedActionIndex];
        const inPositiveRange = mostUsedEV >= cfg.minPositiveEV && mostUsedEV <= cfg.maxPositiveEV;
        const inNegativeRange = mostUsedEV >= cfg.minNegativeEV && mostUsedEV <= cfg.maxNegativeEV;
        
        return inPositiveRange || inNegativeRange;
    }
    
    return true; // Default: allow combo
}

/**
 * Selects a random combo with EV in training range
 * 
 * NEW LOGIC:
 * - For 2 actions: Filters combos where any action EV is in positive (+0.07 to +1.00) or negative (-1.00 to -0.07) range
 * - For 3+ actions: Filters combos where most used action EV is in valid range
 * 
 * Falls back to random combo if no combos in range found.
 * 
 * Examples that PASS filter (2 actions):
 * - AhKd: Fold EV: -0.15, Raise EV: 0.50 ✅
 * - QsJc: Fold EV: 0.10, Call EV: -0.20 ✅
 * 
 * Examples that PASS filter (3+ actions):
 * - 7s6c: Most used is Raise (60%) with EV: 0.80 ✅
 * - KsJh: Most used is Fold (50%) with EV: -0.50 ✅
 * 
 * Examples that FAIL filter:
 * - 72o: All EVs between -0.06 and +0.06 ❌ (too marginal)
 * - AAh: Best EV: 2.50 ❌ (too high)
 * 
 * @param handName - Name of the hand (e.g., "AKo")
 * @param combos - Available combos for this hand
 * @param node - Current decision tree node
 * @param config - Configuration for selection
 * @returns Selected combo or null if hand not found
 */
export function selectInterestingCombo(
    handName: string,
    combos: string[],
    node: NodeData,
    config: ComboSelectionConfig = {}
): string | null {
    if (!combos || combos.length === 0) return null;
    
    // Filter interesting combos
    const interestingCombos = combos.filter(combo =>
        isInterestingCombo(handName, combo, node, config)
    );
    
    // If we have interesting combos, select one randomly
    if (interestingCombos.length > 0) {
        const randomIndex = Math.floor(Math.random() * interestingCombos.length);
        return interestingCombos[randomIndex];
    }
    
    // NO FALLBACK: Return null to force selecting a different hand
    // This ensures we only train on spots with EV in the desired range
    console.log(`⚠️ No combos in EV range for hand ${handName}, returning null to try another hand`);
    return null;
}

/**
 * Finds hands that have at least one interesting combo
 * 
 * Useful for pre-filtering hand ranges before spot generation.
 * 
 * @param node - Current decision tree node
 * @param allCombos - All available combos (flat or grouped by hand)
 * @param config - Configuration for selection
 * @returns Array of hand names with interesting combos
 */
export function getHandsWithInterestingCombos(
    node: NodeData,
    allCombos: string[] | string[][],
    config: ComboSelectionConfig = {}
): string[] {
    const handsWithCombos: string[] = [];
    
    // Handle flat array of combos
    if (allCombos.length > 0 && typeof allCombos[0] === 'string') {
        const flatCombos = allCombos as string[];
        
        for (const handName of Object.keys(node.hands)) {
            const handData = node.hands[handName];
            
            // Check if any combo for this hand is interesting
            // For simplicity, we check the hand itself (all combos share same strategy)
            const hasInteresting = isInterestingCombo(handName, '', node, config);
            
            if (hasInteresting) {
                handsWithCombos.push(handName);
            }
        }
    }
    
    return handsWithCombos;
}

/**
 * Gets diagnostic info about combo's EV
 * 
 * Useful for debugging combo selection with new logic.
 * 
 * @param handName - Name of the hand
 * @param node - Current decision tree node
 * @returns Diagnostic information including action count and most used action
 */
export function getComboSelectionDiagnostics(
    handName: string,
    node: NodeData
): {
    exists: boolean;
    numActions: number;
    allEVs?: number[];
    mostUsedAction?: { action: string; freq: number; ev: number };
    frequencies: Array<{ action: string; freq: number; ev?: number }>;
    passesEVFilter: boolean;
    reason?: string;
} {
    const handData = node.hands[handName];
    
    if (!handData) {
        return {
            exists: false,
            numActions: 0,
            frequencies: [],
            passesEVFilter: false,
            reason: 'Hand not found'
        };
    }
    
    const numActions = node.actions.length;
    const allEVs = handData.evs && handData.evs.length > 0 ? handData.evs : undefined;
    
    const frequencies = node.actions.map((action, i) => ({
        action: action.type,
        freq: handData.played[i] || 0,
        ev: allEVs ? allEVs[i] : undefined
    }));
    
    // Find most used action
    let mostUsedAction: { action: string; freq: number; ev: number } | undefined;
    if (numActions >= 3 && handData.played && allEVs) {
        let maxFreqIndex = 0;
        let maxFreq = handData.played[0] || 0;
        
        for (let i = 1; i < handData.played.length; i++) {
            if (handData.played[i] > maxFreq) {
                maxFreq = handData.played[i];
                maxFreqIndex = i;
            }
        }
        
        mostUsedAction = {
            action: node.actions[maxFreqIndex].type,
            freq: maxFreq,
            ev: allEVs[maxFreqIndex]
        };
    }
    
    const passesEVFilter = isInterestingCombo(handName, '', node, {});
    
    // Determine reason for pass/fail
    let reason = '';
    if (!allEVs) {
        reason = 'No EV data available';
    } else if (numActions === 2) {
        const hasValidEV = allEVs.some(ev => 
            (ev >= 0.07 && ev <= 1.00) || (ev >= -1.00 && ev <= -0.07)
        );
        reason = hasValidEV 
            ? `2 actions: At least one EV in range (${allEVs.join(', ')})`
            : `2 actions: No EV in range (${allEVs.join(', ')})`;
    } else if (numActions >= 3 && mostUsedAction) {
        const ev = mostUsedAction.ev;
        const inRange = (ev >= 0.07 && ev <= 1.00) || (ev >= -1.00 && ev <= -0.07);
        reason = inRange
            ? `3+ actions: Most used (${mostUsedAction.action}) EV in range (${ev.toFixed(2)})`
            : `3+ actions: Most used (${mostUsedAction.action}) EV out of range (${ev.toFixed(2)})`;
    }
    
    return {
        exists: true,
        numActions,
        allEVs,
        mostUsedAction,
        frequencies,
        passesEVFilter,
        reason
    };
}
