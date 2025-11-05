import React, { useState, useEffect } from 'react';
import type { AppData } from '../types.ts';
import { TrainerSimulator } from './TrainerSimulator.tsx';

interface TournamentModeProps {
    solutions: AppData[];
    onBack: () => void;
    loadNode: (nodeId: number) => Promise<void>;
    loadNodesForSolution: (solutionId: string) => Promise<void>;
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
    const [mistakes, setMistakes] = useState(0); // Pode ser fracionado (0.5)
    const [isBusted, setIsBusted] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [showingResult, setShowingResult] = useState(false);
    const [spotKey, setSpotKey] = useState(0); // Chave para forçar remontagem do TrainerSimulator

    const currentStage = TOURNAMENT_STAGES[currentStageIndex];

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
                setShowingResult(true);
                return;
            }
        } else {
            console.log('✅ No lives lost!');
        }

        const newHandsInStage = handsPlayedInStage + 1;
        const newTotalHands = totalHandsPlayed + 1;
        
        setHandsPlayedInStage(newHandsInStage);
        setTotalHandsPlayed(newTotalHands);

        // Verificar se completou o estágio
        // (O avanço de spot é gerenciado pelo TrainerSimulator via autoAdvance)
        if (newHandsInStage >= currentStage.handsToPlay) {
            // Verificar se completou o torneio
            if (currentStageIndex >= TOURNAMENT_STAGES.length - 1) {
                setIsComplete(true);
                setShowingResult(true);
            } else {
                // Avançar para próximo estágio após um pequeno delay
                setTimeout(() => {
                    setCurrentStageIndex(currentStageIndex + 1);
                    setHandsPlayedInStage(0);
                    setSpotKey(prev => prev + 1); // Força remontagem do TrainerSimulator
                }, 100);
            }
        }
        // else: Continuar no mesmo estágio - o novo spot será gerado automaticamente
        // pelo TrainerSimulator se autoAdvance estiver ativo
    };

    // Tela de resultado final
    if (showingResult) {
        const accuracy = totalHandsPlayed > 0 
            ? ((totalHandsPlayed - mistakes) / totalHandsPlayed * 100).toFixed(1)
            : '0.0';

        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#1a1d23] p-8">
                <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-12 max-w-2xl w-full">
                    {/* Título */}
                    <div className="text-center mb-8">
                        {isBusted ? (
                            <>
                                <div className="text-6xl mb-4">💥</div>
                                <h1 className="text-4xl font-bold text-red-400 mb-2">BUSTED!</h1>
                                <p className="text-gray-400 text-lg">Você cometeu {MAX_MISTAKES} erros</p>
                            </>
                        ) : (
                            <>
                                <div className="text-6xl mb-4">🏆</div>
                                <h1 className="text-4xl font-bold text-yellow-400 mb-2">TORNEIO COMPLETO!</h1>
                                <p className="text-gray-400 text-lg">Parabéns! Você completou todas as {TOTAL_HANDS} mãos</p>
                            </>
                        )}
                    </div>

                    {/* Estatísticas */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-900/50 rounded-xl p-6 text-center">
                            <div className="text-gray-400 text-sm mb-2">Mãos Jogadas</div>
                            <div className="text-3xl font-bold text-white">{totalHandsPlayed}</div>
                        </div>
                        <div className="bg-gray-900/50 rounded-xl p-6 text-center">
                            <div className="text-gray-400 text-sm mb-2">Precisão</div>
                            <div className="text-3xl font-bold text-green-400">{accuracy}%</div>
                        </div>
                        <div className="bg-gray-900/50 rounded-xl p-6 text-center">
                            <div className="text-gray-400 text-sm mb-2">Acertos</div>
                            <div className="text-3xl font-bold text-green-400">{totalHandsPlayed - mistakes}</div>
                        </div>
                        <div className="bg-gray-900/50 rounded-xl p-6 text-center">
                            <div className="text-gray-400 text-sm mb-2">Erros</div>
                            <div className="text-3xl font-bold text-red-400">{mistakes}</div>
                        </div>
                    </div>

                    {/* Progresso por Estágio */}
                    <div className="mb-8">
                        <h3 className="text-white font-bold mb-4">Estágio Alcançado</h3>
                        <div className="space-y-2">
                            {TOURNAMENT_STAGES.map((stage, index) => {
                                const reached = index < currentStageIndex || (index === currentStageIndex && isComplete);
                                const current = index === currentStageIndex && !isComplete;
                                
                                return (
                                    <div 
                                        key={stage.phase}
                                        className={`flex items-center justify-between p-3 rounded-lg ${
                                            reached 
                                                ? 'bg-green-500/20 border border-green-500/50'
                                                : current
                                                    ? 'bg-yellow-500/20 border border-yellow-500/50'
                                                    : 'bg-gray-700/20 border border-gray-600/50'
                                        }`}
                                    >
                                        <span className={`font-bold ${
                                            reached ? 'text-green-400' : current ? 'text-yellow-400' : 'text-gray-500'
                                        }`}>
                                            {stage.displayName}
                                        </span>
                                        <span className={`text-sm ${
                                            reached ? 'text-green-400' : current ? 'text-yellow-400' : 'text-gray-500'
                                        }`}>
                                            {reached ? '✓ Completo' : current ? `${handsPlayedInStage}/${stage.handsToPlay}` : `0/${stage.handsToPlay}`}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Botões */}
                    <div className="flex gap-4">
                        <button
                            onClick={onBack}
                            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-all"
                        >
                            Voltar ao Menu
                        </button>
                        <button
                            onClick={() => {
                                setCurrentStageIndex(0);
                                setHandsPlayedInStage(0);
                                setTotalHandsPlayed(0);
                                setMistakes(0);
                                setIsBusted(false);
                                setIsComplete(false);
                                setShowingResult(false);
                                setSpotKey(prev => prev + 1);
                            }}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-lg font-bold transition-all"
                        >
                            Jogar Novamente
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Tela de jogo
    return (
        <div className="flex flex-col h-screen bg-[#1a1d23]">
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
                        <span className="font-semibold">Sair do Torneio</span>
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
                            Mão {handsPlayedInStage + 1}/{currentStage.handsToPlay}
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
                    <div className="bg-gray-800/50 rounded-lg p-1.5 text-center">
                        <div className="text-gray-400 text-[10px] mb-0.5">Total</div>
                        <div className="text-white font-bold text-sm">{totalHandsPlayed}/{TOTAL_HANDS}</div>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-1.5 text-center border border-green-500/30">
                        <div className="text-green-400 text-[10px] mb-0.5">Acertos</div>
                        <div className="text-green-400 font-bold text-sm">{totalHandsPlayed - mistakes}</div>
                    </div>
                    <div className="bg-red-500/10 rounded-lg p-1.5 text-center border border-red-500/30">
                        <div className="text-red-400 text-[10px] mb-0.5">Erros</div>
                        <div className="text-red-400 font-bold text-sm">{mistakes.toFixed(1)}/{MAX_MISTAKES}</div>
                    </div>
                    <div className="bg-yellow-500/10 rounded-lg p-1.5 text-center border border-yellow-500/30">
                        <div className="text-yellow-400 text-[10px] mb-0.5">Vidas</div>
                        <div className="text-yellow-400 font-bold text-sm">{(MAX_MISTAKES - mistakes).toFixed(1)}</div>
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
                    playerCountFilter={currentStage.playerCount}
                />
            </div>
        </div>
    );
};
