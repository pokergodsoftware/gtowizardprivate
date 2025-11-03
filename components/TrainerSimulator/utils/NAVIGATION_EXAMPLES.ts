/**
 * Navigation Utilities Usage Examples
 * 
 * Demonstrates how to use the navigation utilities for spot generation.
 * Reference only - do not import in production code.
 */

import type { AppData } from '../../../types.ts';
import {
    loadNodeIfNeeded,
    foldUntilPosition,
    findValidRaiser,
    findValidShover,
    navigateToHeroPosition,
    findRaiseAction,
    findAllInAction,
    type LoadNodesFunction
} from './navigationUtils.ts';

// ========================================
// Example 1: Loading a Node If Needed
// ========================================
async function example1_LoadNode(
    solution: AppData,
    nodeId: number,
    loadNodes: LoadNodesFunction
) {
    const updated = await loadNodeIfNeeded(
        solution,
        nodeId,
        solution.id,
        loadNodes
    );

    if (updated) {
        console.log('✅ Node loaded successfully');
        return updated;
    } else {
        console.log('❌ Failed to load node');
        return null;
    }
}

// ========================================
// Example 2: Finding a Valid Raiser
// ========================================
async function example2_FindRaiser(
    solution: AppData,
    loadNodes: LoadNodesFunction
) {
    const numPlayers = solution.settings.handdata.stacks.length;
    const bbPosition = numPlayers - 1;
    const bigBlind = Math.max(
        solution.settings.handdata.blinds[0],
        solution.settings.handdata.blinds[1]
    );

    // Possible raiser positions (UTG to BTN)
    const possibleRaisers = Array.from(
        { length: numPlayers - 3 },
        (_, i) => i
    );

    const raiserPosition = await findValidRaiser({
        possiblePositions: possibleRaisers,
        solution,
        originalSolutionId: solution.id,
        loadNodes,
        bigBlind
    });

    if (raiserPosition !== null) {
        console.log(`✅ Found raiser at position ${raiserPosition}`);
        return raiserPosition;
    } else {
        console.log('❌ No valid raiser found');
        return null;
    }
}

// ========================================
// Example 3: Folding Until Hero Position
// ========================================
async function example3_FoldToHero(
    solution: AppData,
    heroPosition: number,
    loadNodes: LoadNodesFunction
) {
    const result = await foldUntilPosition(
        0, // Start from root node
        heroPosition,
        solution,
        solution.id,
        loadNodes
    );

    if (result) {
        console.log(`✅ Reached hero at node ${result.nodeId}`);
        return result;
    } else {
        console.log('❌ Failed to reach hero');
        return null;
    }
}

// ========================================
// Example 4: Complex Navigation (vs Open)
// ========================================
async function example4_NavigateVsOpen(
    solution: AppData,
    heroPosition: number,
    raiserPosition: number,
    loadNodes: LoadNodesFunction
) {
    const bigBlind = Math.max(
        solution.settings.handdata.blinds[0],
        solution.settings.handdata.blinds[1]
    );

    const result = await navigateToHeroPosition(
        0, // Start from root
        heroPosition,
        solution,
        solution.id,
        loadNodes,
        {
            raiserPosition,
            bigBlind
        }
    );

    if (result) {
        console.log(`✅ Navigated to hero (vs Open)`);
        console.log(`   Hero position: ${heroPosition}`);
        console.log(`   Raiser position: ${raiserPosition}`);
        console.log(`   Final node: ${result.nodeId}`);
        return result;
    } else {
        console.log('❌ Navigation failed');
        return null;
    }
}

// ========================================
// Example 5: Multiway Shove Navigation
// ========================================
async function example5_NavigateMultiwayShove(
    solution: AppData,
    heroPosition: number,
    shoverPositions: number[],
    loadNodes: LoadNodesFunction
) {
    const bigBlind = Math.max(
        solution.settings.handdata.blinds[0],
        solution.settings.handdata.blinds[1]
    );

    const result = await navigateToHeroPosition(
        0,
        heroPosition,
        solution,
        solution.id,
        loadNodes,
        {
            shoverPositions,
            bigBlind
        }
    );

    if (result) {
        console.log(`✅ Navigated to hero (vs Multiway Shove)`);
        console.log(`   Hero position: ${heroPosition}`);
        console.log(`   Shover positions: [${shoverPositions}]`);
        console.log(`   Final node: ${result.nodeId}`);
        return result;
    } else {
        console.log('❌ Navigation failed');
        return null;
    }
}

// ========================================
// Example 6: Finding Specific Actions
// ========================================
function example6_FindActions(solution: AppData) {
    const node = solution.nodes.get(0);
    if (!node) return;

    const bigBlind = Math.max(
        solution.settings.handdata.blinds[0],
        solution.settings.handdata.blinds[1]
    );

    const playerStack = solution.settings.handdata.stacks[0];

    // Find 2BB raise
    const raiseIndex = findRaiseAction(node.actions, 2.0, bigBlind);
    if (raiseIndex !== -1) {
        console.log('✅ Found 2BB raise action');
    }

    // Find all-in
    const allinIndex = findAllInAction(node.actions, playerStack);
    if (allinIndex !== -1) {
        console.log('✅ Found all-in action');
    }
}

// ========================================
// Complete Spot Generation Example
// ========================================
async function example7_CompleteSpotGeneration(
    solution: AppData,
    spotType: 'RFI' | 'vs Open' | 'vs Shove',
    loadNodes: LoadNodesFunction
) {
    const numPlayers = solution.settings.handdata.stacks.length;
    const bigBlind = Math.max(
        solution.settings.handdata.blinds[0],
        solution.settings.handdata.blinds[1]
    );

    console.log(`\n🎲 Generating ${spotType} spot...`);

    // Step 1: Determine hero position
    const heroPosition = Math.floor(Math.random() * (numPlayers - 2)) + 1;
    console.log(`Hero position: ${heroPosition}`);

    let result;

    if (spotType === 'RFI') {
        // RFI: Just fold to hero
        result = await foldUntilPosition(
            0,
            heroPosition,
            solution,
            solution.id,
            loadNodes
        );
    } else if (spotType === 'vs Open') {
        // vs Open: Find raiser, then navigate
        const possibleRaisers = Array.from(
            { length: heroPosition },
            (_, i) => i
        );

        const raiserPosition = await findValidRaiser({
            possiblePositions: possibleRaisers,
            solution,
            originalSolutionId: solution.id,
            loadNodes,
            bigBlind
        });

        if (!raiserPosition) {
            console.log('❌ No valid raiser found');
            return null;
        }

        result = await navigateToHeroPosition(
            0,
            heroPosition,
            solution,
            solution.id,
            loadNodes,
            { raiserPosition, bigBlind }
        );
    } else if (spotType === 'vs Shove') {
        // vs Shove: Find shover, then navigate
        const possibleShovers = Array.from(
            { length: heroPosition },
            (_, i) => i
        );

        const shoverPosition = await findValidShover({
            possiblePositions: possibleShovers,
            solution,
            originalSolutionId: solution.id,
            loadNodes,
            bigBlind
        });

        if (!shoverPosition) {
            console.log('❌ No valid shover found');
            return null;
        }

        result = await navigateToHeroPosition(
            0,
            heroPosition,
            solution,
            solution.id,
            loadNodes,
            { raiserPosition: shoverPosition, bigBlind }
        );
    }

    if (result) {
        console.log(`✅ ${spotType} spot generated successfully!`);
        return {
            nodeId: result.nodeId,
            solution: result.solution,
            heroPosition
        };
    } else {
        console.log(`❌ Failed to generate ${spotType} spot`);
        return null;
    }
}

// ========================================
// Key Takeaways
// ========================================
//
// 1. **Always check return values**
//    - All navigation functions return null on failure
//    - Handle errors gracefully
//
// 2. **Load nodes as needed**
//    - Use loadNodeIfNeeded before accessing nodes
//    - Pass correct originalSolutionId
//
// 3. **Validation is built-in**
//    - findValidRaiser checks if 2BB raise exists
//    - findValidShover checks if all-in exists
//
// 4. **Flexible navigation**
//    - navigateToHeroPosition handles complex scenarios
//    - Specify raiser/shover roles via options
//
// 5. **Type safety**
//    - All functions fully typed
//    - Use NavigationResult type for results
//
// ========================================

export {
    example1_LoadNode,
    example2_FindRaiser,
    example3_FoldToHero,
    example4_NavigateVsOpen,
    example5_NavigateMultiwayShove,
    example6_FindActions,
    example7_CompleteSpotGeneration
};
