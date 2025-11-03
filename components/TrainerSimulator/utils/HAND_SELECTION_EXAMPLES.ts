/**
 * Hand Selection Utilities - Usage Examples
 * 
 * Demonstrates how to use the hand filtering and combo selection functions
 * to generate appropriate training spots.
 */

import type { NodeData } from '../../../types';
import {
    getPlayedHands,
    filterHandsByEV,
    filterHandsByWorstEV,
    filterNonMarginalHands,
    selectTrainingHands,
    getHandNameFromCombo,
    selectRandomCombo
} from './handSelection';
import allCombos from '../../../combos.json';

/**
 * Example 1: Basic hand filtering workflow
 */
function example1_BasicFiltering(node: NodeData) {
    // Step 1: Get all hands that have at least one action played
    const playedHands = getPlayedHands(node);
    console.log(`Found ${playedHands.length} played hands`);
    
    // Step 2: Filter to difficult hands (EV between -0.5 and +1.5 BB)
    const difficultHands = filterHandsByEV(node, playedHands);
    console.log(`Found ${difficultHands.length} difficult hands`);
    
    // Step 3: Remove non-marginal decisions (EV diff < 0.05)
    const marginalHands = filterNonMarginalHands(node, difficultHands);
    console.log(`Found ${marginalHands.length} marginal hands`);
    
    return marginalHands;
}

/**
 * Example 2: Using the smart cascade filter
 */
function example2_SmartFiltering(node: NodeData) {
    // This function automatically applies the best filter cascade
    const trainingHands = selectTrainingHands(node);
    
    // selectTrainingHands tries:
    // 1. Marginal hands (EV diff > 0.05) from difficult range
    // 2. If too few, uses all difficult hands
    // 3. If still too few, uses worst 30% of all played hands
    // 4. Fallback: all played hands
    
    if (trainingHands.length === 0) {
        console.error('No training hands available in this node');
        return null;
    }
    
    return trainingHands;
}

/**
 * Example 3: Selecting a random hand and combo
 */
function example3_SelectRandomHandAndCombo(node: NodeData) {
    // Get appropriate training hands
    const trainingHands = selectTrainingHands(node);
    
    if (trainingHands.length === 0) return null;
    
    // Select random hand
    const randomIndex = Math.floor(Math.random() * trainingHands.length);
    const handName = trainingHands[randomIndex];
    
    // Get a specific combo for this hand
    const combo = selectRandomCombo(handName, allCombos);
    
    if (!combo) {
        console.error(`No combos found for hand ${handName}`);
        return null;
    }
    
    console.log(`Selected ${handName} with combo ${combo}`);
    return { handName, combo };
}

/**
 * Example 4: Working with worst EV hands (fallback)
 */
function example4_WorstEVFallback(node: NodeData) {
    const playedHands = getPlayedHands(node);
    
    // If normal filtering produces too few results, use worst EV hands
    const difficultHands = filterHandsByEV(node, playedHands);
    
    if (difficultHands.length < 10) {
        console.log('Too few difficult hands, using worst EV fallback');
        const worstHands = filterHandsByWorstEV(node, playedHands);
        return worstHands;
    }
    
    return difficultHands;
}

/**
 * Example 5: Converting combo to hand name
 */
function example5_ComboToHandName() {
    const examples = [
        'AsKh', // AKo
        'AsKs', // AKs
        '7h7d', // 77
        'Ts9s', // T9s
        'Qc8d', // Q8o
    ];
    
    examples.forEach(combo => {
        const handName = getHandNameFromCombo(combo);
        console.log(`${combo} → ${handName}`);
    });
    
    // Output:
    // AsKh → AKo
    // AsKs → AKs
    // 7h7d → 77
    // Ts9s → T9s
    // Qc8d → Q8o
}

/**
 * Example 6: Full spot generation workflow
 */
function example6_FullSpotGeneration(node: NodeData) {
    // 1. Get training hands using smart filtering
    const trainingHands = selectTrainingHands(node);
    
    if (trainingHands.length === 0) {
        throw new Error('No training hands available');
    }
    
    // 2. Select random hand
    const randomIndex = Math.floor(Math.random() * trainingHands.length);
    const handName = trainingHands[randomIndex];
    
    // 3. Select random combo
    const combo = selectRandomCombo(handName, allCombos);
    
    if (!combo) {
        throw new Error(`No combos found for hand ${handName}`);
    }
    
    // 4. Log detailed info
    const handData = node.hands[handName];
    if (handData && handData.evs) {
        const validEvs = handData.evs.filter((ev, idx) => handData.played[idx] > 0);
        if (validEvs.length >= 2) {
            const sortedEvs = [...validEvs].sort((a, b) => b - a);
            const evDiff = sortedEvs[0] - sortedEvs[1];
            console.log(`Selected ${handName} (${combo})`);
            console.log(`Best EV: ${sortedEvs[0].toFixed(2)} BB`);
            console.log(`2nd best EV: ${sortedEvs[1].toFixed(2)} BB`);
            console.log(`EV difference: ${evDiff.toFixed(2)} BB`);
        }
    }
    
    return { handName, combo };
}

/**
 * Example 7: Debugging hand selection
 */
function example7_DebugHandSelection(node: NodeData) {
    console.log('=== Hand Selection Debug ===');
    
    const playedHands = getPlayedHands(node);
    console.log(`1. Played hands: ${playedHands.length}`);
    
    const difficultHands = filterHandsByEV(node, playedHands);
    console.log(`2. Difficult hands (EV -0.5 to +1.5): ${difficultHands.length}`);
    
    const marginalHands = filterNonMarginalHands(node, difficultHands);
    console.log(`3. Marginal hands (EV diff > 0.05): ${marginalHands.length}`);
    
    const worstHands = filterHandsByWorstEV(node, playedHands);
    console.log(`4. Worst 30% hands: ${worstHands.length}`);
    
    // Show which filter will be used
    if (marginalHands.length > 0) {
        console.log('✅ Will use: Marginal hands');
    } else if (difficultHands.length > 0) {
        console.log('⚠️ Will use: Difficult hands (no marginal)');
    } else {
        console.log('⚠️ Will use: Worst EV hands (fallback)');
    }
}

// Export examples for documentation
export {
    example1_BasicFiltering,
    example2_SmartFiltering,
    example3_SelectRandomHandAndCombo,
    example4_WorstEVFallback,
    example5_ComboToHandName,
    example6_FullSpotGeneration,
    example7_DebugHandSelection
};
