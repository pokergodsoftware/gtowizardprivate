import React, { useState, useEffect, useCallback } from 'react';
import type { AppData, NodeData } from '../types.ts';
import { saveSpotResult, saveSpotHistory, saveMarkedHand, removeMarkedHand } from '../utils/statsUtils.ts';

// Import extracted hooks and components (Phase 8 refactoring)
import { useTrainerSettings, useTimebank, useTrainerStats, useSpotGeneration } from './TrainerSimulator/hooks';
import { TrainerTable, TrainerFeedback } from './TrainerSimulator/components';

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
        
        console.log('⏰ Timebank expired - auto-folding');
        
        // Busca solução atualizada
        const currentSolution = solutions.find(s => s.id === currentSpot.solution.id);
        if (!currentSolution) return;
        
        const node = currentSolution.nodes.get(currentSpot.nodeId);
        if (!node) return;
        
        const handData = node.hands[currentSpot.playerHandName];
        if (!handData) return;
        
        // TIMEOUT: Ação automática é sempre FOLD
        const foldActionIndex = node.actions.findIndex(a => a.type === 'F');
        
        if (foldActionIndex === -1) {
            // Não tem Fold disponível - marca como erro
            console.log('⚠️ TIMEOUT: No Fold action available - counting as mistake');
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
        
        console.log(`⏰ TIMEOUT - Auto-fold: ${isCorrect ? '✅ CORRECT' : '❌ WRONG'} (fold freq: ${(foldFrequency * 100).toFixed(1)}%)`);
        
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
        
        console.log(`📊 Stats saved: ${isCorrect ? '✅ CORRECT' : '❌ WRONG'} - ${points} points - ${currentSpot.playerHand} - Phase: ${actualPhase}`);
        
        // Callback para modo torneio
        if (onSpotResult) {
            onSpotResult(isCorrect);
        }
    }, [solutions, userId, updateStats, onSpotResult, showFeedback]); // Dependencies for callback
    
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
            console.log('🎬 Initial spot generation triggered');
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
            console.log('🔄 Auto-advance enabled after answer, advancing in 2.5s...');
            const delay = tournamentMode ? 5000 : 2500;
            const timer = setTimeout(() => {
                nextSpot();
            }, delay);
            
            return () => clearTimeout(timer);
        }
    }, [autoAdvance, showFeedback, userAction, tournamentMode]); // Watch all relevant states

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            stopAudios();
            resetStats();
        };
    }, [stopAudios, resetStats]);

    // ============================================================
    // Handler Functions
    // ============================================================

    const checkAnswer = (actionName: string) => {
        if (!currentSpot || userAction) return; // Já respondeu
        
        // Busca solução atualizada (pode ter nodes carregados dinamicamente)
        const currentSolution = solutions.find(s => s.id === currentSpot.solution.id);
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
        
        console.log(`🎯 User chose: ${actionName} (freq: ${(frequency * 100).toFixed(1)}%) - ${isCorrect ? '✅ CORRECT' : '❌ WRONG'}`);
        
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
        
        console.log(`📊 Stats saved: ${isCorrect ? '✅ CORRECT' : '❌ WRONG'} - ${points} points - ${currentSpot.playerHand} - Phase: ${actualPhase}`);
        
        // Callback para modo torneio
        if (onSpotResult) {
            onSpotResult(isCorrect);
        }
        
        // Auto-advance se ativado
        console.log('🔍 Auto-advance check:', { autoAdvance, tournamentMode });
        if (autoAdvance) {
            console.log('🔄 Auto-advance enabled, advancing in 2.5s...');
            const delay = tournamentMode ? 5000 : 2500;
            setTimeout(() => {
                nextSpot();
            }, delay);
        } else {
            console.log('⏸️ Auto-advance disabled, waiting for manual next');
        }
    };

    const nextSpot = () => {
        console.log('➡️ Next spot requested');
        setUserAction(null);
        setShowFeedback(false);
        setIsHandMarked(false);
        setLastActionResult(null);
        stopAudios();
        generateNewSpot();
    };

    const handleStudy = () => {
        if (!currentSpot) return;
        
        // Navegar para Solutions Viewer com o spot atual
        const solutionPath = currentSpot.solution.path || currentSpot.solution.id;
        const nodeId = currentSpot.nodeId;
        const hand = currentSpot.playerHandName;
        
        const url = `?page=solutions&solution=${encodeURIComponent(solutionPath)}&node=${nodeId}&hand=${hand}`;
        window.location.href = url;
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
            console.log('✅ Hand marked successfully');
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
            console.log('✅ Hand unmarked successfully');
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

    // Buscar solução e node atualizados
    const currentSolution = solutions.find(s => s.id === currentSpot.solution.id);
    const node = currentSolution?.nodes.get(currentSpot.nodeId);

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
                                    : `${selectedPhases.length} Fases Selecionadas`}
                            </h1>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-white">
                                <span className="text-gray-400">Questões:</span>{' '}
                                <span className="font-bold">{stats.totalQuestions}</span>
                            </div>
                            <div className="text-white">
                                <span className="text-gray-400">Acertos:</span>{' '}
                                <span className="font-bold text-green-400">{stats.correctAnswers}</span>
                            </div>
                            <div className="text-white">
                                <span className="text-gray-400">Pontos:</span>{' '}
                                <span className="font-bold text-blue-400">{stats.score}</span>
                            </div>
                            {stats.tournamentsPlayed > 0 && (
                                <>
                                    <div className="text-white">
                                        <span className="text-gray-400">Torneios:</span>{' '}
                                        <span className="font-bold">{stats.tournamentsPlayed}</span>
                                    </div>
                                    <div className="text-white">
                                        <span className="text-gray-400">FT:</span>{' '}
                                        <span className="font-bold text-yellow-400">{stats.reachedFinalTable}</span>
                                    </div>
                                    <div className="text-white">
                                        <span className="text-gray-400">Vitórias:</span>{' '}
                                        <span className="font-bold text-green-400">{stats.completedTournaments}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main content */}
            <main className="flex-grow overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 150px)' }}>
                <div className="max-w-[1800px] mx-auto space-y-4 pb-32">
                    {/* Poker Table: Visual representation + action buttons */}
                    <TrainerTable
                        solution={currentSolution}
                        node={node}
                        playerPosition={currentSpot.playerPosition}
                        playerHand={currentSpot.playerHand}
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
