import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { AppData, NodeData } from '../types.ts';
import { TrainerSimulator } from './TrainerSimulator.tsx';
import { getResourceUrl } from '../config.ts';

interface TrainerProps {
    solutions: AppData[];
    onBack: () => void;
    loadNode: (nodeId: number) => Promise<void>;
    loadMultipleNodes: (nodeIds: number[]) => Promise<void>;
}

interface TrainingSession {
    solutionId: string;
    currentNodeId: number;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
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

export const Trainer: React.FC<TrainerProps> = ({ solutions, onBack, loadNode, loadMultipleNodes }) => {
    const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
    const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(null);
    const [session, setSession] = useState<TrainingSession | null>(null);
    const [currentNodeId, setCurrentNodeId] = useState<number>(0);
    const [selectedHand, setSelectedHand] = useState<string | null>(null);
    const [userAction, setUserAction] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [displayMode, setDisplayMode] = useState<'bb' | 'chips'>('bb');
    const [isLoadingNode, setIsLoadingNode] = useState(false);

    const selectedSolution = useMemo(() => {
        return solutions.find(s => s.id === selectedSolutionId);
    }, [solutions, selectedSolutionId]);

    const bigBlind = useMemo(() => {
        if (!selectedSolution) return 0;
        const blinds = selectedSolution.settings.handdata.blinds;
        return blinds.length > 1 ? Math.max(blinds[0], blinds[1]) : (blinds[0] || 0);
    }, [selectedSolution]);

    const currentNode = useMemo(() => {
        return selectedSolution?.nodes.get(currentNodeId);
    }, [selectedSolution, currentNodeId]);

    const parentMap = useMemo(() => {
        const map = new Map<number, number>();
        if (!selectedSolution) return map;
        for (const [nodeId, nodeData] of selectedSolution.nodes.entries()) {
            for (const action of nodeData.actions) {
                if (typeof action.node === 'number') {
                    map.set(action.node, nodeId);
                }
            }
        }
        return map;
    }, [selectedSolution]);

    const pathNodeIds = useMemo(() => {
        if (!parentMap.size) return [0];
        const path: number[] = [];
        let currentId: number | undefined = currentNodeId;
        while (typeof currentId === 'number') {
            path.unshift(currentId);
            currentId = parentMap.get(currentId);
        }
        return path;
    }, [currentNodeId, parentMap]);

    // Iniciar sessão de treino
    const startTraining = (solutionId: string) => {
        setSelectedSolutionId(solutionId);
        setSession({
            solutionId,
            currentNodeId: 0,
            score: 0,
            totalQuestions: 0,
            correctAnswers: 0,
        });
        setCurrentNodeId(0);
        setShowFeedback(false);
        setUserAction(null);
        
        // Carregar node inicial
        const solution = solutions.find(s => s.id === solutionId);
        if (solution && !solution.nodes.has(0)) {
            loadNode(0);
        }
    };

    // Verificar resposta do usuário
    const checkAnswer = (actionName: string) => {
        if (!currentNode || !session) return;

        setUserAction(actionName);
        setShowFeedback(true);

        // Encontrar a ação escolhida
        const chosenAction = currentNode.actions.find(a => a.name === actionName);
        if (!chosenAction) return;

        // Calcular frequência total da ação escolhida
        const totalFreq = chosenAction.played.reduce((sum, freq) => sum + freq, 0);
        
        // Encontrar a ação mais frequente (GTO)
        const actionFrequencies = currentNode.actions.map(action => ({
            name: action.name,
            totalFreq: action.played.reduce((sum, freq) => sum + freq, 0)
        }));
        const gtoAction = actionFrequencies.reduce((max, curr) => 
            curr.totalFreq > max.totalFreq ? curr : max
        );

        // Calcular score baseado na diferença de frequência
        const isCorrect = actionName === gtoAction.name;
        const freqDiff = Math.abs(totalFreq - gtoAction.totalFreq);
        const scorePoints = isCorrect ? 100 : Math.max(0, 100 - freqDiff * 10);

        setSession(prev => prev ? {
            ...prev,
            totalQuestions: prev.totalQuestions + 1,
            correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
            score: prev.score + scorePoints,
        } : null);
    };

    // Próxima questão
    const nextQuestion = () => {
        if (!currentNode || !userAction) return;

        const chosenAction = currentNode.actions.find(a => a.name === userAction);
        if (!chosenAction || typeof chosenAction.node !== 'number') {
            // Se não há próximo node, voltar ao início
            setCurrentNodeId(0);
            setShowFeedback(false);
            setUserAction(null);
            return;
        }

        // Carregar próximo node
        const nextNodeId = chosenAction.node;
        setCurrentNodeId(nextNodeId);
        setShowFeedback(false);
        setUserAction(null);
        setSelectedHand(null);

        // Carregar node se necessário
        if (selectedSolution && !selectedSolution.nodes.has(nextNodeId)) {
            loadNode(nextNodeId);
        }
    };

    // Tela de seleção de fase
    if (!selectedPhase) {
        return (
            <div className="flex flex-col h-screen bg-[#1a1d23]">
                {/* Header */}
                <div className="bg-[#282c33] border-b border-gray-700 p-4">
                    <div className="flex items-center justify-between max-w-7xl mx-auto">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onBack}
                                className="px-4 py-2 bg-[#2d3238] hover:bg-[#353a42] text-white rounded-lg transition-colors"
                            >
                                ← Voltar
                            </button>
                            <h1 className="text-2xl font-bold text-white">Trainer - Selecione a Fase do Torneio</h1>
                        </div>
                    </div>
                </div>

                {/* Seleção de fase */}
                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tournamentPhases.map(phase => {
                                const phaseSolutions = solutions.filter(s => s.tournamentPhase === phase);
                                if (phaseSolutions.length === 0) return null;

                                return (
                                    <button
                                        key={phase}
                                        onClick={() => setSelectedPhase(phase)}
                                        className="group bg-gradient-to-br from-[#2d3238] to-[#23272f] hover:from-[#353a42] hover:to-[#2d3238] rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 border-2 border-transparent hover:border-purple-400 shadow-lg"
                                    >
                                        <div className="space-y-4">
                                            <div className="flex justify-center">
                                                <div className="p-4 bg-purple-500/20 rounded-full group-hover:bg-purple-500/30 transition-colors duration-300">
                                                    <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            
                                            <h3 className="text-xl font-bold text-white text-center">
                                                {phase}
                                            </h3>
                                            
                                            <div className="text-center text-gray-400">
                                                {phaseSolutions.length} {phaseSolutions.length === 1 ? 'solução' : 'soluções'}
                                            </div>

                                            <div className="pt-2 text-purple-400 font-semibold text-sm text-center group-hover:translate-x-2 transition-transform duration-300">
                                                Selecionar →
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Tela de seleção de solução
    if (!selectedSolutionId || !selectedSolution) {
        const filteredSolutions = solutions.filter(s => s.tournamentPhase === selectedPhase);
        
        return (
            <div className="flex flex-col h-screen bg-[#1a1d23]">
                {/* Header */}
                <div className="bg-[#282c33] border-b border-gray-700 p-4">
                    <div className="flex items-center justify-between max-w-7xl mx-auto">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSelectedPhase(null)}
                                className="px-4 py-2 bg-[#2d3238] hover:bg-[#353a42] text-white rounded-lg transition-colors"
                            >
                                ← Voltar
                            </button>
                            <h1 className="text-2xl font-bold text-white">
                                Trainer - {selectedPhase}
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Lista de soluções */}
                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredSolutions.map(solution => {
                                const numPlayers = solution.settings.handdata.stacks.length;
                                const avgStack = solution.settings.handdata.stacks.reduce((a, b) => a + b, 0) / numPlayers;
                                const blinds = solution.settings.handdata.blinds;
                                const bb = blinds.length > 1 ? Math.max(blinds[0], blinds[1]) : (blinds[0] || 1);
                                const avgStackBB = (avgStack / bb).toFixed(1);

                                return (
                                    <button
                                        key={solution.id}
                                        onClick={() => startTraining(solution.id)}
                                        className="group bg-[#2d3238] hover:bg-[#353a42] rounded-xl p-6 transition-all duration-300 transform hover:scale-105 border-2 border-transparent hover:border-teal-400"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-teal-400 uppercase">
                                                    {solution.tournamentPhase}
                                                </span>
                                                <span className="text-sm text-gray-400">
                                                    {numPlayers} jogadores
                                                </span>
                                            </div>
                                            
                                            <h3 className="text-lg font-bold text-white text-left">
                                                {solution.fileName}
                                            </h3>
                                            
                                            <div className="flex items-center justify-between text-sm text-gray-400">
                                                <span>Stack médio: {avgStackBB}bb</span>
                                            </div>

                                            <div className="pt-2 text-teal-400 font-semibold text-sm group-hover:translate-x-2 transition-transform duration-300">
                                                Começar treino →
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Tela de treino
    if (!currentNode) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#1a1d23]">
                <div className="text-white text-xl">Carregando node...</div>
            </div>
        );
    }

    const { settings } = selectedSolution;
    const { stacks } = settings.handdata;
    const playerStack = stacks[currentNode.player];
    const numPlayers = stacks.length;

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-[#1a1d23]">
            {/* Header com score */}
            <div className="bg-[#282c33] border-b border-gray-700 p-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                setSelectedSolutionId(null);
                                setSession(null);
                            }}
                            className="px-4 py-2 bg-[#2d3238] hover:bg-[#353a42] text-white rounded-lg transition-colors"
                        >
                            ← Voltar
                        </button>
                        <h1 className="text-xl font-bold text-white">{selectedSolution.fileName}</h1>
                    </div>
                    
                    {session && (
                        <div className="flex items-center gap-6 text-white">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-teal-400">{session.score}</div>
                                <div className="text-xs text-gray-400">Pontos</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">{session.correctAnswers}/{session.totalQuestions}</div>
                                <div className="text-xs text-gray-400">Acertos</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-emerald-400">
                                    {session.totalQuestions > 0 ? Math.round((session.correctAnswers / session.totalQuestions) * 100) : 0}%
                                </div>
                                <div className="text-xs text-gray-400">Precisão</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Header com situação */}
            <Header 
                currentNodeId={currentNodeId}
                currentNode={currentNode}
                bigBlind={bigBlind}
                settings={settings}
                allNodes={selectedSolution.nodes}
                onNodeChange={setCurrentNodeId}
                parentMap={parentMap}
                pathNodeIds={pathNodeIds}
                displayMode={displayMode}
                tournamentPhase={selectedSolution.tournamentPhase}
                onChangeSolution={() => {}}
                loadMultipleNodes={loadMultipleNodes}
                fileName={selectedSolution.fileName}
            />

            {/* Main content */}
            <main className="flex-1 p-4 overflow-auto">
                <div className="max-w-[1800px] mx-auto space-y-4">
                    {/* Mesa e Range lado a lado */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Mesa visual */}
                        <div className="flex items-center justify-center bg-[#23272f] rounded-lg p-4 min-h-[400px]">
                            <PokerTableVisual 
                                currentNode={currentNode}
                                settings={settings}
                                bigBlind={bigBlind}
                                displayMode={displayMode}
                            />
                        </div>

                        {/* Range Grid */}
                        <div className="flex items-center justify-center bg-[#23272f] rounded-lg p-4">
                            <RangeGrid 
                                currentNode={currentNode}
                                bigBlind={bigBlind}
                                playerStack={playerStack}
                                selectedHand={selectedHand}
                                setSelectedHand={setSelectedHand}
                                displayMode={displayMode}
                                playerIndex={currentNode.player}
                                numPlayers={numPlayers}
                                settings={settings}
                            />
                        </div>
                    </div>

                    {/* Ações disponíveis */}
                    {!showFeedback ? (
                        <div className="bg-transparent rounded-lg p-6">
                            <h3 className="text-white text-2xl font-bold mb-6 text-center">Qual ação você tomaria?</h3>
                            <div className="flex gap-6 justify-center flex-wrap">
                                {currentNode.actions.map(action => {
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
                                <h3 className="text-white text-xl font-bold">Resultado</h3>
                                
                                {/* Mostrar frequências de cada ação */}
                                <div className="space-y-2">
                                    {currentNode.actions.map(action => {
                                        const totalFreq = action.played.reduce((sum, freq) => sum + freq, 0);
                                        const percentage = (totalFreq * 100).toFixed(1);
                                        const isUserChoice = action.name === userAction;
                                        const actionFrequencies = currentNode.actions.map(a => ({
                                            name: a.name,
                                            totalFreq: a.played.reduce((sum, freq) => sum + freq, 0)
                                        }));
                                        const gtoAction = actionFrequencies.reduce((max, curr) => 
                                            curr.totalFreq > max.totalFreq ? curr : max
                                        );
                                        const isGTO = action.name === gtoAction.name;

                                        return (
                                            <div 
                                                key={action.name}
                                                className={`flex items-center justify-between p-3 rounded-lg ${
                                                    isUserChoice ? 'bg-purple-500/20 border-2 border-purple-400' : 'bg-[#2d3238]'
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

                                <button
                                    onClick={nextQuestion}
                                    className="w-full bg-teal-500 hover:bg-teal-600 text-white px-6 py-4 rounded-lg font-bold text-lg transition-all"
                                >
                                    Próxima Situação →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
