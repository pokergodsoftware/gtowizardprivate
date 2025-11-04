import React, { useState, useEffect, useCallback } from 'react';
import type { AppData, NodeData } from '../types.ts';
import { saveSpotResult, saveSpotHistory, saveMarkedHand, removeMarkedHand } from '../utils/statsUtils.ts';

// Import extracted hooks and components (Phase 8 refactoring)
import { useTrainerSettings, useTimebank, useTrainerStats, useSpotGeneration } from './TrainerSimulator/hooks';
import { TrainerTable, TrainerFeedback, TrainerHeader } from './TrainerSimulator/components';

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
    // ============================================================
    // PHASE 8 REFACTORING: Using extracted hooks and components
    // All state management moved to custom hooks
    // All UI rendering moved to sub-components
    // Main component now handles orchestration only (~250 lines)
    // ============================================================
    
    // Custom hooks for settings persistence
    const { 
        displayMode, 
        toggleDisplayMode, 
        showBountyInDollars, 
        toggleShowBountyInDollars, 
        autoAdvance, 
        toggleAutoAdvance 
    } = useTrainerSettings({ tournamentMode });
    
    // Custom hook for stats tracking
    const { stats, updateStats, resetStats } = useTrainerStats();
    
    // Local UI state (user interaction)
    const [userAction, setUserAction] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isHandMarked, setIsHandMarked] = useState(false);
    const [lastActionResult, setLastActionResult] = useState<{isCorrect: boolean, ev?: number} | null>(null);
    
    // ============================================================
    // Callback for timebank expiration
    // ============================================================
    
    const handleTimeExpired = useCallback(() => {
        if (!currentSpot || showFeedback) return;
        
        // Use solution from currentSpot (has all nodes loaded)
        const currentSolution = currentSpot.solution;
        if (!currentSolution) return;
        
        const node = currentSolution.nodes.get(currentSpot.nodeId);
        if (!node) return;
        
        const handData = node.hands[currentSpot.playerHandName];
        if (!handData) return;
        
        // TIMEOUT: Ação automática é sempre FOLD
        const foldActionIndex = node.actions.findIndex(a => a.type === 'F');
        
        if (foldActionIndex === -1) {
            // Não tem Fold disponível - marca como erro
            setUserAction('Fold (TIMEOUT)');
            setShowFeedback(true);
            
            const actualPhase = currentSpot.solution.tournamentPhase;
            updateStats(false, actualPhase, 0);
            saveSpotResult(userId, false, actualPhase);
            saveSpotHistory(
                userId, 
                currentSpot.playerHandName, 
                false, 
                actualPhase, 
                0,
                currentSpot.playerHand,
                currentSpot.solution.path || currentSpot.solution.id,
                currentSpot.nodeId,
                currentSpot.playerPosition,
                'Fold (Timeout)',
                undefined
            );
            
            if (onSpotResult) {
                onSpotResult(false);
            }
            return;
        }
        
        // REGRA: Quando timebank expira, herói sempre folda automaticamente
        // - Se Fold for a ação correta (freq > 0), conta como ACERTO e ganha 1 ponto
        // - Se Fold NÃO for a ação correta (freq = 0), conta como ERRO e ganha 0 pontos
        const foldFrequency = handData.played[foldActionIndex] || 0;
        const isCorrect = foldFrequency > 0;
        
        // Pegar o EV do fold
        const foldEv = handData.evs && handData.evs[foldActionIndex] !== undefined 
            ? handData.evs[foldActionIndex] 
            : undefined;
        
        // Marca a ação como Fold (Timeout)
        setUserAction('Fold (TIMEOUT)');
        setShowFeedback(true);
        
        // Salvar resultado
        const actualPhase = currentSpot.solution.tournamentPhase;
        const points = isCorrect ? 1 : 0;
        updateStats(isCorrect, actualPhase, points);
        saveSpotResult(userId, isCorrect, actualPhase);
        saveSpotHistory(
            userId, 
            currentSpot.playerHandName, 
            isCorrect, 
            actualPhase, 
            points,
            currentSpot.playerHand,
            currentSpot.solution.path || currentSpot.solution.id,
            currentSpot.nodeId,
            currentSpot.playerPosition,
            'Fold (Timeout)',
            foldEv
        );
        
        // Callback para modo torneio
        if (onSpotResult) {
            onSpotResult(isCorrect);
        }
    }, [userId, updateStats, onSpotResult, showFeedback]); // Dependencies for callback (currentSpot captured in closure)
    
    // Custom hook for spot generation (orchestrates spot generators)
    const { currentSpot, generateNewSpot, isGenerating } = useSpotGeneration({
        solutions,
        selectedPhases,
        selectedSpotTypes,
        loadNodesForSolution,
        playerCountFilter
    });
    
    // Custom hook for timebank (countdown timer with audio alerts)
    const { timeLeft, stopAudios } = useTimebank({
        tournamentMode,
        currentSpot,
        showFeedback,
        onTimeExpired: handleTimeExpired
    });
    
    // ============================================================
    // Effects & Lifecycle
    // ============================================================

    // Initialize first spot generation
    useEffect(() => {
        if (!currentSpot) {
            generateNewSpot();
        }
    }, []); // Run once on mount

    // Reset feedback when component mounts (tournament mode)
    useEffect(() => {
        if (tournamentMode) {
            setShowFeedback(false);
            setUserAction(null);
        }
    }, []); // Run once on mount

    // Auto-advance when toggle is activated AFTER already answering
    useEffect(() => {
        if (autoAdvance && showFeedback && userAction) {
            const delay = tournamentMode ? 5000 : 2500;
            const timer = setTimeout(() => {
                nextSpot();
            }, delay);
            
            return () => clearTimeout(timer);
        }
    }, [autoAdvance, showFeedback, userAction, tournamentMode]); // Watch all relevant states

    // Cleanup audio on unmount only
    useEffect(() => {
        return () => {
            stopAudios();
        };
    }, [stopAudios]);

    // ============================================================
    // Handler Functions
    // ============================================================

    const checkAnswer = (actionName: string) => {
        if (!currentSpot || userAction) return; // Já respondeu
        
        // Use solution from currentSpot (has all nodes loaded during generation)
        const currentSolution = currentSpot.solution;
        if (!currentSolution) {
            console.error('❌ Current solution not found');
            return;
        }
        
        const node = currentSolution.nodes.get(currentSpot.nodeId);
        if (!node) {
            console.error(`❌ Node ${currentSpot.nodeId} not found in solution`);
            return;
        }
        
        const handData = node.hands[currentSpot.playerHandName];
        if (!handData) {
            console.error(`❌ Hand ${currentSpot.playerHandName} not found in node`);
            return;
        }
        
        // Encontrar índice da ação escolhida
        const actionIndex = node.actions.findIndex(a => {
            if (a.type === 'F') return actionName === 'Fold';
            if (a.type === 'X') return actionName === 'Check';
            if (a.type === 'C') return actionName === 'Call';
            if (a.type === 'R' || a.type === 'A') {
                // Pode ser Raise ou All-in
                return actionName.includes('Raise') || actionName === 'All-in';
            }
            return false;
        });
        
        if (actionIndex === -1) {
            console.error(`❌ Action ${actionName} not found in node actions`);
            return;
        }
        
        // Verificar se a ação escolhida é jogada com frequência > 0
        const frequency = handData.played[actionIndex] || 0;
        const isCorrect = frequency > 0;
        
        // Pegar o EV da ação
        const actionEv = handData.evs && handData.evs[actionIndex] !== undefined 
            ? handData.evs[actionIndex] 
            : undefined;
        
        setUserAction(actionName);
        setShowFeedback(true);
        
        // Armazenar resultado para usar no mark hand
        setLastActionResult({ isCorrect, ev: actionEv });
        
        // Parar o timebank
        stopAudios();
        
        // Salvar resultado
        const actualPhase = currentSpot.solution.tournamentPhase;
        const points = isCorrect ? 1 : 0;
        updateStats(isCorrect, actualPhase, points);
        saveSpotResult(userId, isCorrect, actualPhase);
        saveSpotHistory(
            userId, 
            currentSpot.playerHandName, 
            isCorrect, 
            actualPhase, 
            points,
            currentSpot.playerHand,
            currentSpot.solution.path || currentSpot.solution.id,
            currentSpot.nodeId,
            currentSpot.playerPosition,
            actionName,
            actionEv
        );
        
        // Callback para modo torneio
        if (onSpotResult) {
            onSpotResult(isCorrect);
        }
        
        // Auto-advance se ativado
        if (autoAdvance) {
            const delay = tournamentMode ? 5000 : 2500;
            setTimeout(() => {
                nextSpot();
            }, delay);
        }
    };

    const nextSpot = () => {
        setUserAction(null);
        setShowFeedback(false);
        setIsHandMarked(false);
        setLastActionResult(null);
        stopAudios();
        generateNewSpot();
    };

    const handleStudy = () => {
        if (!currentSpot) return;
        
        // Abrir Solutions Viewer em nova aba com o spot atual
        const solutionPath = currentSpot.solution.path || currentSpot.solution.id;
        const nodeId = currentSpot.nodeId;
        const hand = currentSpot.playerHandName;
        
        const baseUrl = window.location.origin + window.location.pathname;
        const url = `${baseUrl}?page=solutions&solution=${encodeURIComponent(solutionPath)}&node=${nodeId}&hand=${hand}`;
        window.open(url, '_blank');
    };

    // ============================================================
    // Mark/Unmark Hand Handlers
    // ============================================================

    const handleMarkHand = async () => {
        if (!currentSpot || !lastActionResult) return;
        
        // Gerar ID único para a mão marcada
        const handId = `${currentSpot.solution.id}_${currentSpot.nodeId}_${currentSpot.playerHand}_${Date.now()}`;
        
        const markedHand = {
            id: handId,
            timestamp: Date.now(),
            solutionPath: currentSpot.solution.path || currentSpot.solution.id,
            nodeId: currentSpot.nodeId,
            hand: currentSpot.playerHandName,
            combo: currentSpot.playerHand,
            position: currentSpot.playerPosition,
            playerAction: userAction || 'N/A',
            isCorrect: lastActionResult.isCorrect,
            ev: lastActionResult.ev,
            phase: currentSpot.solution.tournamentPhase
        };
        
        try {
            await saveMarkedHand(userId, markedHand);
            setIsHandMarked(true);
        } catch (error) {
            console.error('❌ Error marking hand:', error);
        }
    };

    const handleUnmarkHand = async () => {
        if (!currentSpot) return;
        
        const handKey = `${currentSpot.solution.path || currentSpot.solution.id}_${currentSpot.nodeId}_${currentSpot.playerHandName}`;
        
        try {
            await removeMarkedHand(userId, handKey);
            setIsHandMarked(false);
        } catch (error) {
            console.error('❌ Error unmarking hand:', error);
        }
    };

    // ============================================================
    // Render (using extracted components)
    // ============================================================

    if (!currentSpot) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
                <div className="text-white text-xl">
                    {isGenerating ? '🎲 Generating spot...' : '🔍 Loading...'}
                </div>
            </div>
        );
    }

    // Use solution from currentSpot (has all nodes loaded during generation)
    const currentSolution = currentSpot.solution;
    const node = currentSolution.nodes.get(currentSpot.nodeId);

    if (!currentSolution || !node) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
                <div className="text-white text-xl">
                    ❌ Error: Solution or node not found
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col ${tournamentMode ? 'h-full' : 'h-screen'} overflow-hidden bg-[#1a1d23]`}>
            {/* Header with statistics and controls - Hidden in tournament mode */}
            {!tournamentMode && (
                <TrainerHeader
                    stats={stats}
                    tournamentMode={tournamentMode}
                    tournamentPhase={tournamentPhase}
                    timeLeft={timeLeft}
                    displayMode={displayMode}
                    showBountyInDollars={showBountyInDollars}
                    autoAdvance={autoAdvance}
                    selectedPhases={selectedPhases}
                    onToggleDisplayMode={toggleDisplayMode}
                    onToggleShowBountyInDollars={toggleShowBountyInDollars}
                    onToggleAutoAdvance={toggleAutoAdvance}
                    onBack={onBack}
                />
            )}

            {/* Main content */}
            <main className="flex-grow overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 150px)' }}>
                <div className="max-w-[1800px] mx-auto space-y-4 pb-32">
                    {/* Poker Table: Visual representation + action buttons */}
                    <TrainerTable
                        solution={currentSolution}
                        node={node}
                        nodeId={currentSpot.nodeId}
                        playerPosition={currentSpot.playerPosition}
                        playerHand={currentSpot.playerHand}
                        playerHandName={currentSpot.playerHandName}
                        displayMode={displayMode}
                        showBountyInDollars={showBountyInDollars}
                        showFeedback={showFeedback}
                        tournamentMode={tournamentMode}
                        timeLeft={timeLeft}
                        spotType={currentSpot.spotType}
                        raiserPosition={currentSpot.raiserPosition}
                        shoverPositions={currentSpot.shoverPositions}
                        villainActions={currentSpot.villainActions}
                        autoAdvance={autoAdvance}
                        onCheckAnswer={checkAnswer}
                        onToggleDisplayMode={toggleDisplayMode}
                        onToggleBountyDisplay={toggleShowBountyInDollars}
                        onToggleAutoAdvance={toggleAutoAdvance}
                        onStudy={handleStudy}
                    />

                    {/* Feedback Modal: Results and next spot button */}
                    {showFeedback && (
                        <TrainerFeedback
                            show={showFeedback}
                            currentSpot={currentSpot}
                            node={node}
                            userAction={userAction}
                            isHandMarked={isHandMarked}
                            autoAdvance={autoAdvance}
                            tournamentMode={tournamentMode}
                            bigBlind={Math.max(...currentSolution.settings.handdata.blinds)}
                            userId={userId}
                            onSetIsHandMarked={setIsHandMarked}
                            onMarkHand={handleMarkHand}
                            onUnmarkHand={handleUnmarkHand}
                            onNextSpot={nextSpot}
                            onStudy={handleStudy}
                        />
                    )}
                </div>
            </main>
        </div>
    );
};
