import React, { useState, useEffect } from 'react';
import { getTrainerAssetUrl } from '../src/config';
import type { AppData } from '../types.ts';
import { TrainerSimulator } from './TrainerSimulator.tsx';
import { recordTournamentPlayed, recordReachedFinalTable, recordCompletedTournament } from '../utils/statsUtils.ts';
import { StageTransitionScreen } from './StageTransitionScreen.tsx';

interface TournamentModeProps {
    solutions: AppData[];
    onBack: () => void;
    loadNode: (nodeId: number) => Promise<void>;
    loadNodesForSolution: (solutionId: string, nodeIdsToLoad?: number[]) => Promise<AppData | null>;
    userId: string;
}

interface TournamentStage {
    phase: string;
    handsToPlay: number;
    displayName: string;
    playerCount?: number; // Para Final Table: 7, 6, 5, 4, 3
}

const TOURNAMENT_STAGES: TournamentStage[] = [
    { phase: '100~60% left', handsToPlay: 10, displayName: '100~60% Field' },
    { phase: '60~40% left', handsToPlay: 5, displayName: '60~40% Field' },
    { phase: '40~20% left', handsToPlay: 5, displayName: '40~20% Field' },
    { phase: 'Near bubble', handsToPlay: 5, displayName: 'Near Bubble' },
    { phase: '3 tables', handsToPlay: 5, displayName: '3 Tables' },
    { phase: '2 tables', handsToPlay: 5, displayName: '2 Tables' },
    { phase: 'Final table', handsToPlay: 2, displayName: 'Final Table (7-handed)', playerCount: 7 },
    { phase: 'Final table', handsToPlay: 2, displayName: 'Final Table (6-handed)', playerCount: 6 },
    { phase: 'Final table', handsToPlay: 2, displayName: 'Final Table (5-handed)', playerCount: 5 },
    { phase: 'Final table', handsToPlay: 2, displayName: 'Final Table (4-handed)', playerCount: 4 },
    { phase: 'Final table', handsToPlay: 2, displayName: 'Final Table (3-handed)', playerCount: 3 }
];

const MAX_MISTAKES = 10;
const TOTAL_HANDS = 45; // 10+5+5+5+5+5+2+2+2+2+2 = 45

export const TournamentMode: React.FC<TournamentModeProps> = ({
    solutions,
    onBack,
    loadNode,
    loadNodesForSolution,
    userId
}) => {
    const [currentStageIndex, setCurrentStageIndex] = useState(0);
    const [handsPlayedInStage, setHandsPlayedInStage] = useState(0);
    const [totalHandsPlayed, setTotalHandsPlayed] = useState(0);
    const [mistakes, setMistakes] = useState(0); // May be fractional (e.g. 0.5)
    const [isBusted, setIsBusted] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [tournamentRecorded, setTournamentRecorded] = useState(false);
    const [finalTableRecorded, setFinalTableRecorded] = useState(false);
    const [completedTournamentRecorded, setCompletedTournamentRecorded] = useState(false);
    const [spotKey, setSpotKey] = useState(0); // Chave para forçar remontagem do TrainerSimulator
    const [isTransitioning, setIsTransitioning] = useState(false); // Transition screen between stages
    const [pendingStageTransition, setPendingStageTransition] = useState(false); // Wait for user to click NEXT HAND
    const [stageMistakesAtStart, setStageMistakesAtStart] = useState(0); // Erros no início do estágio
    
    // Stage statistics: { stageIndex: { handsPlayed, livesLost } }
    const [stageStats, setStageStats] = useState<Record<number, { handsPlayed: number; livesLost: number }>>({});

    const currentStage = TOURNAMENT_STAGES[currentStageIndex];
    const nextStage = currentStageIndex < TOURNAMENT_STAGES.length - 1 
        ? TOURNAMENT_STAGES[currentStageIndex + 1] 
        : null;

    // Callback quando o usuário responde um spot
    const handleSpotResult = (isCorrect: boolean, livesLost: number = 0) => {
        console.log('🎮 TournamentMode: Received spot result:', { isCorrect, livesLost });
        console.log('📊 Current state:', { mistakes, handsPlayedInStage, totalHandsPlayed });
        
        // Incrementar mistakes baseado em vidas perdidas
        if (livesLost > 0) {
            const newMistakes = mistakes + livesLost;
            console.log(`❌ Lives lost: ${livesLost}! Incrementing mistakes: ${mistakes} → ${newMistakes}`);
            setMistakes(newMistakes);
            
            if (newMistakes >= MAX_MISTAKES) {
                console.log('💀 BUSTED! Reached max mistakes');
                setIsBusted(true);
                return;
            }
        } else {
            console.log('✅ No lives lost!');
        }

        const newHandsInStage = handsPlayedInStage + 1;
        const newTotalHands = totalHandsPlayed + 1;
        
        setHandsPlayedInStage(newHandsInStage);
        setTotalHandsPlayed(newTotalHands);
        
        // Atualizar estatísticas do estágio atual
        setStageStats(prev => ({
            ...prev,
            [currentStageIndex]: {
                handsPlayed: newHandsInStage,
                livesLost: (prev[currentStageIndex]?.livesLost || 0) + livesLost
            }
        }));

        // Verificar se completou o estágio
        if (newHandsInStage >= currentStage.handsToPlay) {
            console.log('🎯 Stage complete!', { newHandsInStage, handsToPlay: currentStage.handsToPlay });
            
            // Verificar se completou o torneio
            if (currentStageIndex >= TOURNAMENT_STAGES.length - 1) {
                console.log('🏆 Tournament complete!');
                setIsComplete(true);
            } else {
                // Mostrar tela de transição
                console.log('🎬 Showing stage transition screen...');
                // Instead of showing immediately, wait until user clicks NEXT HAND in feedback
                setPendingStageTransition(true);
            }
        }
        // else: Continuar no mesmo estágio - o novo spot será gerado automaticamente
        // pelo TrainerSimulator se autoAdvance estiver ativo
    };

    // Calcular accuracy para passar ao TrainerSimulator
    const accuracy = totalHandsPlayed > 0 
        ? ((totalHandsPlayed - mistakes) / totalHandsPlayed * 100).toFixed(1)
        : '0.0';

    // Calcular vidas restantes e preparação dos ícones de coração
    const livesRemaining = Math.max(0, MAX_MISTAKES - mistakes);
    const fullHearts = Math.floor(livesRemaining);
    const hasHalfHeart = (livesRemaining - fullHearts) >= 0.5;
    const maxHeartsToShow = 10; // Limita quantos ícones desenhar para evitar overflow

    // Calcular estatísticas do estágio atual
    const stageMistakes = mistakes - stageMistakesAtStart;
    const stageAccuracy = handsPlayedInStage > 0
        ? ((handsPlayedInStage - stageMistakes) / handsPlayedInStage * 100)
        : 100;

    // Função para continuar para o próximo estágio
    const handleContinueToNextStage = () => {
        console.log('➡️ Continuing to next stage...');
        setIsTransitioning(false);
        setCurrentStageIndex(currentStageIndex + 1);
        setHandsPlayedInStage(0);
        setStageMistakesAtStart(mistakes); // Salva erros atuais para próximo estágio
        setSpotKey(prev => prev + 1); // Força remontagem do TrainerSimulator
    };

    // Função para reiniciar torneio
    const handleRestartTournament = () => {
        setCurrentStageIndex(0);
        setHandsPlayedInStage(0);
        setTotalHandsPlayed(0);
        setMistakes(0);
        setStageMistakesAtStart(0);
        setStageStats({});
        setIsBusted(false);
        setIsComplete(false);
        setIsTransitioning(false);
        setSpotKey(prev => prev + 1);
        // Reset recorded flags so a subsequent tournament can record metrics again
        setTournamentRecorded(false);
        setFinalTableRecorded(false);
        setCompletedTournamentRecorded(false);
    };

    // Parent handler to intercept NEXT HAND requests from TrainerSimulator.
    // If a stage transition is pending, show the transition screen and prevent advancing to next spot.
    const handleRequestNextSpot = async (): Promise<boolean> => {
        if (pendingStageTransition) {
            console.log('➡️ NEXT HAND clicked - showing Stage Transition now');
            setIsTransitioning(true);
            setPendingStageTransition(false);
            return false; // Prevent TrainerSimulator from advancing immediately
        }
        return true; // Allow TrainerSimulator to proceed to next spot
    };

    // When the tournament finishes (busted or completed all stages), record it once
    React.useEffect(() => {
        if ((isBusted || isComplete) && !tournamentRecorded) {
            console.log('🏁 Tournament finished - recording tournamentsPlayed');
            recordTournamentPlayed(userId).catch(err => console.error('Failed to record tournamentPlayed:', err));
            setTournamentRecorded(true);
        }
    }, [isBusted, isComplete, tournamentRecorded, userId]);

    // When the user reaches any Final Table stage, record it once per tournament
    React.useEffect(() => {
        if (currentStage.phase === 'Final table' && !finalTableRecorded) {
            console.log('🎯 Reached Final Table - recording reachedFinalTable');
            recordReachedFinalTable(userId).catch(err => console.error('Failed to record reachedFinalTable:', err));
            setFinalTableRecorded(true);
        }
    }, [currentStageIndex, currentStage.phase, finalTableRecorded, userId]);

    // When tournament completes normally (isComplete), record completedTournaments once
    React.useEffect(() => {
        if (isComplete && !completedTournamentRecorded) {
            console.log('🏆 Tournament fully completed - recording completedTournaments');
            recordCompletedTournament(userId).catch(err => console.error('Failed to record completedTournament:', err));
            setCompletedTournamentRecorded(true);
        }
    }, [isComplete, completedTournamentRecorded, userId]);

    // Tela de jogo
    return (
        <div className="flex flex-col h-screen bg-[#1a1d23]">
            {/* Popup de transição de estágio */}
            {isTransitioning && nextStage && (
                <StageTransitionScreen
                    currentStage={currentStage}
                    nextStage={nextStage}
                    handsPlayedInStage={handsPlayedInStage}
                    stageAccuracy={stageAccuracy}
                    stageMistakes={stageMistakes}
                    onContinue={handleContinueToNextStage}
                />
            )}

            {/* Header com progresso - 50% menor */}
            <div className="bg-[#23272f] border-b border-gray-700 px-4 py-2">
                <div className="flex items-center justify-between mb-2">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />   
                        </svg>
                        <span className="font-semibold">Exit Tournament</span>
                    </button>
                    <h1 className="text-lg font-bold text-white">🏆 Tournament Mode</h1>
                    <div className="w-24"></div> {/* Spacer para centralizar */}
                </div>

                {/* Barra de progresso do torneio */}
                <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-bold text-xs">
                            {currentStage.displayName}
                        </span>
                        <span className="text-gray-400 text-xs">
                            Hand {handsPlayedInStage + 1}/{currentStage.handsToPlay}
                        </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-teal-500 to-emerald-600 h-full transition-all duration-300"
                            style={{ width: `${(handsPlayedInStage / currentStage.handsToPlay) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Stats - 50% menor */}
                <div className="grid grid-cols-4 gap-2">
                    <div className="bg-blue-700/10 rounded-lg p-1.5 text-center border border-blue-500/30">
                        <div className="text-blue-400 text-[20px] mb-0.5">Total</div>
                        <div className="text-blue-400 font-bold text-2xl">{totalHandsPlayed}/{TOTAL_HANDS}</div>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-1.5 text-center border border-green-500/30">
                        <div className="text-green-400 text-[20px] mb-0.5">Correct</div>
                        <div className="text-green-400 font-bold text-2xl">{totalHandsPlayed - mistakes}</div>
                    </div>
                    <div className="bg-red-500/10 rounded-lg p-1.5 text-center border border-red-500/30">
                        <div className="text-red-400 text-[20px] mb-0.5">Mistakes</div>
                        <div className="text-red-400 font-bold text-2xl">{mistakes.toFixed(1)}/{MAX_MISTAKES}</div>
                    </div>
                    <div className="bg-yellow-500/10 rounded-lg p-1.5 text-center border border-yellow-500/30">
                        <div className="text-yellow-400 text-[20px] mb-0.5">Lives</div>
                        <div className="flex flex-col items-center">
                            {/* Hearts row (top) */}
                            <div className="flex items-center gap-1 mb-1" aria-label={`Lives remaining: ${livesRemaining.toFixed(1)}`}>
                                {Array.from({ length: Math.min(fullHearts, maxHeartsToShow) }).map((_, i) => (
                                    <img
                                        key={`heart-full-${i}`}
                                        src={getTrainerAssetUrl('heart.png')}
                                        alt="heart"
                                        className="w-4 h-4"
                                        aria-hidden="true"
                                    />
                                ))}
                                {hasHalfHeart && fullHearts < maxHeartsToShow && (
                                    <img
                                        key={`heart-half`}
                                        src={getTrainerAssetUrl('heart.png')}
                                        alt="half-heart"
                                        className="w-4 h-4 opacity-60"
                                        aria-hidden="true"
                                        style={{ clipPath: 'inset(0 50% 0 0)' }}
                                    />
                                )}

                                {/* Numeric value placed inline after hearts in format " (X.0)" */}
                                <span className="text-yellow-400 font-bold text-xl ml-2">({livesRemaining.toFixed(1)})</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TrainerSimulator */}
            <div className="flex-1 overflow-hidden">
                <TrainerSimulator
                    key={spotKey}
                    solutions={solutions}
                    selectedPhases={[currentStage.phase]}
                    selectedSpotTypes={['Any']}
                    onBack={onBack}
                    loadNode={loadNode}
                    loadNodesForSolution={loadNodesForSolution}
                    userId={userId}
                    tournamentPhase={currentStage.phase}
                    tournamentMode={true}
                    onSpotResult={handleSpotResult}
                    onRequestNextSpot={handleRequestNextSpot}
                    playerCountFilter={currentStage.playerCount}
                    tournamentComplete={
                        isBusted || isComplete ? {
                            isBusted,
                            isComplete,
                            totalHandsPlayed,
                            mistakes,
                            accuracy,
                            stages: TOURNAMENT_STAGES,
                            currentStageIndex,
                            handsPlayedInStage,
                            stageStats,
                            onRestart: handleRestartTournament
                        } : undefined
                    }
                />
            </div>
        </div>
    );
};
