import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { AppData, NodeData } from '../types.ts';
import { PokerTableVisual } from './PokerTableVisual.tsx';
import { PlayerHand } from './PlayerHand.tsx';
import { randomElement, selectHandFromRange, comboIndexToString } from '../lib/trainerUtils.ts';
import allCombos from '../combos.json';
import { generateHandMatrix } from '../lib/pokerUtils.ts';
import { saveSpotResult, saveSpotHistory } from '../utils/statsUtils.ts';
import { getTrainerAssetUrl } from '../src/config.ts';

interface TrainerSimulatorProps {
    solutions: AppData[];
    selectedPhases: string[]; // Agora aceita múltiplas fases
    selectedSpotTypes: string[]; // Tipos de spots selecionados (Any, RFI, vs Open, etc)
    onBack: () => void;
    loadNode: (nodeId: number) => Promise<void>;
    loadNodesForSolution: (solutionId: string, nodeIdsToLoad?: number[]) => Promise<AppData | null>;
    userId: string; // ID do usuário para salvar estatísticas
    tournamentPhase: string; // Fase do torneio atual
    tournamentMode?: boolean; // Se true, está no modo torneio
    onSpotResult?: (isCorrect: boolean) => void; // Callback para modo torneio
    playerCountFilter?: number; // Filtro opcional por número de jogadores (para Final Table)
}

interface VillainAction {
    position: number;
    action: string; // 'Fold', 'Call', 'Raise X', 'Allin'
    amount?: number; // Valor da aposta (se aplicável)
    combo?: string; // Combo usado pelo vilão (ex: "AhKd")
}

interface SpotSimulation {
    solution: AppData;
    nodeId: number;
    playerPosition: number;
    playerHand: string; // Combo específico (ex: "AhKd")
    playerHandName: string; // Nome da mão (ex: "AKo")
    raiserPosition?: number; // Posição do jogador que deu raise (para vs Open)
    shoverPositions?: number[]; // Posições dos jogadores que deram shove (para vs Multiway shove)
    spotType: string; // Tipo de spot: RFI, vs Open, Any, etc
    villainActions?: VillainAction[]; // Histórico de ações dos vilões (para tipo Any)
}

const tournamentPhases = [
    '100~60% left',
    '60~40% left',
    '40~20% left',
    'Near bubble',
    'After bubble',
    '3 tables',
    '2 tables',
    'Final table'
];

export const TrainerSimulator: React.FC<TrainerSimulatorProps> = ({ 
    solutions, 
    selectedPhases,
    selectedSpotTypes,
    onBack,
    loadNode,
    loadNodesForSolution,
    userId,
    tournamentPhase,
    tournamentMode = false,
    onSpotResult,
    playerCountFilter
}) => {
    const [currentSpot, setCurrentSpot] = useState<SpotSimulation | null>(null);
    const [userAction, setUserAction] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [displayMode, setDisplayMode] = useState<'bb' | 'chips'>('bb');
    const [stats, setStats] = useState({
        totalQuestions: 0,
        correctAnswers: 0,
        score: 0
    });
    
    // Timebank (apenas modo torneio)
    const [timeLeft, setTimeLeft] = useState(15); // 15 segundos
    const [hasPlayedTimebank1, setHasPlayedTimebank1] = useState(false);
    const [hasPlayedTimebank2, setHasPlayedTimebank2] = useState(false);
    const timebankAudio1 = useRef<HTMLAudioElement | null>(null);
    const timebankAudio2 = useRef<HTMLAudioElement | null>(null);

    // Toggle entre BB e Chips
    const toggleDisplayMode = () => {
        setDisplayMode(prev => prev === 'bb' ? 'chips' : 'bb');
    };
    
    // Inicializar áudios do timebank
    useEffect(() => {
        if (tournamentMode) {
            timebankAudio1.current = new Audio(getTrainerAssetUrl('timebank1.mp3'));
            timebankAudio2.current = new Audio(getTrainerAssetUrl('timebank2.mp3'));
            console.log('🎵 Timebank audios initialized from CDN');
        }
    }, [tournamentMode]);
    
    // Resetar timebank quando novo spot é gerado
    useEffect(() => {
        if (currentSpot && !showFeedback && tournamentMode) {
            console.log('⏱️ Resetting timebank to 15s');
            setTimeLeft(15);
            setHasPlayedTimebank1(false);
            setHasPlayedTimebank2(false);
        }
    }, [currentSpot, showFeedback, tournamentMode]);
    
    // Countdown do timebank (apenas modo torneio)
    useEffect(() => {
        if (!tournamentMode || showFeedback || !currentSpot) {
            console.log('⏱️ Timebank countdown NOT active:', { tournamentMode, showFeedback, hasSpot: !!currentSpot });
            return;
        }
        
        console.log('⏱️ Timebank countdown ACTIVE');
        
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                const newTime = prev - 1;
                
                if (newTime % 5 === 0 || newTime <= 5) {
                    console.log(`⏱️ Timebank: ${newTime}s`);
                }
                
                // Tocar áudio em 8s
                if (newTime === 8 && !hasPlayedTimebank1 && timebankAudio1.current) {
                    console.log('🔊 Playing timebank1 audio (8s)');
                    timebankAudio1.current.play().catch(err => console.error('Erro ao tocar timebank1:', err));
                    setHasPlayedTimebank1(true);
                }
                
                // Tocar áudio em 4s
                if (newTime === 4 && !hasPlayedTimebank2 && timebankAudio2.current) {
                    console.log('🔊 Playing timebank2 audio (4s)');
                    timebankAudio2.current.play().catch(err => console.error('Erro ao tocar timebank2:', err));
                    setHasPlayedTimebank2(true);
                }
                
                // Tempo esgotado - contar como erro
                if (newTime <= 0) {
                    handleTimeExpired();
                    return 0;
                }
                
                return newTime;
            });
        }, 1000);
        
        return () => clearInterval(interval);
    }, [tournamentMode, showFeedback, currentSpot, hasPlayedTimebank1, hasPlayedTimebank2]);
    
    // Função para lidar com tempo esgotado
    const handleTimeExpired = () => {
        if (!currentSpot || showFeedback) return;
        
        console.log('⏰ Timebank expired - auto-folding');
        
        // Busca solução atualizada
        const currentSolution = solutions.find(s => s.id === currentSpot.solution.id);
        if (!currentSolution) return;
        
        const node = currentSolution.nodes.get(currentSpot.nodeId);
        if (!node) return;
        
        const handData = node.hands[currentSpot.playerHandName];
        if (!handData) return;
        
        // Procura a ação de Fold
        const foldActionIndex = node.actions.findIndex(a => a.type === 'F');
        
        if (foldActionIndex === -1) {
            // Não tem Fold disponível - marca como erro
            console.log('⚠️ No Fold action available - counting as mistake');
            setUserAction('TIMEOUT (No Fold)');
            setShowFeedback(true);
            
            const actualPhase = currentSpot.solution.tournamentPhase;
            saveSpotResult(userId, false, actualPhase);
            saveSpotHistory(
                userId, 
                currentSpot.playerHandName, 
                false, 
                actualPhase, 
                0,
                currentSpot.playerHand,
                currentSpot.solution.path || currentSpot.solution.id,
                currentSpot.nodeId
            );
            
            setStats(prev => ({
                totalQuestions: prev.totalQuestions + 1,
                correctAnswers: prev.correctAnswers,
                score: prev.score
            }));
            
            if (onSpotResult) {
                onSpotResult(false);
                setTimeout(() => generateNewSpot(), 5000);
            }
            return;
        }
        
        // Verifica se Fold é a ação correta (tem frequência > 0)
        const foldFrequency = handData.played[foldActionIndex] || 0;
        const isCorrect = foldFrequency > 0;
        
        console.log(`⏰ Auto-fold: ${isCorrect ? 'CORRECT' : 'WRONG'} (fold freq: ${(foldFrequency * 100).toFixed(1)}%)`);
        
        // Marca a ação como Fold
        setUserAction('Fold (Timeout)');
        setShowFeedback(true);
        
        // Salvar resultado
        const actualPhase = currentSpot.solution.tournamentPhase;
        saveSpotResult(userId, isCorrect, actualPhase);
        saveSpotHistory(
            userId, 
            currentSpot.playerHandName, 
            isCorrect, 
            actualPhase, 
            isCorrect ? 1 : 0, // 1 ponto se correto, 0 se errado
            currentSpot.playerHand,
            currentSpot.solution.path || currentSpot.solution.id,
            currentSpot.nodeId
        );
        
        console.log(`📊 Stats saved: ${isCorrect ? 'CORRECT' : 'WRONG'} - ${isCorrect ? 1 : 0} points - ${currentSpot.playerHand} - Phase: ${actualPhase}`);
        
        setStats(prev => ({
            totalQuestions: prev.totalQuestions + 1,
            correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
            score: isCorrect ? prev.score + 1 : prev.score
        }));
        
        // Callback para modo torneio
        if (onSpotResult) {
            onSpotResult(isCorrect);
            
            // Auto-avançar após 5 segundos
            setTimeout(() => {
                generateNewSpot();
            }, 5000);
        }
    };

    // Flag para evitar múltiplas gerações simultâneas
    const isGeneratingSpot = useRef(false);
    const hasInitialized = useRef(false);
    const retryCount = useRef(0);
    const maxRetries = 5;

    // Função para calcular average stack em BB
    const getAverageStackBB = (solution: AppData): number => {
        const stacks = solution.settings.handdata.stacks;
        const blinds = solution.settings.handdata.blinds;
        const bigBlind = Math.max(blinds[0], blinds[1]);
        const avgStack = stacks.reduce((a, b) => a + b, 0) / stacks.length;
        return avgStack / bigBlind;
    };

    // Sorteia tipo de spot baseado nas seleções
    const getRandomSpotType = (): string => {
        // Sorteia um dos tipos selecionados
        return randomElement(selectedSpotTypes);
    };

    // Sorteia quantos shovers baseado em quantas posições podem dar all-in
    const getNumberOfShovers = (maxShovers: number): number => {
        if (maxShovers < 2) return maxShovers; // Não é multiway se < 2
        
        const random = Math.random();
        
        if (maxShovers >= 5) {
            // Pode ter até 5 all-ins
            if (random < 0.70) return 2;
            if (random < 0.85) return 3;
            if (random < 0.95) return 4;
            return 5;
        } else if (maxShovers === 4) {
            // Pode ter até 4 all-ins
            if (random < 0.80) return 2;
            if (random < 0.95) return 3;
            return 4;
        } else if (maxShovers === 3) {
            // Pode ter até 3 all-ins
            if (random < 0.80) return 2;
            return 3;
        } else {
            // maxShovers === 2 (caso mínimo do multiway)
            return 2;
        }
    };

    // Filtra soluções pelas fases selecionadas e número de jogadores (sempre atualizado)
    const phaseSolutions = useMemo(() => {
        let filtered = solutions.filter(s => selectedPhases.includes(s.tournamentPhase));
        
        // Se playerCountFilter está definido, filtrar por número de jogadores
        if (playerCountFilter !== undefined) {
            filtered = filtered.filter(s => s.settings.handdata.stacks.length === playerCountFilter);
            console.log(`🎯 Filtering by player count: ${playerCountFilter} players`);
            console.log(`📊 Solutions found: ${filtered.length}`);
        }
        
        return filtered;
    }, [solutions, selectedPhases, playerCountFilter]);

    // Range fixo de EV: -0.5 a +1.5 BB
    const EV_RANGE = { min: -0.5, max: 1.5 };

    // Função auxiliar para obter nome da mão a partir de um combo
    const getHandNameFromCombo = (combo: string): string => {
        const rank1 = combo[0];
        const rank2 = combo[2];
        const suit1 = combo[1];
        const suit2 = combo[3];
        
        if (rank1 === rank2) {
            return `${rank1}${rank2}`; // Par (ex: "77")
        } else if (suit1 === suit2) {
            return `${rank1}${rank2}s`; // Suited (ex: "75s")
        } else {
            return `${rank1}${rank2}o`; // Offsuit (ex: "75o")
        }
    };

    // Gera spot do tipo "Any" - navega pela árvore sorteando combos e ações
    const generateAnySpot = useCallback(async (
        randomSolution: AppData,
        randomPlayerPosition: number,
        originalSolutionId: string
    ): Promise<{ nodeId: number; solution: AppData; villainActions: VillainAction[] } | null> => {
        console.log('\n🎲 === GENERATING ANY SPOT ===');
        console.log(`Hero position: ${randomPlayerPosition}`);
        
        const flatCombos = allCombos.flat();
        const villainActions: VillainAction[] = [];
        const blinds = randomSolution.settings.handdata.blinds;
        const bigBlind = Math.max(blinds[0], blinds[1]);
        
        let currentNodeId = 0;
        let workingSolution = randomSolution;
        let currentNode = workingSolution.nodes.get(currentNodeId);
        
        if (!currentNode) {
            console.error('❌ Initial node not found');
            return null;
        }
        
        const maxIterations = 50;
        let iterations = 0;
        
        // Navega até chegar no herói
        while (currentNode && currentNode.player !== randomPlayerPosition && iterations < maxIterations) {
            iterations++;
            const villainPosition = currentNode.player;
            
            console.log(`\n🎯 Villain turn - Position ${villainPosition} at node ${currentNodeId}`);
            console.log(`   Available actions:`, currentNode.actions.map(a => `${a.type} (${a.amount || 0})`));
            
            // 1. Sortear um combo aleatório para este vilão
            const randomCombo = randomElement(flatCombos);
            const handName = getHandNameFromCombo(randomCombo);
            
            console.log(`   🎴 Random combo for villain: ${randomCombo} (${handName})`);
            
            // 2. Verificar se este combo tem dados neste node
            const handData = currentNode.hands[handName];
            
            if (!handData || !handData.played) {
                console.log(`   ⚠️ No data for ${handName}, villain will fold`);
                
                // Fold
                const foldAction = currentNode.actions.find(a => a.type === 'F');
                if (!foldAction || !foldAction.node) {
                    console.error('❌ No fold action available');
                    return null;
                }
                
                villainActions.push({
                    position: villainPosition,
                    action: 'Fold',
                    combo: randomCombo
                });
                
                currentNodeId = foldAction.node;
            } else {
                // 3. Encontrar a ação com maior frequência para este combo
                let maxFreq = 0;
                let bestActionIndex = -1;
                
                handData.played.forEach((freq, idx) => {
                    if (freq > maxFreq) {
                        maxFreq = freq;
                        bestActionIndex = idx;
                    }
                });
                
                if (bestActionIndex === -1 || maxFreq === 0) {
                    console.log(`   ⚠️ No valid action for ${handName}, villain will fold`);
                    
                    const foldAction = currentNode.actions.find(a => a.type === 'F');
                    if (!foldAction || !foldAction.node) {
                        console.error('❌ No fold action available');
                        return null;
                    }
                    
                    villainActions.push({
                        position: villainPosition,
                        action: 'Fold',
                        combo: randomCombo
                    });
                    
                    currentNodeId = foldAction.node;
                } else {
                    // 4. Executar a ação mais frequente
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
            
            // Verificar se chegou em node terminal
            if (currentNodeId === 0) {
                console.log('⚠️ Reached terminal node before hero, trying again...');
                return null;
            }
            
            // Carregar próximo node se necessário
            if (!workingSolution.nodes.has(currentNodeId)) {
                console.log(`   📥 Loading node ${currentNodeId}...`);
                const updated = await loadNodesForSolution(originalSolutionId, [currentNodeId]);
                
                if (updated && updated.nodes.has(currentNodeId)) {
                    workingSolution = updated;
                    console.log(`   ✅ Node ${currentNodeId} loaded`);
                } else {
                    console.error('❌ Failed to load node', currentNodeId);
                    return null;
                }
            }
            
            currentNode = workingSolution.nodes.get(currentNodeId);
            
            if (!currentNode) {
                console.error('❌ Node not found:', currentNodeId);
                return null;
            }
        }
        
        if (iterations >= maxIterations) {
            console.error('❌ Max iterations reached in Any spot generation');
            return null;
        }
        
        if (!currentNode || currentNode.player !== randomPlayerPosition) {
            console.error('❌ Did not reach hero position');
            return null;
        }
        
        console.log(`\n✅ Reached hero at position ${randomPlayerPosition}, node ${currentNodeId}`);
        console.log(`📊 Villain actions history:`, villainActions);
        
        return {
            nodeId: currentNodeId,
            solution: workingSolution,
            villainActions
        };
    }, [loadNodesForSolution]);


    // Sorteia um novo spot (carrega sob demanda)
    const generateNewSpot = useCallback(async () => {
        // Evita múltiplas gerações simultâneas
        if (isGeneratingSpot.current) {
            console.log('⚠️ Already generating a spot, skipping...');
            return;
        }

        if (phaseSolutions.length === 0) {
            console.log('No solutions for this phase');
            return;
        }

        isGeneratingSpot.current = true;

        // DEBUG: Mostra informações sobre as fases
        console.log('🎯 Selected Phases:', selectedPhases);
        console.log('🎲 Selected Spot Types:', selectedSpotTypes);
        console.log('📊 Total solutions available:', phaseSolutions.length);
        console.log('📦 Phase distribution:', phaseSolutions.reduce((acc, s) => {
            acc[s.tournamentPhase] = (acc[s.tournamentPhase] || 0) + 1;
            return acc;
        }, {} as Record<string, number>));

        // Determinar tipo de spot
        const spotType = getRandomSpotType();
        console.log('🎲 Spot type selected:', spotType);

        // Filtrar soluções baseado no tipo de spot
        let filteredSolutions = [...phaseSolutions];
        
        if (spotType === 'vs Open') {
            // Para vs Open, precisamos de average stack >= 13.2bb
            filteredSolutions = phaseSolutions.filter(s => {
                const avgStack = getAverageStackBB(s);
                return avgStack >= 13.2;
            });
            console.log(`📊 Filtered for vs Open (avg stack >= 13.2bb): ${filteredSolutions.length} solutions`);
            
            if (filteredSolutions.length === 0) {
                console.log('⚠️ No solutions with avg stack >= 13.2bb, trying again...');
                isGeneratingSpot.current = false;
                setTimeout(() => generateNewSpot(), 100);
                return;
            }
        }

        // 1. Sorteia uma solução aleatória
        const randomSolution: AppData = randomElement(filteredSolutions);
        console.log('🎲 Selected solution:', randomSolution.fileName);
        console.log('🏆 Tournament phase:', randomSolution.tournamentPhase);
        console.log('📊 Average stack:', getAverageStackBB(randomSolution).toFixed(1) + 'bb');
        console.log('Solution has path:', !!randomSolution.path);
        console.log('Solution path:', randomSolution.path);

        // Valida se a solução tem path
        if (!randomSolution.path) {
            console.error('❌ Solution has no path, trying another...');
            isGeneratingSpot.current = false;
            setTimeout(() => generateNewSpot(), 100);
            return;
        }

        // 2. Carrega nodes se necessário (apenas desta solução)
        let currentSolution = randomSolution;
        const originalSolutionId = randomSolution.id; // Guarda o ID original para usar nas próximas cargas
        
        if (!randomSolution.nodes.has(0)) {
            console.log('Loading nodes for:', randomSolution.fileName);
            
            // Verifica se já tentou muitas vezes
            if (retryCount.current >= maxRetries) {
                console.error(`❌ Max retries (${maxRetries}) reached. Stopping.`);
                isGeneratingSpot.current = false;
                retryCount.current = 0;
                return;
            }
            
            retryCount.current++;
            console.log(`🔄 Attempt ${retryCount.current}/${maxRetries}`);
            
            // Chama loadNodesForSolution e recebe a solução atualizada diretamente
            const loadedSolution = await loadNodesForSolution(originalSolutionId);
            
            if (!loadedSolution || !loadedSolution.nodes.has(0)) {
                console.error('❌ Failed to load nodes');
                isGeneratingSpot.current = false;
                // Tenta novamente com outra solução após um delay maior
                setTimeout(() => generateNewSpot(), 500);
                return;
            }
            
            console.log('✅ Nodes carregados com sucesso via retorno direto!');
            console.log('✅ Nodes size:', loadedSolution.nodes.size);
            currentSolution = loadedSolution;
            retryCount.current = 0; // Reset counter on success
        } else {
            console.log('✅ Node 0 already loaded');
            retryCount.current = 0; // Reset counter if already loaded
        }
        
        // 4. Sorteia posição do herói baseado no tipo de spot
        const numPlayers = currentSolution.settings.handdata.stacks.length;
        const bbPosition = numPlayers - 1; // BB é sempre o último
        const blinds = currentSolution.settings.handdata.blinds;
        const bigBlind = Math.max(blinds[0], blinds[1]);
        
        let randomPlayerPosition: number;
        let raiserPosition: number | null = null;
        let shoverPositions: number[] = []; // Para vs Multiway shove
        let villainActions: VillainAction[] = []; // Para tipo Any
        
        // Se for tipo "Any", usa lógica especial de navegação
        if (spotType === 'Any') {
            // Sorteia posição do herói (qualquer posição)
            randomPlayerPosition = Math.floor(Math.random() * numPlayers);
            console.log(`✅ [Any] Sorteou herói na posição ${randomPlayerPosition} de ${numPlayers} jogadores`);
            
            // Gera o spot navegando pela árvore com combos aleatórios
            const anySpotResult = await generateAnySpot(currentSolution, randomPlayerPosition, originalSolutionId);
            
            if (!anySpotResult) {
                console.log('⚠️ Failed to generate Any spot, trying again...');
                isGeneratingSpot.current = false;
                setTimeout(() => generateNewSpot(), 100);
                return;
            }
            
            // Atualiza variáveis com resultado
            currentSolution = anySpotResult.solution;
            const currentNodeId = anySpotResult.nodeId;
            villainActions = anySpotResult.villainActions;
            const currentNode = currentSolution.nodes.get(currentNodeId);
            
            if (!currentNode) {
                console.error('❌ Node not found after Any spot generation');
                isGeneratingSpot.current = false;
                return;
            }
            
            // Pula para a parte de seleção de mão do herói
            console.log(`✅ Any spot generated successfully at node ${currentNodeId}`);
            
            // 5. Pega o range do jogador nessa posição
            const handMatrix = generateHandMatrix();
            const allHands = handMatrix.flat();
            
            // Filtra mãos que são jogadas (frequência > 0)
            const playedHands = allHands.filter((handName) => {
                const handData = currentNode!.hands[handName];
                if (!handData) return false;
                const totalFreq = handData.played.reduce((sum, freq) => sum + freq, 0);
                return totalFreq > 0;
            });

            if (playedHands.length === 0) {
                console.error('No hands played in this spot');
                isGeneratingSpot.current = false;
                return;
            }

            console.log(`✅ Found ${playedHands.length} playable hands in range`);

            // 6. Filtra mãos baseado no range de EV fixo (-0.5 a +1.5 BB)
            const difficultHands = playedHands.filter((handName) => {
                const handData = currentNode!.hands[handName];
                if (!handData || !handData.evs) return false;
                
                // Pega EVs de todas as ações com frequência > 0
                const validEvs = handData.evs.filter((ev, idx) => handData.played[idx] > 0);
                
                if (validEvs.length < 2) return false; // Precisa ter pelo menos 2 ações válidas
                
                const maxEv = Math.max(...validEvs);
                
                // Verifica se o EV está no range fixo
                return maxEv >= EV_RANGE.min && maxEv <= EV_RANGE.max;
            });

            console.log(`🎯 Filtered to ${difficultHands.length} hands (EV: ${EV_RANGE.min.toFixed(2)} to ${EV_RANGE.max.toFixed(2)} BB)`);

            // Se não encontrou mãos difíceis, pega as mãos com os PIORES EVs
            let handsToUse: string[];
            
            if (difficultHands.length > 0) {
                handsToUse = difficultHands;
            } else {
                console.log('⚠️ No marginal hands found, selecting hands with worst EVs');
                
                // Ordena mãos por EV (do pior para o melhor)
                const handsWithEV = playedHands
                    .map((handName) => {
                        const handData = currentNode!.hands[handName];
                        if (!handData || !handData.evs) return { handName, maxEv: Infinity };
                        
                        const validEvs = handData.evs.filter((ev, idx) => handData.played[idx] > 0);
                        const maxEv = validEvs.length > 0 ? Math.max(...validEvs) : Infinity;
                        
                        return { handName, maxEv };
                    })
                    .filter(item => item.maxEv !== Infinity)
                    .sort((a, b) => a.maxEv - b.maxEv); // Ordena do pior (menor) para o melhor (maior)
                
                // Pega até 30% das mãos com pior EV (mínimo 5, máximo 50)
                const worstHandsCount = Math.max(5, Math.min(50, Math.floor(handsWithEV.length * 0.3)));
                handsToUse = handsWithEV.slice(0, worstHandsCount).map(item => item.handName);
                
                console.log(`📉 Using ${handsToUse.length} hands with worst EVs (range: ${handsWithEV[0]?.maxEv.toFixed(2)} to ${handsWithEV[worstHandsCount - 1]?.maxEv.toFixed(2)} BB)`);
            }

            // 6.5. FILTRO ADICIONAL: Remove mãos extremamente marginais (diferença de EV < 0.05 BB)
            const MIN_EV_DIFF = 0.05; // Diferença mínima de EV entre ações
            const nonMarginalHands = handsToUse.filter((handName) => {
                const handData = currentNode!.hands[handName];
                if (!handData || !handData.evs) return true; // Se não tem EVs, aceita
                
                const validEvs = handData.evs.filter((ev, idx) => handData.played[idx] > 0);
                if (validEvs.length < 2) return true; // Se tem apenas 1 ação, aceita
                
                // Ordena EVs do maior para o menor
                const sortedEvs = [...validEvs].sort((a, b) => b - a);
                const evDiff = sortedEvs[0] - sortedEvs[1];
                
                // Aceita apenas se a diferença for >= 0.05 BB
                return evDiff >= MIN_EV_DIFF;
            });

            console.log(`🔍 Filtered out marginal hands: ${handsToUse.length} → ${nonMarginalHands.length} hands (min EV diff: ${MIN_EV_DIFF} BB)`);

            // Se filtrou TODAS as mãos, usa as originais (melhor ter spot marginal que travar)
            const finalHandsToUse = nonMarginalHands.length > 0 ? nonMarginalHands : handsToUse;
            
            if (nonMarginalHands.length === 0) {
                console.log(`⚠️ All hands are marginal - using original pool of ${handsToUse.length} hands`);
            }

            // 7. Sorteia uma mão do range filtrado
            const randomHandName = randomElement(finalHandsToUse);
            const handData = currentNode.hands[randomHandName];
            
            // Log detalhado da mão selecionada
            if (handData && handData.evs) {
                const validEvs = handData.evs.filter((ev, idx) => handData.played[idx] > 0);
                if (validEvs.length >= 2) {
                    const sortedEvs = [...validEvs].sort((a, b) => b - a);
                    const evDiff = sortedEvs[0] - sortedEvs[1];
                    console.log(`✅ Selected hand: ${randomHandName} (best EV: ${sortedEvs[0].toFixed(2)} BB, 2nd best: ${sortedEvs[1].toFixed(2)} BB, diff: ${evDiff.toFixed(2)} BB)`);
                } else {
                    console.log(`✅ Selected hand: ${randomHandName} (single action)`);
                }
            } else {
                console.log(`✅ Selected hand: ${randomHandName}`);
            }

            // 8. Filtra combos que pertencem à mão selecionada
            const flatCombos = allCombos.flat();
            const handCombos = flatCombos.filter(combo => {
                // Extrai os ranks do combo (ex: "7s5h" -> "75")
                const rank1 = combo[0];
                const rank2 = combo[2];
                const suit1 = combo[1];
                const suit2 = combo[3];
                
                // Verifica se o combo pertence à mão
                const comboHand = rank1 === rank2 
                    ? `${rank1}${rank2}` // Par (ex: "77")
                    : suit1 === suit2 
                        ? `${rank1}${rank2}s` // Suited (ex: "75s")
                        : `${rank1}${rank2}o`; // Offsuit (ex: "75o")
                
                return comboHand === randomHandName || 
                       (rank1 !== rank2 && `${rank2}${rank1}${comboHand.slice(-1)}` === randomHandName);
            });
            
            if (handCombos.length === 0) {
                console.error('No combos found for hand:', randomHandName);
                isGeneratingSpot.current = false;
                return;
            }
            
            // Sorteia um combo da mão
            const randomCombo = randomElement(handCombos);
            
            console.log(`✅ Selected combo from ${randomHandName}: ${randomCombo} (${handCombos.length} combos available)`);

            setCurrentSpot({
                solution: currentSolution,
                nodeId: currentNodeId,
                playerPosition: randomPlayerPosition,
                playerHand: randomCombo,
                playerHandName: randomHandName,
                spotType: spotType,
                villainActions: villainActions
            });

            setUserAction(null);
            setShowFeedback(false);
            isGeneratingSpot.current = false;
            retryCount.current = 0;
            console.log('✅✅✅ Any spot generation completed successfully!');
            return;
        }
        
        if (spotType === 'RFI') {
            // Para RFI, sorteia qualquer posição EXCETO BB
            do {
                randomPlayerPosition = Math.floor(Math.random() * numPlayers);
            } while (randomPlayerPosition === bbPosition);
            
            console.log(`✅ [RFI] Sorteou posição ${randomPlayerPosition} de ${numPlayers} jogadores (BB = ${bbPosition})`);
        } else if (spotType === 'vs Open') {
            // Para vs Open, sorteia posição do herói (BB até primeira posição -1)
            // Hero NÃO pode ser a primeira posição (pois alguém precisa abrir antes)
            randomPlayerPosition = Math.floor(Math.random() * (numPlayers - 1)) + 1; // De posição 1 até BB
            
            console.log(`✅ [vs Open] Sorteou herói na posição ${randomPlayerPosition} de ${numPlayers} jogadores`);
            
            // Listar posições que podem dar raise (todas antes do herói)
            const possibleRaisers = Array.from({ length: randomPlayerPosition }, (_, i) => i);
            console.log(`📋 Posições que podem dar open:`, possibleRaisers);
            
            // Tentar encontrar um raiser válido
            let foundValidRaiser = false;
            const shuffledRaisers = possibleRaisers.sort(() => Math.random() - 0.5); // Embaralha
            
            for (const potentialRaiser of shuffledRaisers) {
                console.log(`\n🔍 Verificando se posição ${potentialRaiser} pode dar raise...`);
                
                // Navegar até essa posição e verificar se há raise disponível
                let checkNode: NodeData | undefined = currentSolution.nodes.get(0);
                let checkNodeId = 0;
                let tempSolution = currentSolution;
                
                // Navegar até a posição do potencial raiser
                while (checkNode && checkNode.player !== potentialRaiser) {
                    const foldAction = checkNode.actions.find(a => a.type === 'F');
                    if (!foldAction || !foldAction.node) break;
                    
                    checkNodeId = foldAction.node;
                    if (!tempSolution.nodes.has(checkNodeId)) {
                        // Carregar node
                        const updated = await loadNodesForSolution(originalSolutionId, [checkNodeId]);
                        if (updated) tempSolution = updated;
                    }
                    checkNode = tempSolution.nodes.get(checkNodeId);
                }
                
                if (checkNode && checkNode.player === potentialRaiser) {
                    // Verificar se há ação de raise com amount = 2x BB
                    const raiseActionIndex = checkNode.actions.findIndex(a => {
                        if (a.type !== 'R') return false;
                        const raiseBB = a.amount / bigBlind;
                        const isRaise2BB = Math.abs(raiseBB - 2.0) < 0.1; // Tolerância de 0.1 BB
                        console.log(`   Ação tipo ${a.type}, amount: ${a.amount}, BB: ${raiseBB.toFixed(2)}, é 2BB? ${isRaise2BB}`);
                        return isRaise2BB;
                    });
                    
                    if (raiseActionIndex >= 0) {
                        // Verificar se ALGUMA mão tem frequência > 0 para essa ação
                        const allHands = Object.keys(checkNode.hands);
                        let hasFrequency = false;
                        let totalFreq = 0;
                        
                        for (const handName of allHands) {
                            const handData = checkNode.hands[handName];
                            if (handData && handData.played[raiseActionIndex] > 0) {
                                hasFrequency = true;
                                totalFreq += handData.played[raiseActionIndex];
                            }
                        }
                        
                        if (hasFrequency) {
                            console.log(`✅ Posição ${potentialRaiser} pode dar raise 2BB (total freq: ${(totalFreq * 100).toFixed(1)}%)`);
                            raiserPosition = potentialRaiser;
                            foundValidRaiser = true;
                            break;
                        } else {
                            console.log(`❌ Posição ${potentialRaiser} tem ação de raise 2BB mas nenhuma mão com frequência`);
                        }
                    } else {
                        console.log(`❌ Posição ${potentialRaiser} não tem ação de raise 2BB`);
                    }
                }
            }
            
            if (!foundValidRaiser) {
                console.log('⚠️ Nenhuma posição antes do herói tem raise válido. Tentando outra solução...');
                isGeneratingSpot.current = false;
                setTimeout(() => generateNewSpot(), 100);
                return;
            }
            
            console.log(`\n🎯 Raiser selecionado: posição ${raiserPosition}`);
        } else if (spotType === 'vs Shove') {
            // Para vs Shove, sorteia posição do herói (posição 1 até BB)
            // Hero NÃO pode ser a primeira posição (pois alguém precisa dar shove antes)
            randomPlayerPosition = Math.floor(Math.random() * (numPlayers - 1)) + 1; // De posição 1 até BB
            
            console.log(`✅ [vs Shove] Sorteou herói na posição ${randomPlayerPosition} de ${numPlayers} jogadores`);
            
            // Listar posições que podem dar shove (todas antes do herói)
            const possibleShovers = Array.from({ length: randomPlayerPosition }, (_, i) => i);
            console.log(`📋 Posições que podem dar shove:`, possibleShovers);
            
            // Tentar encontrar um shover válido
            let foundValidShover = false;
            const shuffledShovers = possibleShovers.sort(() => Math.random() - 0.5); // Embaralha
            
            for (const potentialShover of shuffledShovers) {
                console.log(`\n🔍 Verificando se posição ${potentialShover} pode dar shove...`);
                
                // Stack do potencial shover
                const shoverStack = currentSolution.settings.handdata.stacks[potentialShover];
                console.log(`   Stack da posição ${potentialShover}: ${shoverStack} (${(shoverStack / bigBlind).toFixed(1)}bb)`);
                
                // Navegar até essa posição e verificar se há all-in disponível
                let checkNode: NodeData | undefined = currentSolution.nodes.get(0);
                let checkNodeId = 0;
                let tempSolution = currentSolution;
                
                // Navegar até a posição do potencial shover
                while (checkNode && checkNode.player !== potentialShover) {
                    const foldAction = checkNode.actions.find(a => a.type === 'F');
                    if (!foldAction || !foldAction.node) break;
                    
                    checkNodeId = foldAction.node;
                    if (!tempSolution.nodes.has(checkNodeId)) {
                        // Carregar node
                        const updated = await loadNodesForSolution(originalSolutionId, [checkNodeId]);
                        if (updated) tempSolution = updated;
                    }
                    checkNode = tempSolution.nodes.get(checkNodeId);
                }
                
                if (checkNode && checkNode.player === potentialShover) {
                    // Verificar se há ação de all-in (raise com amount > 50% do stack)
                    const allinActionIndex = checkNode.actions.findIndex(a => {
                        if (a.type !== 'R') return false;
                        const isAllin = a.amount > (shoverStack * 0.5);
                        console.log(`   Ação tipo ${a.type}, amount: ${a.amount}, stack: ${shoverStack}, é all-in? ${isAllin}`);
                        return isAllin;
                    });
                    
                    if (allinActionIndex >= 0) {
                        // Verificar se ALGUMA mão tem frequência > 5% para essa ação
                        const allHands = Object.keys(checkNode.hands);
                        let totalFreq = 0;
                        
                        for (const handName of allHands) {
                            const handData = checkNode.hands[handName];
                            if (handData && handData.played[allinActionIndex] > 0) {
                                totalFreq += handData.played[allinActionIndex];
                            }
                        }
                        
                        const hasMinFrequency = totalFreq > 0.05; // 5%
                        
                        if (hasMinFrequency) {
                            console.log(`✅ Posição ${potentialShover} pode dar all-in (total freq: ${(totalFreq * 100).toFixed(1)}%)`);
                            raiserPosition = potentialShover; // Reutiliza variável raiserPosition para shover
                            foundValidShover = true;
                            break;
                        } else {
                            console.log(`❌ Posição ${potentialShover} tem all-in mas frequência < 5% (${(totalFreq * 100).toFixed(1)}%)`);
                        }
                    } else {
                        console.log(`❌ Posição ${potentialShover} não tem ação de all-in`);
                    }
                }
            }
            
            if (!foundValidShover) {
                console.log('⚠️ Nenhuma posição antes do herói tem all-in válido. Tentando outra solução...');
                isGeneratingSpot.current = false;
                setTimeout(() => generateNewSpot(), 100);
                return;
            }
            
            console.log(`\n🎯 Shover selecionado: posição ${raiserPosition}`);
        } else if (spotType === 'vs Multiway shove') {
            // Para vs Multiway shove, sorteia posição do herói baseado no número de jogadores
            const sbPosition = numPlayers === 2 ? 0 : numPlayers - 2;
            const btnPosition = numPlayers === 2 ? 0 : numPlayers - 3;
            const coPosition = numPlayers >= 6 ? numPlayers - 4 : -1;
            
            let validHeroPositions: number[] = [];
            
            if (numPlayers === 3) {
                // Mesa 3 handed: herói só pode ser BB
                validHeroPositions = [bbPosition];
            } else if (numPlayers === 4) {
                // Mesa 4 handed: herói pode ser SB ou BB
                validHeroPositions = [sbPosition, bbPosition];
            } else if (numPlayers === 5) {
                // Mesa 5 handed: herói pode ser BB, SB, BTN
                validHeroPositions = [bbPosition, sbPosition, btnPosition];
            } else if (numPlayers >= 6) {
                // Mesa 6+ handed: herói pode ser BB, SB, BTN, CO
                validHeroPositions = [bbPosition, sbPosition, btnPosition, coPosition];
            }
            
            // Sorteia posição do herói
            randomPlayerPosition = randomElement(validHeroPositions);
            console.log(`✅ [vs Multiway shove] Sorteou herói na posição ${randomPlayerPosition} de ${numPlayers} jogadores`);
            console.log(`📋 Posições válidas para herói:`, validHeroPositions);
            
            // Determina quantas posições PODEM dar all-in (todas antes do herói)
            const maxShovers = randomPlayerPosition;
            console.log(`📊 Máximo de shovers possíveis: ${maxShovers}`);
            
            if (maxShovers < 2) {
                console.log('⚠️ Menos de 2 posições podem dar shove. Tentando outra solução...');
                isGeneratingSpot.current = false;
                setTimeout(() => generateNewSpot(), 100);
                return;
            }
            
            // Sorteia quantos shovers
            const numShovers = getNumberOfShovers(maxShovers);
            console.log(`🎲 Sorteou ${numShovers} shovers`);
            
            // Seleciona quais posições darão shove (todas antes do herói)
            const possibleShoverPositions = Array.from({ length: randomPlayerPosition }, (_, i) => i);
            
            // Embaralha e pega as primeiras numShovers posições
            const shuffled = possibleShoverPositions.sort(() => Math.random() - 0.5);
            const selectedShoverPositions = shuffled.slice(0, numShovers).sort((a, b) => a - b);
            
            console.log(`📋 Posições que darão all-in:`, selectedShoverPositions);
            
            // Navegar até cada shover e verificar se todos têm all-in disponível
            let allShoversValid = true;
            const shoverStacks: number[] = [];
            
            for (const shoverPos of selectedShoverPositions) {
                const shoverStack = currentSolution.settings.handdata.stacks[shoverPos];
                shoverStacks.push(shoverStack);
                
                console.log(`\n🔍 Verificando se posição ${shoverPos} pode dar shove...`);
                console.log(`   Stack da posição ${shoverPos}: ${shoverStack} (${(shoverStack / bigBlind).toFixed(1)}bb)`);
                
                // Navegar até essa posição
                let checkNode: NodeData | undefined = currentSolution.nodes.get(0);
                let checkNodeId = 0;
                let tempSolution = currentSolution;
                
                // Simular navegação: posições antes do shover atual foldam ou dão shove
                let navigationPath = 0;
                while (checkNode && checkNode.player !== shoverPos) {
                    const currentPlayer = checkNode.player;
                    
                    // Se este jogador é um dos shovers anteriores, ele dá shove
                    if (selectedShoverPositions.includes(currentPlayer) && currentPlayer < shoverPos) {
                        // Procura ação de all-in
                        const prevShoverStack = tempSolution.settings.handdata.stacks[currentPlayer];
                        const allinAction = checkNode.actions.find(a => 
                            a.type === 'R' && a.amount > (prevShoverStack * 0.5)
                        );
                        
                        if (!allinAction || !allinAction.node) {
                            console.log(`❌ Shover anterior (pos ${currentPlayer}) não tem all-in`);
                            allShoversValid = false;
                            break;
                        }
                        
                        checkNodeId = allinAction.node;
                    } else {
                        // Senão, folda
                        const foldAction = checkNode.actions.find(a => a.type === 'F');
                        if (!foldAction || !foldAction.node) {
                            console.log(`❌ Posição ${currentPlayer} não tem fold`);
                            allShoversValid = false;
                            break;
                        }
                        
                        checkNodeId = foldAction.node;
                    }
                    
                    // Carrega o próximo node se necessário
                    if (!tempSolution.nodes.has(checkNodeId)) {
                        const updated = await loadNodesForSolution(originalSolutionId, [checkNodeId]);
                        if (updated) tempSolution = updated;
                    }
                    
                    checkNode = tempSolution.nodes.get(checkNodeId);
                    navigationPath++;
                    
                    if (navigationPath > 20) {
                        console.log(`❌ Navegação muito longa (> 20 steps)`);
                        allShoversValid = false;
                        break;
                    }
                }
                
                if (!allShoversValid) break;
                
                // Verificar se este jogador tem all-in disponível
                if (checkNode && checkNode.player === shoverPos) {
                    const allinActionIndex = checkNode.actions.findIndex(a => {
                        if (a.type !== 'R') return false;
                        const isAllin = a.amount > (shoverStack * 0.5);
                        return isAllin;
                    });
                    
                    if (allinActionIndex < 0) {
                        console.log(`❌ Posição ${shoverPos} não tem ação de all-in`);
                        allShoversValid = false;
                        break;
                    }
                    
                    console.log(`✅ Posição ${shoverPos} pode dar all-in`);
                }
            }
            
            if (!allShoversValid) {
                console.log('⚠️ Nem todos os shovers têm all-in válido. Tentando outra solução...');
                isGeneratingSpot.current = false;
                setTimeout(() => generateNewSpot(), 100);
                return;
            }
            
            console.log(`\n🎯 Shovers selecionados:`, selectedShoverPositions);
            
            // Armazena as posições dos shovers (será usado na navegação)
            shoverPositions = selectedShoverPositions;
        } else {
            // Outros tipos de spot (futuro)
            randomPlayerPosition = Math.floor(Math.random() * numPlayers);
        }
        
        // 5. Navega pela árvore até chegar na posição do hero
        let currentNodeId = 0;
        let currentNode: NodeData | undefined = currentSolution.nodes.get(currentNodeId);
        
        if (!currentNode) {
            console.error('❌ Node 0 not found');
            isGeneratingSpot.current = false;
            return;
        }
        
        console.log('\n✅ Starting navigation from node 0');
        console.log(`🎯 Target hero position: ${randomPlayerPosition}`);
        if (spotType === 'vs Open') {
            console.log(`🎯 Raiser position: ${raiserPosition}`);
        }
        
        // Navega pela árvore baseado no tipo de spot
        let iterations = 0;
        const maxIterations = 20;
        let workingSolution = currentSolution;
        
        while (currentNode && currentNode.player !== randomPlayerPosition && iterations < maxIterations) {
            iterations++;
            console.log(`\n🎲 Iteration ${iterations}: Current player = ${currentNode.player}, Target hero = ${randomPlayerPosition}`);
            
            // Verifica se há ações disponíveis
            if (!currentNode.actions || currentNode.actions.length === 0) {
                console.error('❌ No actions available at node', currentNodeId);
                isGeneratingSpot.current = false;
                return;
            }
            
            let selectedAction;
            
            if (spotType === 'vs Open' && currentNode.player === raiserPosition) {
                // Este é o raiser - deve dar raise 2BB
                console.log(`👑 Posição ${currentNode.player} é o RAISER - dando raise 2BB...`);
                
                const raiseActionIndex = currentNode.actions.findIndex(a => {
                    if (a.type !== 'R') return false;
                    const raiseBB = a.amount / bigBlind;
                    const isRaise2BB = Math.abs(raiseBB - 2.0) < 0.1;
                    return isRaise2BB;
                });
                
                if (raiseActionIndex === -1) {
                    console.error('❌ Raise 2BB action not found at raiser position!');
                    isGeneratingSpot.current = false;
                    setTimeout(() => generateNewSpot(), 100);
                    return;
                }
                
                selectedAction = currentNode.actions[raiseActionIndex];
                console.log(`   ✅ Player ${currentNode.player} → Raise 2BB`);
            } else if (spotType === 'vs Shove' && currentNode.player === raiserPosition) {
                // Este é o shover - deve dar all-in
                console.log(`🚀 Posição ${currentNode.player} é o SHOVER - dando all-in...`);
                
                const shoverStack = workingSolution.settings.handdata.stacks[currentNode.player];
                const allinActionIndex = currentNode.actions.findIndex(a => {
                    if (a.type !== 'R') return false;
                    const isAllin = a.amount > (shoverStack * 0.5);
                    return isAllin;
                });
                
                if (allinActionIndex === -1) {
                    console.error('❌ All-in action not found at shover position!');
                    isGeneratingSpot.current = false;
                    setTimeout(() => generateNewSpot(), 100);
                    return;
                }
                
                selectedAction = currentNode.actions[allinActionIndex];
                console.log(`   ✅ Player ${currentNode.player} → All-in (${selectedAction.amount})`);
            } else if (spotType === 'vs Multiway shove' && shoverPositions.includes(currentNode.player)) {
                // Este é um dos shovers no multiway - deve dar all-in
                console.log(`🚀 Posição ${currentNode.player} é um dos SHOVERS (multiway) - dando all-in...`);
                
                const shoverStack = workingSolution.settings.handdata.stacks[currentNode.player];
                const allinActionIndex = currentNode.actions.findIndex(a => {
                    if (a.type !== 'R') return false;
                    const isAllin = a.amount > (shoverStack * 0.5);
                    return isAllin;
                });
                
                if (allinActionIndex === -1) {
                    console.error('❌ All-in action not found at shover position!');
                    isGeneratingSpot.current = false;
                    setTimeout(() => generateNewSpot(), 100);
                    return;
                }
                
                selectedAction = currentNode.actions[allinActionIndex];
                console.log(`   ✅ Player ${currentNode.player} → All-in (${selectedAction.amount})`);
            } else {
                // Todos os outros jogadores antes do hero: FOLD
                const foldActionIndex = currentNode.actions.findIndex(a => a.type === 'F');
                
                if (foldActionIndex === -1) {
                    console.error('❌ No fold action available at node', currentNodeId);
                    console.error('Available actions:', currentNode.actions.map(a => a.type));
                    isGeneratingSpot.current = false;
                    return;
                }
                
                selectedAction = currentNode.actions[foldActionIndex];
                console.log(`   Player ${currentNode.player} → Fold`);
            }
            
            // Navega para o próximo node
            const nextNodeId = selectedAction.node;
            if (!nextNodeId || nextNodeId === 0) {
                console.log('⚠️ Terminal action after fold, generating new spot...');
                isGeneratingSpot.current = false;
                await generateNewSpot();
                return;
            }
            
            // Carrega próximo node se necessário
            if (!workingSolution.nodes.has(nextNodeId)) {
                console.log(`📥 Loading node ${nextNodeId}...`);
                const updated = await loadNodesForSolution(originalSolutionId, [nextNodeId]);
                
                if (updated && updated.nodes.has(nextNodeId)) {
                    workingSolution = updated;
                    console.log(`✅ Node ${nextNodeId} loaded successfully`);
                } else {
                    console.error('❌ Failed to load node', nextNodeId);
                    isGeneratingSpot.current = false;
                    setTimeout(() => generateNewSpot(), 100);
                    return;
                }
            }
            
            currentNodeId = nextNodeId;
            currentNode = workingSolution.nodes.get(currentNodeId);
            
            if (!currentNode) {
                console.error('❌ Node not found:', currentNodeId);
                isGeneratingSpot.current = false;
                return;
            }
        }
        
        if (iterations >= maxIterations) {
            console.error('❌ Max iterations reached, generating new spot...');
            isGeneratingSpot.current = false;
            await generateNewSpot();
            return;
        }
        
        console.log(`✅ Reached hero position ${randomPlayerPosition} at node ${currentNodeId}`);
        console.log(`📊 Available actions at this node:`, currentNode.actions.map(a => `${a.type} (node: ${a.node})`));

        // 5. Pega o range do jogador nessa posição
        const handMatrix = generateHandMatrix();
        const allHands = handMatrix.flat();
        
        // Filtra mãos que são jogadas (frequência > 0)
        const playedHands = allHands.filter((handName) => {
            const handData = currentNode!.hands[handName];
            if (!handData) return false;
            const totalFreq = handData.played.reduce((sum, freq) => sum + freq, 0);
            return totalFreq > 0;
        });

        if (playedHands.length === 0) {
            console.error('No hands played in this spot');
            isGeneratingSpot.current = false;
            return;
        }

        console.log(`✅ Found ${playedHands.length} playable hands in range`);

        // 6. Filtra mãos baseado no range de EV fixo (-0.5 a +1.5 BB)
        const difficultHands = playedHands.filter((handName) => {
            const handData = currentNode!.hands[handName];
            if (!handData || !handData.evs) return false;
            
            // Pega EVs de todas as ações com frequência > 0
            const validEvs = handData.evs.filter((ev, idx) => handData.played[idx] > 0);
            
            if (validEvs.length < 2) return false; // Precisa ter pelo menos 2 ações válidas
            
            const maxEv = Math.max(...validEvs);
            
            // Verifica se o EV está no range fixo
            return maxEv >= EV_RANGE.min && maxEv <= EV_RANGE.max;
        });

        console.log(`🎯 Filtered to ${difficultHands.length} hands (EV: ${EV_RANGE.min.toFixed(2)} to ${EV_RANGE.max.toFixed(2)} BB)`);

        // Se não encontrou mãos difíceis, pega as mãos com os PIORES EVs
        let handsToUse: string[];
        
        if (difficultHands.length > 0) {
            handsToUse = difficultHands;
        } else {
            console.log('⚠️ No marginal hands found, selecting hands with worst EVs');
            
            // Ordena mãos por EV (do pior para o melhor)
            const handsWithEV = playedHands
                .map((handName) => {
                    const handData = currentNode!.hands[handName];
                    if (!handData || !handData.evs) return { handName, maxEv: Infinity };
                    
                    const validEvs = handData.evs.filter((ev, idx) => handData.played[idx] > 0);
                    const maxEv = validEvs.length > 0 ? Math.max(...validEvs) : Infinity;
                    
                    return { handName, maxEv };
                })
                .filter(item => item.maxEv !== Infinity)
                .sort((a, b) => a.maxEv - b.maxEv); // Ordena do pior (menor) para o melhor (maior)
            
            // Pega até 30% das mãos com pior EV (mínimo 5, máximo 50)
            const worstHandsCount = Math.max(5, Math.min(50, Math.floor(handsWithEV.length * 0.3)));
            handsToUse = handsWithEV.slice(0, worstHandsCount).map(item => item.handName);
            
            console.log(`📉 Using ${handsToUse.length} hands with worst EVs (range: ${handsWithEV[0]?.maxEv.toFixed(2)} to ${handsWithEV[worstHandsCount - 1]?.maxEv.toFixed(2)} BB)`);
        }

        // 6.5. FILTRO ADICIONAL: Remove mãos extremamente marginais (diferença de EV < 0.05 BB)
        const MIN_EV_DIFF = 0.05; // Diferença mínima de EV entre ações
        const nonMarginalHands = handsToUse.filter((handName) => {
            const handData = currentNode!.hands[handName];
            if (!handData || !handData.evs) return true; // Se não tem EVs, aceita
            
            const validEvs = handData.evs.filter((ev, idx) => handData.played[idx] > 0);
            if (validEvs.length < 2) return true; // Se tem apenas 1 ação, aceita
            
            // Ordena EVs do maior para o menor
            const sortedEvs = [...validEvs].sort((a, b) => b - a);
            const evDiff = sortedEvs[0] - sortedEvs[1];
            
            // Aceita apenas se a diferença for >= 0.05 BB
            return evDiff >= MIN_EV_DIFF;
        });

        console.log(`🔍 Filtered out marginal hands: ${handsToUse.length} → ${nonMarginalHands.length} hands (min EV diff: ${MIN_EV_DIFF} BB)`);

        // Se filtrou TODAS as mãos, usa as originais (melhor ter spot marginal que travar)
        const finalHandsToUse = nonMarginalHands.length > 0 ? nonMarginalHands : handsToUse;
        
        if (nonMarginalHands.length === 0) {
            console.log(`⚠️ All hands are marginal - using original pool of ${handsToUse.length} hands`);
        }

        // 7. Sorteia uma mão do range filtrado
        const randomHandName = randomElement(finalHandsToUse);
        const handData = currentNode.hands[randomHandName];
        
        // Log detalhado da mão selecionada
        if (handData && handData.evs) {
            const validEvs = handData.evs.filter((ev, idx) => handData.played[idx] > 0);
            if (validEvs.length >= 2) {
                const sortedEvs = [...validEvs].sort((a, b) => b - a);
                const evDiff = sortedEvs[0] - sortedEvs[1];
                console.log(`✅ Selected hand: ${randomHandName} (best EV: ${sortedEvs[0].toFixed(2)} BB, 2nd best: ${sortedEvs[1].toFixed(2)} BB, diff: ${evDiff.toFixed(2)} BB)`);
            } else {
                console.log(`✅ Selected hand: ${randomHandName} (single action)`);
            }
        } else {
            console.log(`✅ Selected hand: ${randomHandName}`);
        }

        // 8. Filtra combos que pertencem à mão selecionada
        const flatCombos = allCombos.flat();
        const handCombos = flatCombos.filter(combo => {
            // Extrai os ranks do combo (ex: "7s5h" -> "75")
            const rank1 = combo[0];
            const rank2 = combo[2];
            const suit1 = combo[1];
            const suit2 = combo[3];
            
            // Verifica se o combo pertence à mão
            const comboHand = rank1 === rank2 
                ? `${rank1}${rank2}` // Par (ex: "77")
                : suit1 === suit2 
                    ? `${rank1}${rank2}s` // Suited (ex: "75s")
                    : `${rank1}${rank2}o`; // Offsuit (ex: "75o")
            
            return comboHand === randomHandName || 
                   (rank1 !== rank2 && `${rank2}${rank1}${comboHand.slice(-1)}` === randomHandName);
        });
        
        if (handCombos.length === 0) {
            console.error('No combos found for hand:', randomHandName);
            isGeneratingSpot.current = false;
            return;
        }
        
        // Sorteia um combo da mão
        const randomCombo = randomElement(handCombos);
        
        console.log(`✅ Selected combo from ${randomHandName}: ${randomCombo} (${handCombos.length} combos available)`);
        console.log(`📁 Solution path for Study button: ${workingSolution.path || workingSolution.id}`);

        setCurrentSpot({
            solution: workingSolution,
            nodeId: currentNodeId,
            playerPosition: randomPlayerPosition,
            playerHand: randomCombo,
            playerHandName: randomHandName,
            raiserPosition: (spotType === 'vs Open' || spotType === 'vs Shove') ? raiserPosition : undefined,
            shoverPositions: spotType === 'vs Multiway shove' ? shoverPositions : undefined,
            spotType: spotType
        });

        setUserAction(null);
        setShowFeedback(false);
        isGeneratingSpot.current = false;
        retryCount.current = 0; // Reset counter on successful spot generation
        console.log('✅✅✅ Spot generation completed successfully!');
    }, [phaseSolutions, loadNodesForSolution, solutions]); // Manter `solutions` aqui para que `generateNewSpot` tenha acesso ao array atualizado após o load

    // Carrega o primeiro spot apenas uma vez quando as soluções da fase estiverem prontas
    useEffect(() => {
        if (!hasInitialized.current && phaseSolutions.length > 0 && !currentSpot && !isGeneratingSpot.current) {
            hasInitialized.current = true;
            generateNewSpot();
        }
    }, [phaseSolutions, currentSpot, generateNewSpot]);

    // Verificar resposta
    const checkAnswer = (actionName: string) => {
        if (!currentSpot || showFeedback) return;
        
        // Parar áudios do timebank quando ação for clicada
        if (timebankAudio1.current) {
            timebankAudio1.current.pause();
            timebankAudio1.current.currentTime = 0;
        }
        if (timebankAudio2.current) {
            timebankAudio2.current.pause();
            timebankAudio2.current.currentTime = 0;
        }
        console.log('🔇 Timebank audios stopped');
        
        setUserAction(actionName);
        setShowFeedback(true);

        // Busca solução atualizada do array global (não do currentSpot)
        const currentSolution = solutions.find(s => s.id === currentSpot.solution.id);
        if (!currentSolution) {
            console.error('Solution not found in global array');
            return;
        }

        const node = currentSolution.nodes.get(currentSpot.nodeId);
        if (!node) {
            console.error('Node not found:', currentSpot.nodeId);
            return;
        }

        // Acessa handData pelo nome da mão (hands é objeto, não array)
        const handData = node.hands[currentSpot.playerHandName];

        if (!handData) {
            console.error('Hand data not found for:', currentSpot.playerHandName);
            return;
        }

        console.log('🎯 User clicked:', actionName);

        // Encontra a ação escolhida (compara pelo nome completo incluindo valor)
        const actionIndex = node.actions.findIndex((a, idx) => {
            if (a.type === 'F') return actionName === 'Fold';
            if (a.type === 'C') return actionName === 'Call';
            if (a.type === 'X') return actionName === 'Check';
            if (a.type === 'R') {
                const raiseBB = (a.amount / bigBlind).toFixed(1);
                return actionName === `Raise ${raiseBB}`;
            }
            return false;
        });
        
        if (actionIndex === -1) {
            console.error('Action not found:', actionName);
            return;
        }
        
        console.log('Action index:', actionIndex);

        const actionFreq = handData.played[actionIndex] || 0;
        console.log('User action frequency:', actionFreq);

        // Encontra a ação MAIS frequente (para referência)
        const maxFreq = Math.max(...handData.played);
        const gtoActionIndex = handData.played.indexOf(maxFreq);
        const gtoAction = node.actions[gtoActionIndex];
        
        console.log('GTO action index (most frequent):', gtoActionIndex);
        console.log('GTO action type:', gtoAction.type);
        console.log('Max frequency:', maxFreq);
        console.log('User action frequency:', actionFreq);
        console.log('All frequencies:', handData.played);

        // LÓGICA DE VALIDAÇÃO:
        // - Se a ação mais frequente tem >= 90%, apenas ela é correta (pure strategy)
        // - Caso contrário, qualquer ação com freq > 0 é correta (mixed strategy)
        const isPureStrategy = maxFreq >= 0.90;
        let isCorrect: boolean;
        
        if (isPureStrategy) {
            // Pure strategy: apenas a ação mais frequente é correta
            isCorrect = actionIndex === gtoActionIndex;
            console.log('🎯 Pure strategy detected (freq >= 90%). Only GTO action is correct.');
        } else {
            // Mixed strategy: qualquer ação com freq > 0 é correta
            isCorrect = actionFreq > 0;
            console.log('🎲 Mixed strategy detected (freq < 90%). Any action with freq > 0 is correct.');
        }
        
        const scorePoints = actionFreq > 0 
            ? Math.round((actionFreq / maxFreq) * 100)  // Pontuação proporcional
            : 0;  // 0 pontos apenas se escolher ação com 0% de frequência
        
        console.log('Is correct?', isCorrect);
        console.log('Score points:', scorePoints, `(${actionFreq}/${maxFreq} * 100)`);

        // Calcular pontos: 1 ponto por acerto
        const points = isCorrect ? 1 : 0;

        // Salvar estatísticas e histórico (usa a fase real do spot, não a prop)
        const actualPhase = currentSpot.solution.tournamentPhase;
        saveSpotResult(userId, isCorrect, actualPhase);
        saveSpotHistory(
            userId, 
            currentSpot.playerHandName, 
            isCorrect, 
            actualPhase, 
            points,
            currentSpot.playerHand, // combo (ex: "AhKd")
            currentSpot.solution.path || currentSpot.solution.id, // solutionPath (usa path ou id como fallback)
            currentSpot.nodeId // nodeId
        );

        console.log(`📊 Stats saved: ${isCorrect ? 'CORRECT' : 'WRONG'} - ${points} points - ${currentSpot.playerHand} - Phase: ${actualPhase}`);

        setStats(prev => ({
            totalQuestions: prev.totalQuestions + 1,
            correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
            score: prev.score + scorePoints
        }));

        // Callback para modo torneio
        if (tournamentMode && onSpotResult) {
            onSpotResult(isCorrect);
            
            // Auto-avançar para próximo spot após 5 segundos
            setTimeout(() => {
                generateNewSpot();
            }, 5000);
        }
    };

    // Próximo spot
    const nextSpot = () => {
        generateNewSpot();
    };

    if (!currentSpot) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#1a1d23]">
                <div className="text-white text-xl">Carregando spot...</div>
            </div>
        );
    }

    // Busca solução atualizada do array global (não do currentSpot)
    const currentSolution = solutions.find(s => s.id === currentSpot.solution.id);
    if (!currentSolution) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#1a1d23]">
                <div className="text-white text-xl">Erro: Solução não encontrada</div>
            </div>
        );
    }

    const node = currentSolution.nodes.get(currentSpot.nodeId);
    if (!node) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#1a1d23]">
                <div className="text-white text-xl">Erro ao carregar node</div>
            </div>
        );
    }

    const { settings } = currentSpot.solution;
    const bigBlind = settings.handdata.blinds.length > 1 
        ? Math.max(settings.handdata.blinds[0], settings.handdata.blinds[1]) 
        : (settings.handdata.blinds[0] || 0);
    
    // Determina o bounty inicial baseado no nome da solução
    const getInitialBounty = (solutionFileName: string): number => {
        const fileName = solutionFileName.toLowerCase();
        if (fileName.includes('speed32')) return 7.5;
        if (fileName.includes('speed50')) return 12.5;
        if (fileName.includes('speed108')) return 25;
        if (fileName.includes('speed20')) return 5;
        return 7.5; // Default
    };
    
    // Formata bounty baseado no modo de exibição
    const formatBounty = (bounty: number): string => {
        const actualBounty = bounty / 2; // Bounty real em dólar
        
        if (displayMode === 'bb') {
            // Modo BB: exibir como multiplicador do bounty inicial
            const initialBounty = getInitialBounty(currentSpot.solution.fileName);
            const multiplier = actualBounty / initialBounty;
            return `${multiplier.toFixed(1)}x`;
        }
        
        // Modo chips: exibir em dólar
        return `$${actualBounty.toFixed(2)}`;
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-[#1a1d23]">
            {/* Header com estatísticas - oculto no modo torneio */}
            {!tournamentMode && (
                <div className="bg-[#282c33] border-b border-gray-700 p-4">
                    <div className="flex items-center justify-between max-w-7xl mx-auto">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onBack}
                                className="px-4 py-2 bg-[#2d3238] hover:bg-[#353a42] text-white rounded-lg transition-colors"
                            >
                                ← Voltar
                            </button>
                            <h1 className="text-xl font-bold text-white">
                                {selectedPhases.length === 1 
                                    ? selectedPhases[0]
                                    : `${selectedPhases.length} Fases Selecionadas`
                                }
                            </h1>
                        </div>
                        
                        {/* Estatísticas */}
                        <div className="flex items-center gap-6 text-white">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-teal-400">{Math.round(stats.score)}</div>
                                <div className="text-xs text-gray-400">Pontos</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">{stats.correctAnswers}/{stats.totalQuestions}</div>
                                <div className="text-xs text-gray-400">Acertos</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-emerald-400">
                                    {stats.totalQuestions > 0 ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) : 0}%
                                </div>
                                <div className="text-xs text-gray-400">Precisão</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main content */}
            <main className="flex-1 p-4 overflow-auto">
                <div className="max-w-[1800px] mx-auto space-y-4">
                    {/* Mesa visual */}
                    <div className="relative flex items-center justify-center bg-[#23272f] rounded-lg p-3 min-h-[375px] overflow-hidden">
                        <PokerTableVisual 
                            currentNode={node}
                            settings={settings}
                            bigBlind={bigBlind}
                            displayMode={displayMode}
                            onToggleDisplayMode={toggleDisplayMode}
                            solutionFileName={currentSpot.solution.fileName}
                            tournamentPhase={currentSpot.solution.tournamentPhase}
                            raiserPosition={currentSpot.raiserPosition}
                            shoverPositions={currentSpot.shoverPositions}
                            spotType={currentSpot.spotType}
                            villainActions={currentSpot.villainActions}
                        />
                        
                        {/* Ações disponíveis - Estilo GGPoker (à direita do hero) */}
                        {!showFeedback && (
                            <div className={`absolute bottom-[45px] left-1/2 transform flex z-30 justify-center ${
                                node.actions.length <= 2 ? 'translate-x-[40%] gap-2' :
                                node.actions.length === 3 ? 'translate-x-[30%] gap-1.5' :
                                'translate-x-[20%] gap-1'
                            }`}>
                                {node.actions.map((action, index) => {
                                    // Converte tipo para nome (incluindo valor para Raise)
                                    let actionName: string;
                                    if (action.type === 'F') {
                                        actionName = 'Fold';
                                    } else if (action.type === 'C') {
                                        actionName = 'Call';
                                    } else if (action.type === 'X') {
                                        actionName = 'Check';
                                    } else {
                                        // Raise - inclui o valor em BB para diferenciar
                                        const raiseBB = (action.amount / bigBlind).toFixed(1);
                                        actionName = `Raise ${raiseBB}`;
                                        console.log(`🔧 Button ${index}: action.amount=${action.amount}, bigBlind=${bigBlind}, raiseBB=${raiseBB}`);
                                    }
                                    
                                    const actionColors: Record<string, string> = {
                                        'Fold': 'bg-red-600 hover:bg-red-700',
                                        'Call': 'bg-red-700 hover:bg-red-800',
                                        'Check': 'bg-red-700 hover:bg-red-800'
                                    };

                                    const bgColor = actionName.startsWith('Raise') 
                                        ? 'bg-red-700 hover:bg-red-800' 
                                        : actionColors[actionName] || 'bg-red-700 hover:bg-red-800';
                                    
                                    // Ajustar tamanho dos botões baseado na quantidade
                                    const buttonSize = node.actions.length <= 2 
                                        ? 'px-4 py-3 min-w-[64px] min-h-[45px]'
                                        : node.actions.length === 3
                                        ? 'px-3.5 py-2.5 min-w-[58px] min-h-[42px]'
                                        : 'px-3 py-2 min-w-[52px] min-h-[38px]';
                                    
                                    return (
                                        <button
                                            key={`${actionName}-${index}`}
                                            onClick={() => checkAnswer(actionName)}
                                            className={`
                                                relative rounded-lg font-bold text-white
                                                ${bgColor}
                                                ${buttonSize}
                                                transition-all duration-200
                                                shadow-lg
                                                border border-white/40
                                                flex flex-col items-center justify-center gap-0.5
                                                overflow-hidden
                                            `}
                                            style={{
                                                backgroundImage: 'url(./trainer/action_button.png)',
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center'
                                            }}
                                        >
                                            {/* Overlay para legibilidade */}
                                            <div className="absolute inset-0 bg-black/20" />
                                            
                                            {/* Texto */}
                                            <div className="relative z-10">
                                                {(() => {
                                                    const textSize = node.actions.length >= 4 ? 'text-[10px]' : 'text-xs';
                                                    const subTextSize = node.actions.length >= 4 ? 'text-[8px]' : 'text-[10px]';
                                                    
                                                    if (actionName === 'Fold') {
                                                        return <div className={`${textSize} font-bold`}>Fold</div>;
                                                    } else if (actionName === 'Check') {
                                                        return <div className={`${textSize} font-bold`}>Check</div>;
                                                    } else if (actionName === 'Call') {
                                                        return (
                                                            <>
                                                                <div className={`${textSize} font-bold`}>Call</div>
                                                                <div className={`${subTextSize} font-semibold`}>{(action.amount / bigBlind).toFixed(1)} BB</div>
                                                            </>
                                                        );
                                                    } else {
                                                        return (
                                                            <>
                                                                <div className={`${textSize} font-bold`}>Raise</div>
                                                                <div className={`${subTextSize} font-semibold`}>{(action.amount / bigBlind).toFixed(1)} BB</div>
                                                            </>
                                                        );
                                                    }
                                                })()}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        
                        {/* Mão do jogador no centro - estilo GGPoker */}
                        <div className="absolute bottom-9 left-1/2 transform -translate-x-1/2">
                            <div className="flex flex-col items-center">
                                {/* Fichas do blind (se hero for SB ou BB) */}
                                {(() => {
                                    const numPlayers = settings.handdata.stacks.length;
                                    const bbPosition = numPlayers - 1;
                                    const sbPosition = numPlayers === 2 ? 0 : numPlayers - 2;
                                    const isBB = currentSpot.playerPosition === bbPosition;
                                    const isSB = currentSpot.playerPosition === sbPosition;
                                    const smallBlind = settings.handdata.blinds.length > 1 ? Math.min(settings.handdata.blinds[0], settings.handdata.blinds[1]) : (settings.handdata.blinds[0] / 2 || 0);
                                    
                                    if (!isBB && !isSB) return null;
                                    
                                    const blindAmount = isBB ? bigBlind : smallBlind;
                                    
                                    return (
                                        <div className="mb-1.5 flex flex-col items-center gap-0.5">
                                            {/* Fichas empilhadas */}
                                            <div className="flex items-center gap-0.5">
                                                {/* Ficha roxa */}
                                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 border border-purple-300 shadow-md flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                                                </div>
                                                {/* Ficha amarela (se BB) */}
                                                {isBB && (
                                                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border border-yellow-300 shadow-md flex items-center justify-center -ml-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Valor do blind */}
                                            <div className="bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded border border-yellow-500/50">
                                                <span className="text-yellow-400 font-bold text-[10px] whitespace-nowrap">
                                                    {displayMode === 'bb' 
                                                        ? isBB 
                                                            ? '1 BB'  // BB sempre mostra "1 BB" sem decimais
                                                            : `${(blindAmount / bigBlind).toFixed(1)} BB`  // SB mostra com decimal
                                                        : (blindAmount / 100).toLocaleString()
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })()}
                                
                                {/* Bounty acima das cartas (se houver) - 20% menor */}
                                {settings.handdata.bounties && settings.handdata.bounties[currentSpot.playerPosition] > 0 && (
                                    <div className="mb-1.5 bg-gradient-to-r from-yellow-500 to-yellow-600 px-2 py-1 rounded-full border border-yellow-400 relative z-10">
                                        <span className="text-white font-bold text-[10px]">
                                            {formatBounty(settings.handdata.bounties[currentSpot.playerPosition])}
                                        </span>
                                    </div>
                                )}
                                
                                {/* Container relativo para posicionar cartas atrás do quadrado */}
                                <div className="relative flex flex-col items-center">
                                    {/* Cartas - posicionadas atrás com z-index negativo e deslocadas para baixo */}
                                    <div className="relative -mb-6 z-0">
                                        <PlayerHand hand={currentSpot.playerHand} />
                                    </div>
                                    
                                    {/* Nome do jogador e stack - na frente das cartas - 20% menor */}
                                    <div 
                                        onClick={toggleDisplayMode}
                                        className="bg-black/90 backdrop-blur-sm rounded-lg px-2.5 py-1 border border-yellow-500 shadow-md min-w-[120px] cursor-pointer hover:bg-black/80 transition-colors relative z-10"
                                    >
                                        <div className="text-center">
                                            <div className="text-yellow-400 font-bold text-[10px] mb-0.5">Você</div>
                                            <div className="text-blue-400 font-bold text-xs">
                                                {(() => {
                                                    const numPlayers = settings.handdata.stacks.length;
                                                    const bbPosition = numPlayers - 1;
                                                    const sbPosition = numPlayers === 2 ? 0 : numPlayers - 2;
                                                    const isBB = currentSpot.playerPosition === bbPosition;
                                                    const isSB = currentSpot.playerPosition === sbPosition;
                                                    
                                                    const ante = settings.handdata.blinds.length > 2 ? settings.handdata.blinds[2] : 0;
                                                    const smallBlind = settings.handdata.blinds.length > 1 ? Math.min(settings.handdata.blinds[0], settings.handdata.blinds[1]) : (settings.handdata.blinds[0] / 2 || 0);
                                                    
                                                    let effectiveStack = settings.handdata.stacks[currentSpot.playerPosition] - ante;
                                                    
                                                    // Desconta blinds se hero for BB ou SB
                                                    if (isBB) {
                                                        effectiveStack -= bigBlind;
                                                    } else if (isSB) {
                                                        effectiveStack -= smallBlind;
                                                    }
                                                    
                                                    // Garante que o stack nunca seja negativo
                                                    effectiveStack = Math.max(0, effectiveStack);
                                                    
                                                    return displayMode === 'bb' 
                                                        ? `${(effectiveStack / bigBlind).toFixed(1)} BB`
                                                        : (effectiveStack / 100).toLocaleString();
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Timebank bar (apenas modo torneio) - FORA e ABAIXO do quadrado, colado */}
                                    {tournamentMode && !showFeedback && (
                                        <div className="w-[120px] px-2.5 mt-0.5">
                                            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-1000 ease-linear ${
                                                        timeLeft <= 4 ? 'bg-red-500' :
                                                        timeLeft <= 8 ? 'bg-yellow-400' :
                                                        'bg-green-500'
                                                    }`}
                                                    style={{ width: `${(timeLeft / 15) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feedback após ação */}
                    {showFeedback && (
                        <div className="bg-[#23272f] rounded-lg p-2.5 max-w-4xl mx-auto">
                            <div className="space-y-1.5">
                                {/* Mensagem de resultado */}
                                {(() => {
                                    const handData = node.hands[currentSpot.playerHandName];
                                    if (!handData) return null;
                                    
                                    const userActionIndex = node.actions.findIndex((a, idx) => {
                                        if (a.type === 'F') return userAction === 'Fold';
                                        if (a.type === 'C') return userAction === 'Call';
                                        if (a.type === 'X') return userAction === 'Check';
                                        if (a.type === 'R') {
                                            const raiseBB = (a.amount / bigBlind).toFixed(1);
                                            return userAction === `Raise ${raiseBB}`;
                                        }
                                        return false;
                                    });
                                    
                                    const userActionFreq = userActionIndex >= 0 ? handData.played[userActionIndex] : 0;
                                    const maxFreq = Math.max(...handData.played);
                                    const gtoActionIndex = handData.played.indexOf(maxFreq);
                                    const isPureStrategy = maxFreq >= 0.90;
                                    const isCorrect = isPureStrategy 
                                        ? userActionIndex === gtoActionIndex
                                        : userActionFreq > 0;
                                    
                                    // Verificar se foi timeout
                                    const isTimeout = userAction === 'TIMEOUT';
                                    
                                    return (
                                        <div className="flex items-center gap-2">
                                            <div className={`flex-1 text-center py-2 rounded-lg font-black text-xl tracking-wider ${
                                                isTimeout ? 'bg-orange-500/20 text-orange-400' :
                                                isCorrect ? 'bg-teal-500/20 text-teal-400' : 'bg-red-500/20 text-red-400'
                                            }`}>
                                                {isTimeout ? '⏰ TIMEOUT' : isCorrect ? 'CORRECT' : 'MISTAKE'}
                                            </div>
                                            
                                            {/* Botão STUDY */}
                                            <button
                                                onClick={() => {
                                                    // Cria URL para o Solutions Library com o spot atual
                                                    const baseUrl = window.location.origin + window.location.pathname;
                                                    const params = new URLSearchParams();
                                                    params.set('page', 'solutions');
                                                    
                                                    // Usa path se disponível, senão usa o id da solução
                                                    const solutionPath = currentSpot.solution.path || currentSpot.solution.id;
                                                    console.log('🔗 Study button - solution path:', solutionPath);
                                                    console.log('🔗 Study button - solution id:', currentSpot.solution.id);
                                                    
                                                    params.set('solution', solutionPath);
                                                    params.set('node', currentSpot.nodeId.toString());
                                                    params.set('hand', currentSpot.playerHandName);
                                                    
                                                    const studyUrl = `${baseUrl}?${params.toString()}`;
                                                    console.log('🔗 Opening study URL:', studyUrl);
                                                    window.open(studyUrl, '_blank');
                                                }}
                                                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-lg font-black text-xl tracking-wider transition-all shadow-lg border-2 border-purple-400/50 whitespace-nowrap"
                                            >
                                                📚 STUDY
                                            </button>
                                        </div>
                                    );
                                })()}

                                {/* Cards horizontais estilo GTO Wizard */}
                                <div className={`grid ${
                                    node.actions.length <= 2 ? 'grid-cols-2 gap-3' :
                                    node.actions.length === 3 ? 'grid-cols-3 gap-2' :
                                    'grid-cols-4 gap-1.5'
                                }`}>
                                    {(() => {
                                        const handData = node.hands[currentSpot.playerHandName];
                                        if (!handData) return <div className="text-red-400 col-span-3">Erro: Dados da mão não encontrados</div>;
                                        
                                        return node.actions.map((action, actionIndex) => {
                                            const freq = handData.played[actionIndex] || 0;
                                            const percentage = (freq * 100).toFixed(1);
                                            const ev = handData.evs[actionIndex] || 0;
                                            const evBB = ev.toFixed(2);
                                            
                                            let actionName: string;
                                            if (action.type === 'F') {
                                                actionName = 'FOLD';
                                            } else if (action.type === 'C') {
                                                actionName = 'CALL';
                                            } else if (action.type === 'X') {
                                                actionName = 'CHECK';
                                            } else {
                                                const raiseBB = (action.amount / bigBlind).toFixed(0);
                                                actionName = `RAISE ${raiseBB}`;
                                            }
                                            
                                            const isUserChoice = (() => {
                                                if (action.type === 'F') return userAction === 'Fold';
                                                if (action.type === 'C') return userAction === 'Call';
                                                if (action.type === 'X') return userAction === 'Check';
                                                if (action.type === 'R') {
                                                    const raiseBB = (action.amount / bigBlind).toFixed(1);
                                                    return userAction === `Raise ${raiseBB}`;
                                                }
                                                return false;
                                            })();
                                            
                                            const maxFreq = Math.max(...handData.played);
                                            const isGTO = freq === maxFreq && freq > 0;
                                            const hasFreq = freq > 0;
                                            
                                            // Lógica de validação: Pure Strategy vs Mixed Strategy
                                            const isPureStrategy = maxFreq >= 0.90;
                                            const gtoActionIndex = handData.played.indexOf(maxFreq);
                                            const isCorrectChoice = isUserChoice && (isPureStrategy 
                                                ? actionIndex === gtoActionIndex
                                                : hasFreq);
                                            const isWrongChoice = isUserChoice && !isCorrectChoice;
                                            
                                            return (
                                                <div
                                                    key={actionIndex}
                                                    className={`border-2 rounded-lg p-2 ${
                                                        isCorrectChoice ? 'bg-teal-500/10 border-teal-500' :
                                                        isWrongChoice ? 'bg-red-500/10 border-red-500' :
                                                        'bg-[#1a1d23] border-gray-700'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-1.5 mb-1.5">
                                                        {!hasFreq && (
                                                            <div className="text-red-500 text-sm">⚠️</div>
                                                        )}
                                                        {isCorrectChoice && (
                                                            <div className="text-teal-400 text-sm">✓</div>
                                                        )}
                                                        <div className="flex-1">
                                                            <div className="text-white font-bold text-xs">{actionName}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-white font-bold text-base">{percentage} %</div>
                                                        <div className={`text-[10px] font-semibold ${
                                                            parseFloat(evBB) >= 0 ? 'text-gray-400' : 'text-gray-400'
                                                        }`}>
                                                            {evBB} EV
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>

                                {/* Barra de progresso colorida */}
                                {(() => {
                                    const handData = node.hands[currentSpot.playerHandName];
                                    if (!handData) return null;
                                    
                                    const actionColors = ['#a855f7', '#f97316', '#3b82f6', '#10b981'];
                                    const labels: string[] = [];
                                    
                                    node.actions.forEach((action, idx) => {
                                        const freq = handData.played[idx] || 0;
                                        const percentage = (freq * 100).toFixed(1);
                                        if (freq > 0) {
                                            let actionName: string;
                                            if (action.type === 'F') {
                                                actionName = 'Fold';
                                            } else if (action.type === 'C') {
                                                actionName = 'Call';
                                            } else if (action.type === 'X') {
                                                actionName = 'Check';
                                            } else {
                                                const raiseBB = (action.amount / bigBlind).toFixed(0);
                                                actionName = action.amount > 50 ? `Allin ${raiseBB}` : `Raise ${raiseBB}`;
                                            }
                                            labels.push(`${actionName} ${percentage}%`);
                                        }
                                    });
                                    
                                    return (
                                        <div>
                                            <div className="flex h-2.5 rounded-full overflow-hidden">
                                                {node.actions.map((action, idx) => {
                                                    const freq = handData.played[idx] || 0;
                                                    const percentage = freq * 100;
                                                    if (percentage === 0) return null;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            style={{
                                                                width: `${percentage}%`,
                                                                backgroundColor: actionColors[idx % actionColors.length]
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                            <div className="text-center text-[10px] text-gray-400 mt-1.5">
                                                {labels.join('  •  ')}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {!tournamentMode && (
                                    <button
                                        onClick={nextSpot}
                                        className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-4 py-2.5 rounded font-bold text-sm transition-all shadow-lg uppercase tracking-wide"
                                    >
                                        NEXT HAND
                                    </button>
                                )}
                                
                                {tournamentMode && (
                                    <div className="w-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 px-4 py-2.5 rounded font-bold text-sm text-center">
                                        Auto-advancing in 5s...
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
