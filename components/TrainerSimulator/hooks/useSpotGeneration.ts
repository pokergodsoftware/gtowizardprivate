/**
 * useSpotGeneration Hook (COMPLETE IMPLEMENTATION)
 * 
 * Handles complete spot generation including:
 * - Solution filtering
 * - Spot type selection
 * - Tree navigation
 * - Hand filtering by EV
 * - Combo selection
 * 
 * This is the working version that includes all logic from TrainerSimulator.tsx
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { AppData, NodeData } from '../../../types';
import { SpotSimulation, VillainAction } from '../types';
import { randomElement, selectHandFromRange } from '../../../lib/trainerUtils';
import { generateHandMatrix } from '../../../lib/pokerUtils';
import allCombos from '../../../combos.json';

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

    // Range fixo de EV: -0.5 a +1.5 BB
    const EV_RANGE = { min: -0.5, max: 1.5 };
    const MIN_EV_DIFF = 0.05; // Diferença mínima de EV entre ações

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
     * Get hand name from combo (e.g., "AhKd" -> "AKo")
     */
    const getHandNameFromCombo = (combo: string): string => {
        const rank1 = combo[0];
        const rank2 = combo[2];
        const suit1 = combo[1];
        const suit2 = combo[3];
        
        if (rank1 === rank2) {
            return `${rank1}${rank2}`; // Par
        } else if (suit1 === suit2) {
            return `${rank1}${rank2}s`; // Suited
        } else {
            return `${rank1}${rank2}o`; // Offsuit
        }
    };

    /**
     * Select a hand and combo from node's range
     */
    const selectHandAndCombo = useCallback((node: NodeData): { handName: string; combo: string } | null => {
        const handMatrix = generateHandMatrix();
        const allHands = handMatrix.flat();
        
        // 1. Filtra mãos jogadas (frequência > 0)
        const playedHands = allHands.filter((handName) => {
            const handData = node.hands[handName];
            if (!handData) return false;
            const totalFreq = handData.played.reduce((sum, freq) => sum + freq, 0);
            return totalFreq > 0;
        });

        if (playedHands.length === 0) {
            console.error('No hands played in this spot');
            return null;
        }

        console.log(`✅ Found ${playedHands.length} playable hands in range`);

        // 2. Filtra por range de EV
        const difficultHands = playedHands.filter((handName) => {
            const handData = node.hands[handName];
            if (!handData || !handData.evs) return false;
            
            const validEvs = handData.evs.filter((ev, idx) => handData.played[idx] > 0);
            if (validEvs.length < 2) return false;
            
            const maxEv = Math.max(...validEvs);
            return maxEv >= EV_RANGE.min && maxEv <= EV_RANGE.max;
        });

        console.log(`🎯 Filtered to ${difficultHands.length} hands (EV: ${EV_RANGE.min} to ${EV_RANGE.max} BB)`);

        // 3. Se não encontrou, pega piores EVs
        let handsToUse: string[];
        
        if (difficultHands.length > 0) {
            handsToUse = difficultHands;
        } else {
            console.log('⚠️ No marginal hands found, selecting hands with worst EVs');
            
            const handsWithEV = playedHands
                .map((handName) => {
                    const handData = node.hands[handName];
                    if (!handData || !handData.evs) return { handName, maxEv: Infinity };
                    
                    const validEvs = handData.evs.filter((ev, idx) => handData.played[idx] > 0);
                    const maxEv = validEvs.length > 0 ? Math.max(...validEvs) : Infinity;
                    
                    return { handName, maxEv };
                })
                .filter(item => item.maxEv !== Infinity)
                .sort((a, b) => a.maxEv - b.maxEv);
            
            const worstHandsCount = Math.max(5, Math.min(50, Math.floor(handsWithEV.length * 0.3)));
            handsToUse = handsWithEV.slice(0, worstHandsCount).map(item => item.handName);
            
            console.log(`📉 Using ${handsToUse.length} hands with worst EVs`);
        }

        // 4. Filtra mãos marginais
        const nonMarginalHands = handsToUse.filter((handName) => {
            const handData = node.hands[handName];
            if (!handData || !handData.evs) return true;
            
            const validEvs = handData.evs.filter((ev, idx) => handData.played[idx] > 0);
            if (validEvs.length < 2) return true;
            
            const sortedEvs = [...validEvs].sort((a, b) => b - a);
            const evDiff = sortedEvs[0] - sortedEvs[1];
            
            return evDiff >= MIN_EV_DIFF;
        });

        console.log(`🔍 Filtered marginal hands: ${handsToUse.length} → ${nonMarginalHands.length}`);

        const finalHandsToUse = nonMarginalHands.length > 0 ? nonMarginalHands : handsToUse;

        // 5. Sorteia mão
        const randomHandName = randomElement(finalHandsToUse);
        console.log(`✅ Selected hand: ${randomHandName}`);

        // 6. Sorteia combo
        const flatCombos = allCombos.flat();
        const handCombos = flatCombos.filter(combo => {
            const rank1 = combo[0];
            const rank2 = combo[2];
            const suit1 = combo[1];
            const suit2 = combo[3];
            
            const comboHand = rank1 === rank2 
                ? `${rank1}${rank2}`
                : suit1 === suit2 
                    ? `${rank1}${rank2}s`
                    : `${rank1}${rank2}o`;
            
            return comboHand === randomHandName || 
                   (rank1 !== rank2 && `${rank2}${rank1}${comboHand.slice(-1)}` === randomHandName);
        });
        
        if (handCombos.length === 0) {
            console.error('No combos found for hand:', randomHandName);
            return null;
        }
        
        const randomCombo = randomElement(handCombos);
        console.log(`✅ Selected combo: ${randomCombo}`);

        return { handName: randomHandName, combo: randomCombo };
    }, []);

    /**
     * Main spot generation function
     */
    const generateNewSpot = useCallback(async () => {
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
            console.log('\n🎲 === SPOT GENERATION START ===');
            console.log('🎯 Selected Phases:', selectedPhases);
            console.log('🎲 Selected Spot Types:', selectedSpotTypes);
            console.log('📊 Total solutions available:', phaseSolutions.length);

            // 1. Determine spot type
            const spotType = getRandomSpotType();
            console.log('🎲 Spot type selected:', spotType);

            // 2. Filter solutions based on spot type
            let filteredSolutions = [...phaseSolutions];
            
            if (spotType === 'vs Open') {
                filteredSolutions = phaseSolutions.filter(s => getAverageStackBB(s) >= 13.2);
                console.log(`📊 Filtered for vs Open: ${filteredSolutions.length} solutions`);
                
                if (filteredSolutions.length === 0) {
                    console.log('⚠️ No suitable solutions, retrying...');
                    isGeneratingSpot.current = false;
                    setTimeout(() => generateNewSpot(), 100);
                    return;
                }
            }

            // 3. Select random solution
            const randomSolution = randomElement(filteredSolutions);
            console.log('🎲 Selected solution:', randomSolution.fileName);
            console.log('🏆 Tournament phase:', randomSolution.tournamentPhase);

            if (!randomSolution.path) {
                console.error('❌ Solution missing path');
                isGeneratingSpot.current = false;
                retryCount.current++;
                if (retryCount.current < maxRetries) {
                    setTimeout(() => generateNewSpot(), 100);
                }
                return;
            }

            // 4. Load nodes
            let currentSolution = randomSolution;
            const originalSolutionId = randomSolution.id;
            
            if (!randomSolution.nodes.has(0)) {
                console.log('Loading nodes...');
                
                if (retryCount.current >= maxRetries) {
                    console.error(`❌ Max retries reached`);
                    isGeneratingSpot.current = false;
                    retryCount.current = 0;
                    return;
                }
                
                retryCount.current++;
                
                const loadedSolution = await loadNodesForSolution(originalSolutionId);
                
                if (!loadedSolution || !loadedSolution.nodes.has(0)) {
                    console.error('❌ Failed to load nodes');
                    isGeneratingSpot.current = false;
                    setTimeout(() => generateNewSpot(), 500);
                    return;
                }
                
                currentSolution = loadedSolution;
                retryCount.current = 0;
            } else {
                retryCount.current = 0;
            }

            // 5. Generate spot based on type
            if (spotType === 'RFI') {
                const numPlayers = currentSolution.settings.handdata.stacks.length;
                const bbPosition = numPlayers - 1;
                
                let heroPosition: number;
                do {
                    heroPosition = Math.floor(Math.random() * numPlayers);
                } while (heroPosition === bbPosition);
                
                console.log(`✅ [RFI] Hero position: ${heroPosition}`);
                
                const node = currentSolution.nodes.get(0);
                if (!node) {
                    console.error('❌ Node 0 not found');
                    isGeneratingSpot.current = false;
                    return;
                }
                
                const handAndCombo = selectHandAndCombo(node);
                if (!handAndCombo) {
                    console.error('❌ Failed to select hand');
                    isGeneratingSpot.current = false;
                    setTimeout(() => generateNewSpot(), 100);
                    return;
                }
                
                setCurrentSpot({
                    solution: currentSolution,
                    nodeId: 0,
                    playerPosition: heroPosition,
                    playerHand: handAndCombo.combo,
                    playerHandName: handAndCombo.handName,
                    spotType: spotType
                });
                
                console.log('✅✅✅ RFI spot generated successfully!');
                isGeneratingSpot.current = false;
                retryCount.current = 0;
                return;
            }
            
            if (spotType === 'Any') {
                console.log('\n🎲 === GENERATING ANY SPOT ===');
                
                const numPlayers = currentSolution.settings.handdata.stacks.length;
                const heroPosition = Math.floor(Math.random() * numPlayers);
                console.log(`Hero position: ${heroPosition}`);
                
                const flatCombos = allCombos.flat();
                const villainActions: VillainAction[] = [];
                const blinds = currentSolution.settings.handdata.blinds;
                const bigBlind = Math.max(blinds[0], blinds[1]);
                
                let currentNodeId = 0;
                let workingSolution = currentSolution;
                let currentNode = workingSolution.nodes.get(currentNodeId);
                
                if (!currentNode) {
                    console.error('❌ Initial node not found');
                    isGeneratingSpot.current = false;
                    return;
                }
                
                const maxIterations = 50;
                let iterations = 0;
                
                // Navigate until reaching hero
                while (currentNode && currentNode.player !== heroPosition && iterations < maxIterations) {
                    iterations++;
                    const villainPosition = currentNode.player;
                    
                    console.log(`\n🎯 Villain turn - Position ${villainPosition} at node ${currentNodeId}`);
                    
                    // Select random combo for villain
                    const randomCombo = randomElement(flatCombos);
                    const handName = getHandNameFromCombo(randomCombo);
                    
                    console.log(`   🎴 Random combo for villain: ${randomCombo} (${handName})`);
                    
                    const handData = currentNode.hands[handName];
                    
                    if (!handData || !handData.played) {
                        const foldAction = currentNode.actions.find(a => a.type === 'F');
                        if (!foldAction || !foldAction.node) {
                            console.error('❌ No fold action available');
                            isGeneratingSpot.current = false;
                            setTimeout(() => generateNewSpot(), 100);
                            return;
                        }
                        
                        villainActions.push({
                            position: villainPosition,
                            action: 'Fold',
                            combo: randomCombo
                        });
                        
                        currentNodeId = foldAction.node;
                    } else {
                        // Find action with highest frequency
                        let maxFreq = 0;
                        let bestActionIndex = -1;
                        
                        handData.played.forEach((freq, idx) => {
                            if (freq > maxFreq) {
                                maxFreq = freq;
                                bestActionIndex = idx;
                            }
                        });
                        
                        if (bestActionIndex === -1 || maxFreq === 0) {
                            const foldAction = currentNode.actions.find(a => a.type === 'F');
                            if (!foldAction || !foldAction.node) {
                                console.error('❌ No fold action available');
                                isGeneratingSpot.current = false;
                                setTimeout(() => generateNewSpot(), 100);
                                return;
                            }
                            
                            villainActions.push({
                                position: villainPosition,
                                action: 'Fold',
                                combo: randomCombo
                            });
                            
                            currentNodeId = foldAction.node;
                        } else {
                            const selectedAction = currentNode.actions[bestActionIndex];
                            
                            let actionName = '';
                            let actionAmount: number | undefined;
                            
                            if (selectedAction.type === 'F') {
                                actionName = 'Fold';
                            } else if (selectedAction.type === 'C') {
                                actionName = 'Call';
                                actionAmount = selectedAction.amount;
                            } else if (selectedAction.type === 'X') {
                                actionName = 'Check';
                            } else if (selectedAction.type === 'R') {
                                const villainStack = workingSolution.settings.handdata.stacks[villainPosition];
                                const isAllin = selectedAction.amount > (villainStack * 0.5);
                                
                                if (isAllin) {
                                    actionName = 'Allin';
                                    actionAmount = selectedAction.amount;
                                } else {
                                    const raiseBB = (selectedAction.amount / bigBlind).toFixed(1);
                                    actionName = `Raise ${raiseBB}`;
                                    actionAmount = selectedAction.amount;
                                }
                            }
                            
                            console.log(`   ✅ Villain action: ${actionName} (freq: ${(maxFreq * 100).toFixed(1)}%)`);
                            
                            villainActions.push({
                                position: villainPosition,
                                action: actionName,
                                amount: actionAmount,
                                combo: randomCombo
                            });
                            
                            currentNodeId = selectedAction.node || 0;
                        }
                    }
                    
                    // Check for terminal node
                    if (currentNodeId === 0) {
                        console.log('⚠️ Reached terminal node before hero, trying again...');
                        isGeneratingSpot.current = false;
                        setTimeout(() => generateNewSpot(), 100);
                        return;
                    }
                    
                    // Load next node if needed
                    if (!workingSolution.nodes.has(currentNodeId)) {
                        console.log(`   📥 Loading node ${currentNodeId}...`);
                        const updated = await loadNodesForSolution(originalSolutionId, [currentNodeId]);
                        
                        if (updated && updated.nodes.has(currentNodeId)) {
                            workingSolution = updated;
                            console.log(`   ✅ Node ${currentNodeId} loaded`);
                        } else {
                            console.error('❌ Failed to load node', currentNodeId);
                            isGeneratingSpot.current = false;
                            setTimeout(() => generateNewSpot(), 100);
                            return;
                        }
                    }
                    
                    currentNode = workingSolution.nodes.get(currentNodeId);
                    
                    if (!currentNode) {
                        console.error('❌ Node not found:', currentNodeId);
                        isGeneratingSpot.current = false;
                        setTimeout(() => generateNewSpot(), 100);
                        return;
                    }
                }
                
                if (iterations >= maxIterations) {
                    console.error('❌ Max iterations reached');
                    isGeneratingSpot.current = false;
                    setTimeout(() => generateNewSpot(), 100);
                    return;
                }
                
                if (!currentNode || currentNode.player !== heroPosition) {
                    console.error('❌ Did not reach hero position');
                    isGeneratingSpot.current = false;
                    setTimeout(() => generateNewSpot(), 100);
                    return;
                }
                
                console.log(`\n✅ Reached hero at position ${heroPosition}, node ${currentNodeId}`);
                
                // Select hand and combo for hero
                const handAndCombo = selectHandAndCombo(currentNode);
                if (!handAndCombo) {
                    console.error('❌ Failed to select hand');
                    isGeneratingSpot.current = false;
                    setTimeout(() => generateNewSpot(), 100);
                    return;
                }
                
                setCurrentSpot({
                    solution: workingSolution,
                    nodeId: currentNodeId,
                    playerPosition: heroPosition,
                    playerHand: handAndCombo.combo,
                    playerHandName: handAndCombo.handName,
                    spotType: spotType,
                    villainActions: villainActions
                });
                
                console.log('✅✅✅ Any spot generated successfully!');
                isGeneratingSpot.current = false;
                retryCount.current = 0;
                return;
            }

            // TODO: Implement other spot types (vs Open, vs Shove, vs Multiway)
            console.log(`⚠️ Spot type "${spotType}" not yet implemented in hook`);
            setCurrentSpot(null);
            isGeneratingSpot.current = false;

        } catch (error) {
            console.error('❌ Error generating spot:', error);
            isGeneratingSpot.current = false;
            retryCount.current++;
            
            if (retryCount.current < maxRetries) {
                console.log(`🔄 Retrying (${retryCount.current}/${maxRetries})...`);
                setTimeout(() => generateNewSpot(), 100);
            } else {
                retryCount.current = 0;
            }
        }
    }, [
        phaseSolutions,
        selectedPhases,
        selectedSpotTypes,
        getRandomSpotType,
        getAverageStackBB,
        loadNodesForSolution,
        selectHandAndCombo
    ]);

    return {
        currentSpot,
        generateNewSpot,
        isGenerating: isGeneratingSpot.current
    };
};
