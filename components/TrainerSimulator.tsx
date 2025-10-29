import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { AppData, NodeData } from '../types.ts';
import { PokerTableVisual } from './PokerTableVisual.tsx';
import { PlayerHand } from './PlayerHand.tsx';
import { randomElement, getRandomCombo, selectHandFromRange, comboIndexToString } from '../lib/trainerUtils.ts';
import { generateHandMatrix } from '../lib/pokerUtils.ts';

interface TrainerSimulatorProps {
    solutions: AppData[];
    selectedPhase: string;
    onBack: () => void;
    loadNode: (nodeId: number) => Promise<void>;
}

interface SpotSimulation {
    solution: AppData;
    nodeId: number;
    playerPosition: number;
    playerHand: string; // Combo específico (ex: "AhKd")
    playerHandName: string; // Nome da mão (ex: "AKo")
}

const tournamentPhases = [
    '100~60% left',
    '60~40% left',
    '40~20% left',
    'Near bubble',
    '3 tables',
    '2 tables',
    'Final table'
];

export const TrainerSimulator: React.FC<TrainerSimulatorProps> = ({ 
    solutions, 
    selectedPhase, 
    onBack,
    loadNode 
}) => {
    const [currentSpot, setCurrentSpot] = useState<SpotSimulation | null>(null);
    const [userAction, setUserAction] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [displayMode] = useState<'bb' | 'chips'>('bb');
    const [stats, setStats] = useState({
        totalQuestions: 0,
        correctAnswers: 0,
        score: 0
    });

    // Filtra soluções pela fase selecionada
    const phaseSolutions = useMemo(() => {
        return solutions.filter(s => s.tournamentPhase === selectedPhase);
    }, [solutions, selectedPhase]);

    // Sorteia um novo spot
    const generateNewSpot = useCallback(async () => {
        if (phaseSolutions.length === 0) return;

        // 1. Sorteia uma solução aleatória
        const randomSolution: AppData = randomElement(phaseSolutions);

        // 2. Garante que o node 0 está carregado
        if (!randomSolution.nodes.has(0)) {
            await loadNode(0);
        }

        // 3. Sorteia um node aleatório (começando do 0 por enquanto)
        const nodeId = 0;
        const node: NodeData | undefined = randomSolution.nodes.get(nodeId);
        
        if (!node) {
            console.error('Node not found');
            return;
        }

        // 4. Sorteia uma posição (player) aleatória
        const numPlayers = randomSolution.settings.handdata.stacks.length;
        const randomPlayerPosition = Math.floor(Math.random() * numPlayers);

        // 5. Pega o range do jogador nessa posição
        const handMatrix = generateHandMatrix();
        const allHands = handMatrix.flat();
        
        // Filtra mãos que são jogadas (frequência > 0)
        const playedHands = allHands.filter((handName, index) => {
            const handData = node.hands[index];
            if (!handData) return false;
            const totalFreq = handData.played.reduce((sum, freq) => sum + freq, 0);
            return totalFreq > 0;
        });

        if (playedHands.length === 0) {
            console.error('No hands played in this spot');
            return;
        }

        // 6. Sorteia uma mão do range
        const randomHandName = randomElement(playedHands);
        const handIndex = allHands.indexOf(randomHandName);
        const handData = node.hands[handIndex];

        // 7. Sorteia um combo específico dessa mão
        const randomCombo = getRandomCombo(randomHandName);

        setCurrentSpot({
            solution: randomSolution,
            nodeId,
            playerPosition: randomPlayerPosition,
            playerHand: randomCombo,
            playerHandName: randomHandName
        });

        setUserAction(null);
        setShowFeedback(false);
    }, [phaseSolutions, loadNode]);

    // Carrega o primeiro spot ao montar
    useEffect(() => {
        generateNewSpot();
    }, [generateNewSpot]);

    // Verifica a resposta do usuário
    const checkAnswer = (actionName: string) => {
        if (!currentSpot) return;

        const node = currentSpot.solution.nodes.get(currentSpot.nodeId);
        if (!node) return;

        const handMatrix = generateHandMatrix();
        const allHands = handMatrix.flat();
        const handIndex = allHands.indexOf(currentSpot.playerHandName);
        const handData = node.hands[handIndex];

        if (!handData) return;

        setUserAction(actionName);
        setShowFeedback(true);

        // Encontra a ação escolhida
        const chosenAction = node.actions.find(a => a.name === actionName);
        if (!chosenAction) return;

        // Calcula a frequência da ação escolhida para essa mão
        const actionIndex = node.actions.indexOf(chosenAction);
        const actionFreq = handData.played[actionIndex] || 0;

        // Encontra a ação GTO (mais frequente) para essa mão
        const gtoActionIndex = handData.played.indexOf(Math.max(...handData.played));
        const gtoAction = node.actions[gtoActionIndex];
        const gtoFreq = handData.played[gtoActionIndex];

        // Verifica se acertou
        const isCorrect = actionName === gtoAction.name;

        // Calcula pontuação
        const scorePoints = isCorrect ? 100 : Math.max(0, (actionFreq / gtoFreq) * 100);

        setStats(prev => ({
            totalQuestions: prev.totalQuestions + 1,
            correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
            score: prev.score + scorePoints
        }));
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

    const node = currentSpot.solution.nodes.get(currentSpot.nodeId);
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

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-[#1a1d23]">
            {/* Header com estatísticas */}
            <div className="bg-[#282c33] border-b border-gray-700 p-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="px-4 py-2 bg-[#2d3238] hover:bg-[#353a42] text-white rounded-lg transition-colors"
                        >
                            ← Voltar
                        </button>
                        <h1 className="text-xl font-bold text-white">{selectedPhase}</h1>
                    </div>
                    
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

            {/* Main content */}
            <main className="flex-1 p-4 overflow-auto">
                <div className="max-w-[1800px] mx-auto space-y-4">
                    {/* Mesa visual */}
                    <div className="relative flex items-center justify-center bg-[#23272f] rounded-lg p-4 min-h-[500px]">
                        <PokerTableVisual 
                            currentNode={node}
                            settings={settings}
                            bigBlind={bigBlind}
                            displayMode={displayMode}
                        />
                        
                        {/* Mão do jogador no centro */}
                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-4 border-2 border-yellow-500 shadow-2xl shadow-yellow-500/30">
                                <div className="text-center mb-2">
                                    <span className="text-yellow-400 font-bold text-sm">Sua Mão</span>
                                </div>
                                <PlayerHand hand={currentSpot.playerHand} />
                            </div>
                        </div>
                    </div>

                    {/* Ações disponíveis */}
                    {!showFeedback ? (
                        <div className="bg-transparent rounded-lg p-6">
                            <h3 className="text-white text-2xl font-bold mb-6 text-center">Qual ação você tomaria?</h3>
                            <div className="flex gap-6 justify-center flex-wrap">
                                {node.actions.map(action => {
                                    const actionColors: Record<string, { bg: string; shadow: string }> = {
                                        'Fold': { bg: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-500/50' },
                                        'Call': { bg: 'from-green-500 to-emerald-600', shadow: 'shadow-green-500/50' },
                                        'Check': { bg: 'from-gray-500 to-gray-600', shadow: 'shadow-gray-500/50' },
                                        'Raise': { bg: 'from-orange-500 to-red-600', shadow: 'shadow-orange-500/50' },
                                        'Allin': { bg: 'from-purple-500 to-pink-600', shadow: 'shadow-purple-500/50' },
                                    };
                                    
                                    const colors = actionColors[action.name] || { bg: 'from-gray-600 to-gray-700', shadow: 'shadow-gray-500/50' };
                                    
                                    return (
                                        <button
                                            key={action.name}
                                            onClick={() => checkAnswer(action.name)}
                                            className={`
                                                relative overflow-hidden
                                                bg-gradient-to-br ${colors.bg}
                                                text-white px-12 py-6 rounded-2xl 
                                                font-bold text-xl
                                                transition-all duration-300 
                                                transform hover:scale-110 hover:-translate-y-1
                                                shadow-xl ${colors.shadow}
                                                border-2 border-white/20
                                                min-w-[180px]
                                            `}
                                            style={{
                                                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                                            <span className="relative z-10">{action.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#23272f] rounded-lg p-6">
                            <div className="space-y-4">
                                {/* Resultado */}
                                <div className="text-center mb-4">
                                    {(() => {
                                        const handMatrix = generateHandMatrix();
                                        const allHands = handMatrix.flat();
                                        const handIndex = allHands.indexOf(currentSpot.playerHandName);
                                        const handData = node.hands[handIndex];
                                        const gtoActionIndex = handData.played.indexOf(Math.max(...handData.played));
                                        const gtoAction = node.actions[gtoActionIndex];
                                        const isCorrect = userAction === gtoAction.name;

                                        return (
                                            <div className={`text-3xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                                {isCorrect ? '✓ Correto!' : '✗ Incorreto'}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Análise da mão */}
                                <div className="bg-[#2d3238] rounded-lg p-4">
                                    <h4 className="text-white font-bold mb-3">Análise GTO para {currentSpot.playerHandName}:</h4>
                                    <div className="space-y-2">
                                        {node.actions.map((action, actionIndex) => {
                                            const handMatrix = generateHandMatrix();
                                            const allHands = handMatrix.flat();
                                            const handIndex = allHands.indexOf(currentSpot.playerHandName);
                                            const handData = node.hands[handIndex];
                                            const freq = handData.played[actionIndex] || 0;
                                            const percentage = (freq * 100).toFixed(1);
                                            const isUserChoice = action.name === userAction;
                                            const isGTO = freq === Math.max(...handData.played);

                                            return (
                                                <div 
                                                    key={action.name}
                                                    className={`flex items-center justify-between p-3 rounded-lg ${
                                                        isUserChoice ? 'bg-purple-500/20 border-2 border-purple-400' : 'bg-[#1a1d23]'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-white font-bold">{action.name}</span>
                                                        {isUserChoice && <span className="text-purple-400 text-sm">(Sua escolha)</span>}
                                                        {isGTO && <span className="text-teal-400 text-sm font-bold">(GTO)</span>}
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-48 bg-gray-700 rounded-full h-3">
                                                            <div 
                                                                className="bg-teal-400 h-3 rounded-full transition-all duration-500"
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-white font-mono w-16 text-right">{percentage}%</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <button
                                    onClick={nextSpot}
                                    className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white px-6 py-4 rounded-lg font-bold text-lg transition-all shadow-lg"
                                >
                                    Próximo Spot →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
