import React, { useState, useEffect, useCallback } from 'react';
import type { AppData, NodeData } from '../types.ts';
import { saveSpotResult, saveSpotHistory, saveMarkedHand, removeMarkedHand } from '../utils/statsUtils.ts';
import { evaluateAction, isActionCorrect, type ActionEvaluation } from '../lib/actionEvaluation.ts';

// Import extracted hooks and components (Phase 8 refactoring)
import { useTrainerSettings, useTimebank, useTrainerStats, useSpotGeneration } from './TrainerSimulator/hooks';
import { TrainerTable, TrainerFeedback, TrainerHeader, LoadingTransition } from './TrainerSimulator/components';

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
    onSpotResult?: (isCorrect: boolean, livesLost?: number) => void; // Callback para modo torneio (agora com livesLost)
    playerCountFilter?: number; // Filtro opcional por número de jogadores (para Final Table)
    // Tournament result props (quando torneio termina)
    tournamentComplete?: {
        isBusted: boolean;
        isComplete: boolean;
        totalHandsPlayed: number;
        mistakes: number;
        accuracy: string;
        stages: Array<{
            phase: string;
            handsToPlay: number;
            displayName: string;
            playerCount?: number;
        }>;
        currentStageIndex: number;
        handsPlayedInStage: number;
        stageStats: Record<number, { handsPlayed: number; livesLost: number }>;
        onRestart: () => void;
    };
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
    playerCountFilter,
    tournamentComplete,
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
    const [isHandMarked, setIsHandMarked] = useState(false);
    const [isLoadingNextHand, setIsLoadingNextHand] = useState(false);
    const [lastActionResult, setLastActionResult] = useState<{
        evaluation: ActionEvaluation;
        ev?: number;
    } | null>(null);
    
    // ============================================================
    // Callback for timebank expiration
    // ============================================================
    
    const handleTimeExpired = useCallback(() => {
        if (!currentSpot || userAction) return; // Se já respondeu, ignora timeout
        
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
        // Avaliar usando o novo sistema
        const foldEvaluation = evaluateAction(
            foldActionIndex,
            handData.played,
            handData.evs,
            node.actions
        );
        
        console.log('⏰ Timeout - Fold evaluation:', foldEvaluation);
        
        // Pegar o EV do fold
        const foldEv = handData.evs && handData.evs[foldActionIndex] !== undefined 
            ? handData.evs[foldActionIndex] 
            : undefined;
        
        // Marca a ação como Fold (Timeout)
        setUserAction('Fold (TIMEOUT)');
        
        // Determinar se é "correto" para estatísticas
        const isCorrect = isActionCorrect(foldEvaluation.quality);
        
        // Salvar resultado
        const actualPhase = currentSpot.solution.tournamentPhase;
        updateStats(isCorrect, actualPhase, foldEvaluation.points);
        saveSpotResult(userId, isCorrect, actualPhase, undefined, foldEvaluation.points);
        saveSpotHistory(
            userId, 
            currentSpot.playerHandName, 
            isCorrect, 
            actualPhase, 
            foldEvaluation.points,
            currentSpot.playerHand,
            currentSpot.solution.path || currentSpot.solution.id,
            currentSpot.nodeId,
            currentSpot.playerPosition,
            'Fold (Timeout)',
            foldEv
        );
        
        // Callback para modo torneio
        if (onSpotResult) {
            onSpotResult(foldEvaluation.livesLost === 0, foldEvaluation.livesLost);
        }
    }, [userId, updateStats, onSpotResult, userAction]); // Dependencies for callback (currentSpot captured in closure)
    
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
        userAction,
        onTimeExpired: handleTimeExpired
    });
    
    // Stop audio when user leaves page or changes tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                console.log('⏸️ Page hidden - stopping timebank audio');
                stopAudios();
            }
        };
        
        const handleBeforeUnload = () => {
            console.log('👋 Page unloading - stopping timebank audio');
            stopAudios();
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [stopAudios]);
    
    // ============================================================
    // Effects & Lifecycle
    // ============================================================

    // Initialize first spot generation
    useEffect(() => {
        if (!currentSpot) {
            generateNewSpot();
        }
    }, []); // Run once on mount

    // Auto-advance when toggle is activated AFTER already answering
    useEffect(() => {
        console.log('🔄 Auto-advance effect triggered:', {
            autoAdvance,
            userAction,
            tournamentMode,
            willAutoAdvance: autoAdvance && userAction
        });
        
        if (autoAdvance && userAction) {
            const delay = tournamentMode ? 5000 : 2500;
            console.log(`⏰ Setting auto-advance timer for ${delay}ms`);
            const timer = setTimeout(() => {
                console.log('⏰ Auto-advance timer fired!');
                nextSpot();
            }, delay);
            
            return () => {
                console.log('🧹 Cleaning up auto-advance timer');
                clearTimeout(timer);
            };
        }
    }, [autoAdvance, userAction, tournamentMode]); // Watch all relevant states

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
        if (!currentSpot || userAction) {
            console.log('⚠️ Ignoring action: spot already answered or no current spot');
            return; // Já respondeu ou não tem spot
        }
        
        console.log('🎯 Processing action:', actionName);
        console.log('📋 Current spot info:', {
            playerHandName: currentSpot.playerHandName,
            playerHand: currentSpot.playerHand,
            nodeId: currentSpot.nodeId,
            solutionId: currentSpot.solution.id
        });
        
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
        
        console.log('🔍 Node hands available:', {
            totalHands: Object.keys(node.hands).length,
            sampleHands: Object.keys(node.hands).slice(0, 10),
            lookingFor: currentSpot.playerHandName
        });
        
        const handData = node.hands[currentSpot.playerHandName];
        if (!handData) {
            console.error(`❌ Hand ${currentSpot.playerHandName} not found in node`);
            console.error('Available hands:', Object.keys(node.hands).slice(0, 20));
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
            console.error('Available actions:', node.actions.map(a => a.type));
            return;
        }
        
        console.log(`✅ Action found at index ${actionIndex}`);
        
        // Avaliar a qualidade da ação usando o novo sistema
        const evaluation = evaluateAction(
            actionIndex,
            handData.played,
            handData.evs,
            node.actions
        );
        
        console.log('🎯 Action Evaluation Result:', evaluation);
        
        if (!evaluation) {
            console.error('❌ Evaluation returned null/undefined!');
            return;
        }
        
        // Pegar o EV da ação
        const actionEv = handData.evs && handData.evs[actionIndex] !== undefined 
            ? handData.evs[actionIndex] 
            : undefined;
        
        console.log('💾 Setting user action and showing feedback...');
        console.log('🔍 Before setUserAction:', {
            currentSpotHandName: currentSpot.playerHandName,
            currentSpotHand: currentSpot.playerHand,
            nodeId: currentSpot.nodeId,
            action: actionName
        });
        
        // Parar áudio do timebank imediatamente ao clicar em ação
        stopAudios();
        
        setUserAction(actionName);
        console.log('✅ Feedback should now be visible');
        console.log('🎯 userAction SET TO:', actionName);
        
        // Armazenar resultado para usar no mark hand
        setLastActionResult({ evaluation, ev: actionEv });
        
        // Parar o timebank
        stopAudios();
        
        // Determinar se é "correto" para estatísticas gerais
        const isCorrect = isActionCorrect(evaluation.quality);
        
        // Salvar resultado com pontuação correta
        const actualPhase = currentSpot.solution.tournamentPhase;
        updateStats(isCorrect, actualPhase, evaluation.points);
        saveSpotResult(userId, isCorrect, actualPhase, undefined, evaluation.points);
        saveSpotHistory(
            userId, 
            currentSpot.playerHandName, 
            isCorrect, 
            actualPhase, 
            evaluation.points,
            currentSpot.playerHand,
            currentSpot.solution.path || currentSpot.solution.id,
            currentSpot.nodeId,
            currentSpot.playerPosition,
            actionName,
            actionEv
        );
        
        // Callback para modo torneio (passa vidas perdidas)
        if (onSpotResult) {
            console.log('🏆 Tournament Mode: Calling onSpotResult with:', {
                quality: evaluation.quality,
                livesLost: evaluation.livesLost
            });
            // Para modo torneio, passa isCorrect E livesLost
            onSpotResult(evaluation.livesLost === 0, evaluation.livesLost);
        }
        
        // Auto-advance se ativado
        console.log('🔄 Auto-advance check in checkAnswer:', {
            autoAdvance,
            tournamentMode,
            willAutoAdvance: autoAdvance === true
        });
        
        if (autoAdvance) {
            const delay = tournamentMode ? 5000 : 2500;
            console.log(`⏰ AUTO-ADVANCE ENABLED! Setting timeout for ${delay}ms`);
            setTimeout(() => {
                console.log('⏰ Auto-advance timeout fired from checkAnswer!');
                nextSpot();
            }, delay);
        } else {
            console.log('✋ Auto-advance is OFF in checkAnswer - user must click NEXT HAND');
        }
    };

    const nextSpot = async () => {
        console.log('⏭️ NextSpot called - showing loading');
        console.log('🔍 NextSpot called from:', new Error().stack?.split('\n')[2]);
        setIsLoadingNextHand(true);
        
        // Small delay to ensure loading appears smoothly
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setUserAction(null);
        setIsHandMarked(false);
        setLastActionResult(null);
        stopAudios();
        
        // Generate new spot (can take some time)
        await generateNewSpot();
        
        // Hide loading after spot is ready
        console.log('✅ New spot ready - hiding loading');
        setIsLoadingNextHand(false);
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
        
        // Determinar se foi correto baseado na avaliação
        const isCorrect = isActionCorrect(lastActionResult.evaluation.quality);
        
        const markedHand = {
            id: handId,
            timestamp: Date.now(),
            solutionPath: currentSpot.solution.path || currentSpot.solution.id,
            nodeId: currentSpot.nodeId,
            hand: currentSpot.playerHandName,
            combo: currentSpot.playerHand,
            position: currentSpot.playerPosition,
            playerAction: userAction || 'N/A',
            isCorrect: isCorrect,
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
                        userAction={userAction}
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
                    {userAction && (
                        <TrainerFeedback
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
                            tournamentComplete={tournamentComplete}
                            onBack={onBack}
                        />
                    )}
                    
                    {/* Loading Transition: Shows when moving to next hand */}
                    <LoadingTransition show={isLoadingNextHand} />
                </div>
            </main>
        </div>
    );
};
