/**
 * Spot Generators - Usage Examples
 * 
 * Demonstrates how to use each spot generator function.
 */

import type { AppData } from '../../../../types';
import {
    generateRFISpot,
    generateVsOpenSpot,
    generateVsShoveSpot,
    generateVsMultiwaySpot,
    generateAnySpot,
    isValidRFISolution,
    isValidVsOpenSolution,
    isValidVsShoveSolution,
    isValidVsMultiwaySolution,
    isValidAnySolution
} from './index';
import allCombos from '../../../../combos.json';

/**
 * Example 1: Generate RFI spot (simplest)
 */
async function example1_RFISpot(solution: AppData) {
    console.log('=== RFI Spot Generation ===');
    
    // Validate solution is suitable for RFI
    if (!isValidRFISolution(solution)) {
        console.error('Solution not valid for RFI spots');
        return null;
    }
    
    // Generate RFI spot
    const rfiSpot = generateRFISpot(solution);
    
    console.log(`Hero position: ${rfiSpot.heroPosition}`);
    console.log(`BB position: ${rfiSpot.bbPosition}`);
    console.log(`Total players: ${rfiSpot.numPlayers}`);
    
    // Hero acts first (node 0) - no navigation needed
    // Now select a hand and show hero's RFI decision
    
    return rfiSpot;
}

/**
 * Example 2: Generate vs Open spot
 */
async function example2_VsOpenSpot(
    solution: AppData,
    loadNodes: (solutionId: string, nodeIds: number[]) => Promise<AppData | null>
) {
    console.log('=== vs Open Spot Generation ===');
    
    // Validate solution is suitable for vs Open
    if (!isValidVsOpenSolution(solution)) {
        console.error('Solution not valid for vs Open spots');
        return null;
    }
    
    // Generate vs Open spot
    const result = await generateVsOpenSpot({
        solution,
        loadNodes,
        solutionId: solution.id
    });
    
    if (!result.success) {
        console.error(`Failed to generate vs Open spot: ${result.error}`);
        return null;
    }
    
    console.log(`Hero position: ${result.heroPosition}`);
    console.log(`Raiser position: ${result.raiserPosition}`);
    console.log('Scenario: A player opened with 2BB raise, hero must respond');
    
    return result;
}

/**
 * Example 3: Generate vs Shove spot
 */
async function example3_VsShoveSpot(
    solution: AppData,
    loadNodes: (solutionId: string, nodeIds: number[]) => Promise<AppData | null>
) {
    console.log('=== vs Shove Spot Generation ===');
    
    // Validate solution is suitable for vs Shove
    if (!isValidVsShoveSolution(solution)) {
        console.error('Solution not valid for vs Shove spots');
        return null;
    }
    
    // Generate vs Shove spot
    const result = await generateVsShoveSpot({
        solution,
        loadNodes,
        solutionId: solution.id
    });
    
    if (!result.success) {
        console.error(`Failed to generate vs Shove spot: ${result.error}`);
        return null;
    }
    
    console.log(`Hero position: ${result.heroPosition}`);
    console.log(`Shover position: ${result.shoverPosition}`);
    console.log('Scenario: A player went all-in, hero must respond');
    
    return result;
}

/**
 * Example 4: Generate vs Multiway shove spot
 */
async function example4_VsMultiwaySpot(
    solution: AppData,
    loadNodes: (solutionId: string, nodeIds: number[]) => Promise<AppData | null>
) {
    console.log('=== vs Multiway Shove Spot Generation ===');
    
    // Validate solution is suitable for vs Multiway
    if (!isValidVsMultiwaySolution(solution)) {
        console.error('Solution not valid for vs Multiway spots');
        return null;
    }
    
    // Generate vs Multiway spot
    const result = await generateVsMultiwaySpot({
        solution,
        loadNodes,
        solutionId: solution.id
    });
    
    if (!result.success) {
        console.error(`Failed to generate vs Multiway spot: ${result.error}`);
        return null;
    }
    
    console.log(`Hero position: ${result.heroPosition}`);
    console.log(`Shover positions:`, result.shoverPositions);
    console.log(`Number of shovers: ${result.shoverPositions.length}`);
    console.log('Scenario: Multiple players went all-in, hero must respond');
    
    return result;
}

/**
 * Example 5: Generate Any spot (most complex)
 */
async function example5_AnySpot(
    solution: AppData,
    heroPosition: number,
    loadNodes: (solutionId: string, nodeIds: number[]) => Promise<AppData | null>
) {
    console.log('=== Any Spot Generation ===');
    
    // Validate solution is suitable for Any spots
    if (!isValidAnySolution(solution)) {
        console.error('Solution not valid for Any spots');
        return null;
    }
    
    // Generate Any spot
    const result = await generateAnySpot({
        solution,
        heroPosition,
        loadNodes,
        solutionId: solution.id,
        allCombos
    });
    
    if (!result.success) {
        console.error(`Failed to generate Any spot: ${result.error}`);
        return null;
    }
    
    console.log(`Hero position: ${heroPosition}`);
    console.log(`Final node ID: ${result.nodeId}`);
    console.log(`Villain actions:`);
    
    result.villainActions.forEach((action, index) => {
        console.log(`  ${index + 1}. Position ${action.position}: ${action.action} with ${action.combo}`);
    });
    
    console.log('Scenario: Random game tree navigation, hero faces realistic poker situation');
    
    return result;
}

/**
 * Example 6: Full workflow - Select spot type and generate
 */
async function example6_FullWorkflow(
    solution: AppData,
    spotType: string,
    loadNodes: (solutionId: string, nodeIds: number[]) => Promise<AppData | null>
) {
    console.log(`\n=== Generating ${spotType} Spot ===\n`);
    
    switch (spotType) {
        case 'RFI':
            if (!isValidRFISolution(solution)) {
                console.error('Solution not valid for RFI');
                return null;
            }
            return generateRFISpot(solution);
            
        case 'vs Open':
            if (!isValidVsOpenSolution(solution)) {
                console.error('Solution not valid for vs Open');
                return null;
            }
            return await generateVsOpenSpot({
                solution,
                loadNodes,
                solutionId: solution.id
            });
            
        case 'vs Shove':
            if (!isValidVsShoveSolution(solution)) {
                console.error('Solution not valid for vs Shove');
                return null;
            }
            return await generateVsShoveSpot({
                solution,
                loadNodes,
                solutionId: solution.id
            });
            
        case 'vs Multiway shove':
            if (!isValidVsMultiwaySolution(solution)) {
                console.error('Solution not valid for vs Multiway');
                return null;
            }
            return await generateVsMultiwaySpot({
                solution,
                loadNodes,
                solutionId: solution.id
            });
            
        case 'Any':
            const heroPosition = Math.floor(Math.random() * solution.settings.handdata.stacks.length);
            
            if (!isValidAnySolution(solution)) {
                console.error('Solution not valid for Any');
                return null;
            }
            return await generateAnySpot({
                solution,
                heroPosition,
                loadNodes,
                solutionId: solution.id,
                allCombos
            });
            
        default:
            console.error(`Unknown spot type: ${spotType}`);
            return null;
    }
}

/**
 * Example 7: Filter solutions by spot type requirements
 */
function example7_FilterSolutions(
    solutions: AppData[],
    spotType: string
): AppData[] {
    console.log(`=== Filtering solutions for ${spotType} ===`);
    
    let filtered: AppData[];
    
    switch (spotType) {
        case 'RFI':
            filtered = solutions.filter(isValidRFISolution);
            break;
            
        case 'vs Open':
            filtered = solutions.filter(isValidVsOpenSolution);
            console.log('(Filtering for avg stack >= 10 BB)');
            break;
            
        case 'vs Shove':
            filtered = solutions.filter(isValidVsShoveSolution);
            break;
            
        case 'vs Multiway shove':
            filtered = solutions.filter(isValidVsMultiwaySolution);
            console.log('(Filtering for >= 4 players)');
            break;
            
        case 'Any':
            filtered = solutions.filter(isValidAnySolution);
            break;
            
        default:
            console.error(`Unknown spot type: ${spotType}`);
            return [];
    }
    
    console.log(`Found ${filtered.length} valid solutions out of ${solutions.length}`);
    return filtered;
}

// Export examples for documentation
export {
    example1_RFISpot,
    example2_VsOpenSpot,
    example3_VsShoveSpot,
    example4_VsMultiwaySpot,
    example5_AnySpot,
    example6_FullWorkflow,
    example7_FilterSolutions
};
