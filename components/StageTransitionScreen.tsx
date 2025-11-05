import React, { useEffect, useState } from 'react';

interface TournamentStage {
    phase: string;
    handsToPlay: number;
    displayName: string;
    playerCount?: number;
}

interface StageTransitionScreenProps {
    currentStage: TournamentStage;
    nextStage: TournamentStage;
    handsPlayedInStage: number;
    stageAccuracy: number;
    stageMistakes: number;
    onContinue: () => void;
}

const AUTO_ADVANCE_DELAY = 5000; // 5 segundos

/**
 * StageTransitionScreen Component
 * 
 * Displays a popup overlay between tournament stages.
 * Shows stage completion stats with 5s auto-advance.
 */
export const StageTransitionScreen: React.FC<StageTransitionScreenProps> = ({
    currentStage,
    nextStage,
    handsPlayedInStage,
    stageAccuracy,
    stageMistakes,
    onContinue
}) => {
    const [timeLeft, setTimeLeft] = useState(5);

    // Auto-advance countdown
    useEffect(() => {
        const timer = setTimeout(() => {
            onContinue();
        }, AUTO_ADVANCE_DELAY);

        // Update countdown every second
        const countdown = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1));
        }, 1000);

        return () => {
            clearTimeout(timer);
            clearInterval(countdown);
        };
    }, [onContinue]);

    // Support Enter key
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                onContinue();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [onContinue]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="max-w-xl w-full">
                {/* Card principal com animação */}
                <div className="bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-green-500/50 p-6 animate-in fade-in zoom-in duration-300">
                    {/* Título */}
                    <div className="text-center mb-6">
                        <div className="text-5xl mb-3">✅</div>
                        <h2 className="text-3xl font-bold text-green-400 mb-1">
                            Stage Complete!
                        </h2>
                        <p className="text-lg text-gray-300">
                            {currentStage.displayName}
                        </p>
                    </div>

                    {/* Estatísticas do estágio */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-gray-900/50 rounded-lg p-3 text-center border border-gray-700">
                            <div className="text-gray-400 text-xs mb-1">Mãos</div>
                            <div className="text-2xl font-bold text-white">{handsPlayedInStage}</div>
                        </div>
                        <div className="bg-green-500/10 rounded-lg p-3 text-center border border-green-500/30">
                            <div className="text-green-400 text-xs mb-1">Precisão</div>
                            <div className="text-2xl font-bold text-green-400">{stageAccuracy.toFixed(0)}%</div>
                        </div>
                        <div className="bg-red-500/10 rounded-lg p-3 text-center border border-red-500/30">
                            <div className="text-red-400 text-xs mb-1">Erros</div>
                            <div className="text-2xl font-bold text-red-400">{stageMistakes.toFixed(1)}</div>
                        </div>
                    </div>

                    {/* Próximo estágio */}
                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 mb-6 border border-blue-500/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-gray-400 text-xs mb-1">Próximo Estágio</div>
                                <div className="text-xl font-bold text-white">{nextStage.displayName}</div>
                                <div className="text-gray-400 text-xs mt-1">
                                    {nextStage.handsToPlay} {nextStage.handsToPlay === 1 ? 'mão' : 'mãos'}
                                </div>
                            </div>
                            <div className="text-4xl">➡️</div>
                        </div>
                    </div>

                    {/* Botão continuar com countdown */}
                    <button
                        onClick={onContinue}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-bold text-lg transition-all shadow-lg border-2 border-green-400/50 uppercase tracking-wider"
                    >
                        Continue ({timeLeft}s) ➡️
                    </button>

                    {/* Dica */}
                    <div className="text-center mt-3 text-gray-400 text-xs">
                        Auto-avançando em {timeLeft}s ou pressione Enter
                    </div>
                </div>
            </div>
        </div>
    );
};
