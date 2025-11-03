/**
 * useSpotGeneration Hook
 * 
 * Orchestrates spot generation for TrainerSimulator.
 * Handles solution filtering, spot type selection, and delegation to specific generators.
 * 
 * Phase 6 of TrainerSimulator refactoring.
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { AppData } from '../../../types';
import { SpotSimulation } from '../types';
import { randomElement } from '../../../lib/trainerUtils';

// Placeholder imports - these will be implemented in Phase 5
// For now, we'll keep the generator logic inline
// import { 
//     generateRFISpot,
//     generateVsOpenSpot,
//     generateVsShoveSpot,
//     generateVsMultiwaySpot,
//     generateAnySpot
// } from '../utils/spotGenerators';

interface UseSpotGenerationProps {
    solutions: AppData[];
    selectedPhases: string[];
    selectedSpotTypes: string[];
    loadNodesForSolution: (solutionId: string, nodeIdsToLoad?: number[]) => Promise<AppData | null>;
    playerCountFilter?: number;
}

interface UseSpotGenerationReturn {
    currentSpot: SpotSimulation | null;
    generateNewSpot: () => Promise<void>;
    isGenerating: boolean;
}

/**
 * Hook for managing spot generation in TrainerSimulator
 */
export const useSpotGeneration = ({
    solutions,
    selectedPhases,
    selectedSpotTypes,
    loadNodesForSolution,
    playerCountFilter
}: UseSpotGenerationProps): UseSpotGenerationReturn => {
    
    const [currentSpot, setCurrentSpot] = useState<SpotSimulation | null>(null);
    const isGeneratingSpot = useRef(false);
    const hasInitialized = useRef(false);
    const retryCount = useRef(0);
    const maxRetries = 5;

    // Filter solutions by selected phases and player count
    const phaseSolutions = useMemo(() => {
        let filtered = solutions.filter(s => selectedPhases.includes(s.tournamentPhase));
        
        if (playerCountFilter !== undefined) {
            filtered = filtered.filter(s => s.settings.handdata.stacks.length === playerCountFilter);
            console.log(`🎯 Filtering by player count: ${playerCountFilter} players`);
            console.log(`📊 Solutions found: ${filtered.length}`);
        }
        
        return filtered;
    }, [solutions, selectedPhases, playerCountFilter]);

    /**
     * Get random spot type from selected types
     */
    const getRandomSpotType = useCallback((): string => {
        return randomElement(selectedSpotTypes);
    }, [selectedSpotTypes]);

    /**
     * Calculate average stack in BB for a solution
     */
    const getAverageStackBB = useCallback((solution: AppData): number => {
        const stacks = solution.settings.handdata.stacks;
        const blinds = solution.settings.handdata.blinds;
        const bigBlind = Math.max(blinds[0], blinds[1]);
        const avgStack = stacks.reduce((a, b) => a + b, 0) / stacks.length;
        return avgStack / bigBlind;
    }, []);

    /**
     * Main spot generation function
     * Orchestrates the entire spot generation process
     */
    const generateNewSpot = useCallback(async () => {
        // Prevent multiple simultaneous generations
        if (isGeneratingSpot.current) {
            console.log('⚠️ Already generating a spot, skipping...');
            return;
        }

        if (phaseSolutions.length === 0) {
            console.log('❌ No solutions available for selected phases');
            return;
        }

        isGeneratingSpot.current = true;

        try {
            // Debug info
            console.log('\n🎲 === SPOT GENERATION START ===');
            console.log('🎯 Selected Phases:', selectedPhases);
            console.log('🎲 Selected Spot Types:', selectedSpotTypes);
            console.log('📊 Total solutions available:', phaseSolutions.length);
            console.log('📦 Phase distribution:', phaseSolutions.reduce((acc, s) => {
                acc[s.tournamentPhase] = (acc[s.tournamentPhase] || 0) + 1;
                return acc;
            }, {} as Record<string, number>));

            // 1. Determine spot type
            const spotType = getRandomSpotType();
            console.log('🎲 Spot type selected:', spotType);

            // 2. Filter solutions based on spot type requirements
            let filteredSolutions = [...phaseSolutions];
            
            if (spotType === 'vs Open') {
                // vs Open requires average stack >= 13.2bb
                filteredSolutions = phaseSolutions.filter(s => {
                    const avgStack = getAverageStackBB(s);
                    return avgStack >= 13.2;
                });
                console.log(`📊 Filtered for vs Open (avg stack >= 13.2bb): ${filteredSolutions.length} solutions`);
                
                if (filteredSolutions.length === 0) {
                    console.log('⚠️ No solutions with avg stack >= 13.2bb, retrying...');
                    isGeneratingSpot.current = false;
                    setTimeout(() => generateNewSpot(), 100);
                    return;
                }
            }

            // 3. Select random solution
            const randomSolution = randomElement(filteredSolutions);
            console.log('🎲 Selected solution:', randomSolution.fileName);
            console.log('🏆 Tournament phase:', randomSolution.tournamentPhase);
            console.log('📊 Average stack:', getAverageStackBB(randomSolution).toFixed(1) + 'bb');

            // Validate solution has path
            if (!randomSolution.path) {
                console.error('❌ Solution missing path:', randomSolution.id);
                isGeneratingSpot.current = false;
                retryCount.current++;
                if (retryCount.current < maxRetries) {
                    setTimeout(() => generateNewSpot(), 100);
                }
                return;
            }

            // 4. Delegate to specific spot generator
            // TODO: In Phase 5, this will call specific generator functions
            // For now, we'll return null to indicate this needs implementation
            console.log('⚠️ Spot generation logic not yet extracted');
            console.log('📝 This will be implemented when generators are extracted in Phase 5');
            
            // Placeholder: Set a null spot to prevent infinite loop
            setCurrentSpot(null);
            
            isGeneratingSpot.current = false;
            retryCount.current = 0;

        } catch (error) {
            console.error('❌ Error generating spot:', error);
            isGeneratingSpot.current = false;
            retryCount.current++;
            
            if (retryCount.current < maxRetries) {
                console.log(`🔄 Retrying spot generation (${retryCount.current}/${maxRetries})...`);
                setTimeout(() => generateNewSpot(), 100);
            } else {
                console.error('❌ Max retries reached, giving up');
                retryCount.current = 0;
            }
        }
    }, [
        phaseSolutions,
        selectedPhases,
        selectedSpotTypes,
        getRandomSpotType,
        getAverageStackBB,
        loadNodesForSolution
    ]);

    return {
        currentSpot,
        generateNewSpot,
        isGenerating: isGeneratingSpot.current
    };
};
