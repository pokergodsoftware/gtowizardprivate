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
import { selectInterestingCombo, isInterestingCombo } from '../utils/comboSelection';
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

        // 5. NOVA ABORDAGEM: Pré-filtra TODOS os combos válidos primeiro
        console.log('🎯 Pre-filtering valid combos with EV in range...');
        
        const flatCombos = allCombos.flat();
        const validCombos: Array<{ handName: string; combo: string }> = [];
        
        // Para cada mão, verifica quais combos passam no filtro de EV
        for (const handName of finalHandsToUse) {
            const handData = node.hands[handName];
            if (!handData) continue;
            
            // Pega todos os combos dessa mão
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
                
                return comboHand === handName || 
                       (rank1 !== rank2 && `${rank2}${rank1}${comboHand.slice(-1)}` === handName);
            });
            
            // Verifica se essa mão passa no filtro de EV
            if (isInterestingCombo(handName, '', node, {
                minPositiveEV: 0.07,
                maxPositiveEV: 1.00,
                minNegativeEV: -1.00,
                maxNegativeEV: -0.07
            })) {
                // Adiciona todos os combos dessa mão
                for (const combo of handCombos) {
                    validCombos.push({ handName, combo });
                }
            }
        }
        
        console.log(`✅ Found ${validCombos.length} valid combos from ${finalHandsToUse.length} hands`);
        
        if (validCombos.length === 0) {
            console.error('❌ No valid combos found with EV in range!');
            return null;
        }
        
        // 6. Randomiza entre os combos válidos
        const selectedEntry = randomElement(validCombos);
        const { handName: randomHandName, combo: selectedCombo } = selectedEntry;
        
        console.log(`✅ Selected hand: ${randomHandName}`);
        console.log(`✅ Selected combo: ${selectedCombo}`);
        
        // 7. Verificar EV do combo e mostrar logs detalhados
        const handData = node.hands[randomHandName];
        if (handData && handData.evs) {
            const numActions = node.actions.length;
            
            if (numActions === 2) {
                // 2 ações: mostrar todos os EVs
                console.log(`📊 2 Actions - All EVs: [${handData.evs.map(ev => ev.toFixed(2)).join(', ')}]`);
                const hasValidEV = handData.evs.some(ev => 
                    (ev >= 0.07 && ev <= 1.00) || (ev >= -1.00 && ev <= -0.07)
                );
                console.log(`   Range: Positive (+0.07 to +1.00) OR Negative (-1.00 to -0.07)`);
                console.log(`   Status: ${hasValidEV ? '✅ In range' : '❌ Should not happen!'}`);
            } else if (numActions >= 3) {
                // 3+ ações: encontrar a mais usada
                let mostUsedIndex = 0;
                let maxFreq = handData.played[0] || 0;
                
                for (let i = 1; i < handData.played.length; i++) {
                    if (handData.played[i] > maxFreq) {
                        maxFreq = handData.played[i];
                        mostUsedIndex = i;
                    }
                }
                
                const mostUsedEV = handData.evs[mostUsedIndex];
                const mostUsedAction = node.actions[mostUsedIndex].type;
                console.log(`📊 3+ Actions - Most used: ${mostUsedAction} (${(maxFreq * 100).toFixed(1)}%)`);
                console.log(`   EV of most used: ${mostUsedEV.toFixed(2)}`);
                console.log(`   Range: Positive (+0.07 to +1.00) OR Negative (-1.00 to -0.07)`);
                
                const inRange = (mostUsedEV >= 0.07 && mostUsedEV <= 1.00) || (mostUsedEV >= -1.00 && mostUsedEV <= -0.07);
                console.log(`   Status: ${inRange ? '✅ In range' : '❌ Should not happen!'}`);
            }
        }

        return { handName: randomHandName, combo: selectedCombo };
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
                
                // Carrega nodes 0-5 de uma vez se necessário
                if (!currentSolution.nodes.has(1) || !currentSolution.nodes.has(2)) {
                    console.log('📥 Loading RFI nodes 0-5...');
                    const nodesToLoad = [0, 1, 2, 3, 4, 5];
                    const updatedSolution = await loadNodesForSolution(originalSolutionId, nodesToLoad);
                    if (updatedSolution) {
                        currentSolution = updatedSolution;
                    }
                }
                
                // Coleta todos os nós RFI disponíveis
                const rfiNodes: Array<{ nodeId: number; position: number }> = [];
                
                // Verifica nodes 0-20 para encontrar nós RFI
                for (let nodeId = 0; nodeId <= 20; nodeId++) {
                    const node = currentSolution.nodes.get(nodeId);
                    if (!node) continue;
                    
                    // Verifica se é um nó RFI (sem ações anteriores ou só folds antes)
                    const isRFI = !node.sequence || node.sequence.length === 0 || 
                                  node.sequence.every(action => action.type === 'F');
                    
                    if (isRFI && node.player !== bbPosition) {
                        rfiNodes.push({ nodeId, position: node.player });
                    }
                }
                
                if (rfiNodes.length === 0) {
                    console.error('❌ No RFI nodes found in solution');
                    isGeneratingSpot.current = false;
                    setTimeout(() => generateNewSpot(), 100);
                    return;
                }
                
                console.log(`✅ Found ${rfiNodes.length} RFI nodes:`, rfiNodes);
                
                // Sorteia um nó RFI aleatório
                const selectedRFI = randomElement(rfiNodes);
                const heroPosition = selectedRFI.position;
                const currentNodeId = selectedRFI.nodeId;
                
                console.log(`✅ [RFI] Hero position: ${heroPosition}, Node: ${currentNodeId}`);
                
                const currentNode = currentSolution.nodes.get(currentNodeId);
                if (!currentNode) {
                    console.error(`❌ Node ${currentNodeId} not found`);
                    isGeneratingSpot.current = false;
                    return;
                }
                
                console.log(`✅ Found RFI node ${currentNodeId} for position ${heroPosition}`);
                
                const handAndCombo = selectHandAndCombo(currentNode);
                if (!handAndCombo) {
                    console.error('❌ Failed to select hand');
                    isGeneratingSpot.current = false;
                    setTimeout(() => generateNewSpot(), 100);
                    return;
                }
                
                setCurrentSpot({
                    solution: currentSolution,
                    nodeId: currentNodeId,
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
            
            if (spotType === 'vs Open') {
                console.log('\n🎲 === GENERATING VS OPEN SPOT ===');
                
                const numPlayers = currentSolution.settings.handdata.stacks.length;
                const blinds = currentSolution.settings.handdata.blinds;
                const bigBlind = Math.max(blinds[0], blinds[1]);
                const bbPosition = numPlayers - 1;
                
                // Carrega nodes 0-10 de uma vez
                if (!currentSolution.nodes.has(5)) {
                    console.log('📥 Loading nodes 0-10...');
                    const nodesToLoad = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                    const updatedSolution = await loadNodesForSolution(originalSolutionId, nodesToLoad);
                    if (updatedSolution) {
                        currentSolution = updatedSolution;
                    }
                }
                
                // Passo 1: Verificar quais posições têm RFI NÃO all-in
                const rfiNonAllinPositions: Array<{ position: number; nodeId: number; raiseNode: number }> = [];
                
                // Varre os primeiros nós para encontrar RFI não all-in
                for (let nodeId = 0; nodeId <= 20; nodeId++) {
                    const node = currentSolution.nodes.get(nodeId);
                    if (!node) continue;
                    
                    // Verifica se é um nó RFI (sem ações anteriores ou só folds antes)
                    const isRFI = !node.sequence || node.sequence.length === 0 || 
                                  node.sequence.every(action => action.type === 'F');
                    
                    if (!isRFI || node.player === bbPosition) continue;
                    
                    // Verifica se tem raise NÃO all-in
                    const playerStack = currentSolution.settings.handdata.stacks[node.player];
                    
                    for (let i = 0; i < node.actions.length; i++) {
                        const action = node.actions[i];
                        
                        if (action.type !== 'R') continue;
                        
                        // Verifica se é all-in: raise amount >= stack do jogador
                        const isAllIn = action.amount >= playerStack;
                        
                        if (!isAllIn && action.node !== undefined) {
                            // Verifica se alguma mão joga esse raise
                            let hasFrequency = false;
                            for (const handName of Object.keys(node.hands)) {
                                const handData = node.hands[handName];
                                if (handData && handData.played[i] > 0) {
                                    hasFrequency = true;
                                    break;
                                }
                            }
                            
                            if (hasFrequency) {
                                rfiNonAllinPositions.push({
                                    position: node.player,
                                    nodeId: nodeId,
                                    raiseNode: action.node
                                });
                                break; // Já encontrou raise não all-in neste nó
                            }
                        }
                    }
                }
                
                if (rfiNonAllinPositions.length === 0) {
                    console.log('⚠️ No RFI non all-in found, trying another solution...');
                    isGeneratingSpot.current = false;
                    setTimeout(() => generateNewSpot(), 100);
                    return;
                }
                
                console.log(`✅ Found ${rfiNonAllinPositions.length} positions with RFI non all-in:`, rfiNonAllinPositions);
                
                // Passo 2: Sorteia um raiser
                const selectedRaiser = randomElement(rfiNonAllinPositions);
                const raiserPosition = selectedRaiser.position;
                
                console.log(`✅ Selected raiser: Position ${raiserPosition} at node ${selectedRaiser.nodeId}`);
                
                // Passo 3: Entra no node do raise
                let raiseNodeId = selectedRaiser.raiseNode;
                let currentNode = currentSolution.nodes.get(raiseNodeId);
                
                if (!currentNode) {
                    console.error(`❌ Raise node ${raiseNodeId} not found`);
                    isGeneratingSpot.current = false;
                    setTimeout(() => generateNewSpot(), 100);
                    return;
                }
                
                console.log(`✅ Entered raise node ${raiseNodeId}, player: ${currentNode.player}`);
                
                // Passo 4: Sorteia hero entre as posições DEPOIS do raiser (até BB)
                const possibleHeroPositions: number[] = [];
                for (let pos = raiserPosition + 1; pos < numPlayers; pos++) {
                    possibleHeroPositions.push(pos);
                }
                
                if (possibleHeroPositions.length === 0) {
                    console.error('❌ No valid hero positions after raiser');
                    isGeneratingSpot.current = false;
                    setTimeout(() => generateNewSpot(), 100);
                    return;
                }
                
                const heroPosition = randomElement(possibleHeroPositions);
                console.log(`✅ Hero position: ${heroPosition} (after raiser ${raiserPosition})`);
                
                // Passo 5: Registra ações anteriores e navega até o hero
                const villainActions: VillainAction[] = [];
                
                // Adiciona ações de fold antes do raiser (se houver)
                const flatCombos = allCombos.flat();
                for (let pos = 0; pos < raiserPosition; pos++) {
                    const randomCombo = randomElement(flatCombos);
                    villainActions.push({
                        position: pos,
                        action: 'Fold',
                        combo: randomCombo
                    });
                }
                
                // Adiciona a ação de raise do raiser
                const raiserNode = currentSolution.nodes.get(selectedRaiser.nodeId);
                if (raiserNode) {
                    const raiseAction = raiserNode.actions.find(a => a.type === 'R' && a.node === selectedRaiser.raiseNode);
                    if (raiseAction) {
                        // Calcula o tamanho do raise em BB
                        // raiseAction.amount é o total colocado no pote
                        // Precisa descontar blind/ante já investido
                        const blinds = currentSolution.settings.handdata.blinds;
                        let alreadyInvested = 0;
                        
                        // Verifica quanto o raiser já investiu (blind/ante)
                        if (raiserPosition === numPlayers - 1) { // BB
                            alreadyInvested = Math.max(blinds[0], blinds[1]);
                        } else if (raiserPosition === numPlayers - 2) { // SB
                            alreadyInvested = Math.min(blinds[0], blinds[1]);
                        }
                        
                        // Adiciona ante se houver
                        const antePerPlayer = blinds[2] || 0;
                        alreadyInvested += antePerPlayer;
                        
                        const actualRaiseAmount = raiseAction.amount - alreadyInvested;
                        const raiseAmountBB = actualRaiseAmount / bigBlind;
                        
                        const randomCombo = randomElement(flatCombos);
                        villainActions.push({
                            position: raiserPosition,
                            action: `Raise ${raiseAmountBB.toFixed(1)}`,
                            combo: randomCombo
                        });
                    }
                }
                
                // Navega fazendo fold até chegar no hero
                let currentNodeId = raiseNodeId;
                let attempts = 0;
                
                while (currentNode && currentNode.player !== heroPosition && attempts < 30) {
                    attempts++;
                    console.log(`🔍 Node ${currentNodeId}: player ${currentNode.player} (navegando até hero ${heroPosition})`);
                    
                    // Registra o fold do villain
                    const randomCombo = randomElement(flatCombos);
                    
                    villainActions.push({
                        position: currentNode.player,
                        action: 'Fold',
                        combo: randomCombo
                    });
                    
                    const foldAction = currentNode.actions.find(a => a.type === 'F');
                    if (!foldAction || foldAction.node === undefined) {
                        console.error('❌ No fold action to navigate');
                        isGeneratingSpot.current = false;
                        setTimeout(() => generateNewSpot(), 100);
                        return;
                    }
                    
                    currentNodeId = foldAction.node;
                    currentNode = currentSolution.nodes.get(currentNodeId);
                    
                    if (!currentNode) {
                        console.error(`❌ Node ${currentNodeId} not found during navigation`);
                        isGeneratingSpot.current = false;
                        setTimeout(() => generateNewSpot(), 100);
                        return;
                    }
                }
                
                if (!currentNode || currentNode.player !== heroPosition) {
                    console.error(`❌ Could not reach hero position ${heroPosition}`);
                    isGeneratingSpot.current = false;
                    setTimeout(() => generateNewSpot(), 100);
                    return;
                }
                
                console.log(`✅ Reached hero at node ${currentNodeId}`);
                console.log(`✅ Villain actions recorded:`, villainActions);
                
                const handAndCombo = selectHandAndCombo(currentNode);
                if (!handAndCombo) {
                    console.error('❌ Failed to select hand');
                    isGeneratingSpot.current = false;
                    setTimeout(() => generateNewSpot(), 100);
                    return;
                }
                
                setCurrentSpot({
                    solution: currentSolution,
                    nodeId: currentNodeId,
                    playerPosition: heroPosition,
                    playerHand: handAndCombo.combo,
                    playerHandName: handAndCombo.handName,
                    spotType: spotType,
                    raiserPosition: raiserPosition,
                    villainActions: villainActions
                });
                
                console.log('✅✅✅ vs Open spot generated successfully!');
                console.log(`   Raiser: Position ${raiserPosition} → Hero: Position ${heroPosition}`);
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
                                const villainStack = workingSolution.settings.handdata.stacks[villainPosition];
                                // Check if Call results in 0 stack (all-in)
                                const isAllin = selectedAction.amount >= villainStack;
                                
                                if (isAllin) {
                                    actionName = 'Allin';
                                } else {
                                    actionName = 'Call';
                                }
                                actionAmount = selectedAction.amount;
                            } else if (selectedAction.type === 'X') {
                                actionName = 'Check';
                            } else if (selectedAction.type === 'R') {
                                const villainStack = workingSolution.settings.handdata.stacks[villainPosition];
                                // Check if Raise results in 0 stack (all-in)
                                const isAllin = selectedAction.amount >= villainStack;
                                
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
                            // Merge the newly loaded node into workingSolution
                            // instead of replacing the entire solution (which would lose previous nodes)
                            workingSolution.nodes.set(currentNodeId, updated.nodes.get(currentNodeId)!);
                            console.log(`   ✅ Node ${currentNodeId} loaded and merged (total nodes: ${workingSolution.nodes.size})`);
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
