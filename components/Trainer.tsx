import React, { useState, useEffect } from 'react';
import type { AppData } from '../types.ts';
import { TrainerSimulator } from './TrainerSimulator.tsx';
import { TournamentMode } from './TournamentMode.tsx';
import { AuthPage } from './AuthPage.tsx';
import { UserProfile } from './UserProfile.tsx';
import { Leaderboard } from './Leaderboard.tsx';

interface TrainerProps {
    solutions: AppData[];
    onBack: () => void;
    loadNode: (nodeId: number) => Promise<void>;
    loadMultipleNodes: (nodeIds: number[]) => Promise<void>;
    loadNodesForSolution: (solutionId: string) => Promise<void>;
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

const spotTypes = [
    'Any',
    'RFI',
    'vs Open',
    'vs Shove',
    'vs Multiway shove'
];

type ViewMode = 'modeSelection' | 'config' | 'training' | 'tournament' | 'profile' | 'leaderboard' | 'practicedHands' | 'markedHands';

export const Trainer: React.FC<TrainerProps> = ({ solutions, onBack, loadNode, loadNodesForSolution }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<{ userId: string; username: string } | null>(null);
    const [selectedPhases, setSelectedPhases] = useState<string[]>([]);
    const [selectedSpotTypes, setSelectedSpotTypes] = useState<string[]>(['Any']); // Any por padrão
    const [viewMode, setViewMode] = useState<ViewMode>('modeSelection');

    // Verificar se o usuário já está logado
    useEffect(() => {
        const storedUser = localStorage.getItem('poker_current_user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                setCurrentUser(user);
                setIsAuthenticated(true);
            } catch (err) {
                console.error('Erro ao carregar usuário:', err);
                localStorage.removeItem('poker_current_user');
            }
        }
    }, []);

    // Callback de autenticação bem-sucedida
    const handleAuthSuccess = (userId: string, username: string) => {
        setCurrentUser({ userId, username });
        setIsAuthenticated(true);
    };

    // Logout
    const handleLogout = () => {
        localStorage.removeItem('poker_current_user');
        setCurrentUser(null);
        setIsAuthenticated(false);
        setViewMode('modeSelection');
    };

    // Se não estiver autenticado, mostrar página de login
    if (!isAuthenticated) {
        return <AuthPage onAuthSuccess={handleAuthSuccess} />;
    }

    // Tela de seleção de modo (primeira tela após login)
    if (viewMode === 'modeSelection') {
        return (
            <div className="flex flex-col h-screen bg-[#1a1d23]">
                {/* Header */}
                <div className="bg-[#23272f] border-b border-gray-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span className="font-semibold">Voltar</span>
                        </button>
                        <h1 className="text-2xl font-bold text-white">Trainer</h1>
                        {/* Informações do usuário */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setViewMode('practicedHands')}
                                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                                <span className="text-white font-semibold text-sm">Practiced Hands</span>
                            </button>
                            <button
                                onClick={() => setViewMode('markedHands')}
                                className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                                <span className="text-white font-semibold text-sm">⭐ Marked Hands</span>
                            </button>
                            <button
                                onClick={() => setViewMode('profile')}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="text-white font-semibold text-sm">My Stats</span>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-semibold"
                                title="Sair"
                            >
                                Sair
                            </button>
                        </div>
                    </div>
                </div>

                {/* Conteúdo - 3 Botões Grandes */}
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
                        {/* Botão 1: Jogar fases do torneio */}
                        <button
                            onClick={() => setViewMode('config')}
                            className="group relative bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 rounded-2xl p-12 transition-all duration-300 transform hover:scale-105 shadow-2xl border-4 border-purple-400/30 hover:border-purple-400/60"
                        >
                            <div className="flex flex-col items-center justify-center space-y-6">
                                <div className="text-7xl">🎯</div>
                                <h2 className="text-3xl font-black text-white text-center leading-tight">
                                    Jogar fases<br />do torneio
                                </h2>
                                <p className="text-purple-200 text-center text-sm">
                                    Escolha fases específicas e tipos de spots para treinar
                                </p>
                            </div>
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 rounded-2xl transition-all duration-300"></div>
                        </button>

                        {/* Botão 2: Jogar modo torneio */}
                        <button
                            onClick={() => setViewMode('tournament')}
                            className="group relative bg-gradient-to-br from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800 rounded-2xl p-12 transition-all duration-300 transform hover:scale-105 shadow-2xl border-4 border-orange-400/30 hover:border-orange-400/60"
                        >
                            <div className="flex flex-col items-center justify-center space-y-6">
                                <div className="text-7xl">🏆</div>
                                <h2 className="text-3xl font-black text-white text-center leading-tight">
                                    Jogar modo<br />torneio
                                </h2>
                                <p className="text-orange-200 text-center text-sm">
                                    Simule um torneio completo do início ao fim
                                </p>
                            </div>
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 rounded-2xl transition-all duration-300"></div>
                        </button>

                        {/* Botão 3: Ranking */}
                        <button
                            onClick={() => setViewMode('leaderboard')}
                            className="group relative bg-gradient-to-br from-yellow-500 to-yellow-700 hover:from-yellow-600 hover:to-yellow-800 rounded-2xl p-12 transition-all duration-300 transform hover:scale-105 shadow-2xl border-4 border-yellow-400/30 hover:border-yellow-400/60"
                        >
                            <div className="flex flex-col items-center justify-center space-y-6">
                                <div className="text-7xl">📊</div>
                                <h2 className="text-3xl font-black text-white text-center leading-tight">
                                    Ranking
                                </h2>
                                <p className="text-yellow-200 text-center text-sm">
                                    Veja os melhores jogadores e suas estatísticas
                                </p>
                            </div>
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 rounded-2xl transition-all duration-300"></div>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Renderizar views baseado no modo
    if (viewMode === 'profile' && currentUser) {
        return (
            <UserProfile
                userId={currentUser.userId}
                username={currentUser.username}
                onBack={() => setViewMode('modeSelection')}
            />
        );
    }

    if (viewMode === 'practicedHands' && currentUser) {
        return (
            <UserProfile
                userId={currentUser.userId}
                username={currentUser.username}
                onBack={() => setViewMode('modeSelection')}
                showHistoryOnly={true}
            />
        );
    }

    if (viewMode === 'markedHands' && currentUser) {
        return (
            <UserProfile
                userId={currentUser.userId}
                username={currentUser.username}
                onBack={() => setViewMode('modeSelection')}
                showMarkedHandsOnly={true}
            />
        );
    }

    if (viewMode === 'leaderboard' && currentUser) {
        return (
            <Leaderboard
                currentUserId={currentUser.userId}
                onBack={() => setViewMode('modeSelection')}
            />
        );
    }

    if (viewMode === 'training') {
        return (
            <TrainerSimulator
                solutions={solutions}
                selectedPhases={selectedPhases}
                selectedSpotTypes={selectedSpotTypes}
                onBack={() => setViewMode('config')}
                loadNode={loadNode}
                loadNodesForSolution={loadNodesForSolution}
                userId={currentUser?.userId || ''}
                tournamentPhase={selectedPhases[0] || ''}
            />
        );
    }

    if (viewMode === 'tournament') {
        return (
            <TournamentMode
                solutions={solutions}
                onBack={() => setViewMode('modeSelection')}
                loadNode={loadNode}
                loadNodesForSolution={loadNodesForSolution}
                userId={currentUser?.userId || ''}
            />
        );
    }
    
    // Toggle de seleção de fase
    const togglePhase = (phase: string) => {
        setSelectedPhases(prev => {
            if (prev.includes(phase)) {
                return prev.filter(p => p !== phase);
            } else {
                return [...prev, phase];
            }
        });
    };
    
    // Toggle de seleção de tipo de spot
    const toggleSpotType = (spotType: string) => {
        setSelectedSpotTypes(prev => {
            // Se clicar em "Any", seleciona apenas Any
            if (spotType === 'Any') {
                return ['Any'];
            }
            
            // Se já tem Any e clica em outro, remove Any e adiciona o novo
            if (prev.includes('Any') && spotType !== 'Any') {
                return [spotType];
            }
            
            // Se clica em um tipo que já está selecionado
            if (prev.includes(spotType)) {
                const newSelection = prev.filter(t => t !== spotType);
                // Se ficaria vazio, mantém Any
                return newSelection.length === 0 ? ['Any'] : newSelection;
            }
            
            // Adiciona o novo tipo
            return [...prev, spotType];
        });
    };
    
    // Selecionar/Desselecionar todas as fases
    const toggleAllPhases = () => {
        const availablePhases = tournamentPhases.filter(phase => 
            solutions.filter(s => s.tournamentPhase === phase).length > 0
        );
        
        if (selectedPhases.length === availablePhases.length) {
            setSelectedPhases([]);
        } else {
            setSelectedPhases(availablePhases);
        }
    };

    // Tela de seleção de fase (config)
    if (viewMode === 'config') {
        return (
            <div className="flex flex-col h-screen bg-[#1a1d23]">
                {/* Header */}
                <div className="bg-[#23272f] border-b border-gray-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setViewMode('modeSelection')}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span className="font-semibold">Voltar</span>
                        </button>
                        <h1 className="text-2xl font-bold text-white">Trainer - Configuração</h1>
                        {/* Informações do usuário e logout */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setViewMode('practicedHands')}
                                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                                <span className="text-white font-semibold text-sm">Practiced Hands</span>
                            </button>
                            <button
                                onClick={() => setViewMode('markedHands')}
                                className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                                <span className="text-white font-semibold text-sm">⭐ Marked Hands</span>
                            </button>
                            <button
                                onClick={() => setViewMode('profile')}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="text-white font-semibold text-sm">My Stats</span>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-semibold"
                                title="Sair"
                            >
                                Sair
                            </button>
                        </div>
                    </div>
                    {selectedPhases.length > 0 && (
                        <div className="flex items-center justify-end gap-3 mt-4">
                            <button
                                onClick={() => setViewMode('training')}
                                className="px-6 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-lg font-bold transition-all shadow-lg"
                            >
                                Iniciar Treino ({selectedPhases.length} {selectedPhases.length === 1 ? 'fase' : 'fases'})
                            </button>
                        </div>
                    )}
                </div>

                {/* Seleção de fase e tipos de spot */}
                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-5xl mx-auto space-y-8">
                        {/* Tipos de Spot */}
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">Tipos de Spot</h2>
                            <div className="flex flex-wrap gap-3">
                                {spotTypes.map(spotType => {
                                    const isSelected = selectedSpotTypes.includes(spotType);
                                    const isDisabled = spotType !== 'Any' && spotType !== 'RFI' && spotType !== 'vs Open' && spotType !== 'vs Shove' && spotType !== 'vs Multiway shove';
                                    
                                    return (
                                        <button
                                            key={spotType}
                                            onClick={() => !isDisabled && toggleSpotType(spotType)}
                                            disabled={isDisabled}
                                            className={`px-6 py-3 rounded-lg font-bold text-sm transition-all duration-300 border-2 ${
                                                isSelected
                                                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 border-orange-400 text-white shadow-lg shadow-orange-500/50'
                                                    : isDisabled
                                                        ? 'bg-gray-800 border-gray-700 text-gray-600 cursor-not-allowed'
                                                        : 'bg-[#2d3238] border-gray-600 text-white hover:border-orange-400 hover:bg-[#353a42]'
                                            }`}
                                        >
                                            {isSelected && '✓ '}
                                            {spotType}
                                            {isDisabled && ' (Em breve)'}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-gray-400 text-sm mt-2">
                                ℹ️ Selecione o tipo de spot para treinar (pelo menos 1 deve estar selecionado). "vs Open" requer soluções com avg stack ≥ 13.2bb.
                            </p>
                        </div>

                        {/* Fases do Torneio */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-white">Fases do Torneio</h2>
                                <button
                                    onClick={toggleAllPhases}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-semibold"
                                >
                                    {selectedPhases.length === tournamentPhases.filter(p => solutions.filter(s => s.tournamentPhase === p).length > 0).length
                                        ? '✓ Desmarcar Todas Fases'
                                        : '☐ Selecionar Todas Fases'
                                    }
                                </button>
                            </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tournamentPhases.map(phase => {
                                const phaseSolutions = solutions.filter(s => s.tournamentPhase === phase);
                                if (phaseSolutions.length === 0) return null;

                                const isSelected = selectedPhases.includes(phase);
                                
                                return (
                                    <button
                                        key={phase}
                                        onClick={() => togglePhase(phase)}
                                        className={`group relative bg-gradient-to-br rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 border-2 shadow-lg ${
                                            isSelected 
                                                ? 'from-purple-600/40 to-purple-800/40 border-purple-400 shadow-purple-500/50'
                                                : 'from-[#2d3238] to-[#23272f] hover:from-[#353a42] hover:to-[#2d3238] border-transparent hover:border-purple-400'
                                        }`}
                                    >
                                        {/* Checkbox no canto superior direito */}
                                        <div className="absolute top-4 right-4">
                                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                                                isSelected 
                                                    ? 'bg-purple-500 border-purple-400'
                                                    : 'bg-gray-700 border-gray-500 group-hover:border-purple-400'
                                            }`}>
                                                {isSelected && (
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div className="flex justify-center">
                                                <div className={`p-4 rounded-full transition-colors duration-300 ${
                                                    isSelected 
                                                        ? 'bg-purple-500/40'
                                                        : 'bg-purple-500/20 group-hover:bg-purple-500/30'
                                                }`}>
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

                                            <div className={`pt-2 font-semibold text-sm text-center transition-all duration-300 ${
                                                isSelected 
                                                    ? 'text-purple-300'
                                                    : 'text-purple-400 group-hover:translate-x-2'
                                            }`}>
                                                {isSelected ? '✓ Selecionado' : 'Clique para selecionar'}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Nunca deve chegar aqui, mas retorna null por segurança
    return null;
};
