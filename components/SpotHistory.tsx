import React from 'react';

export interface SpotHistoryEntry {
    id: string;
    hand: string;
    combo?: string; // Combo específico (ex: "AhKd")
    isCorrect: boolean;
    timestamp: number;
    phase: string;
    points: number;
    solutionPath?: string; // Caminho da solução para link
    nodeId?: number; // ID do node para link
    position?: number; // Posição do herói (0-8)
    playerAction?: string; // Ação do jogador (Fold, Call, Raise 2, etc)
    ev?: number; // Expected Value da ação escolhida
    isMarked?: boolean; // Se a mão está marcada
}

interface SpotHistoryProps {
    history: SpotHistoryEntry[];
    onToggleMark?: (entry: SpotHistoryEntry) => void; // Callback para marcar/desmarcar
    markedHandIds?: Set<string>; // Set de IDs de mãos marcadas
}

export const SpotHistory: React.FC<SpotHistoryProps> = ({ history, onToggleMark, markedHandIds }) => {
    if (history.length === 0) {
        return (
            <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-400 text-lg">Nenhum histórico ainda</p>
                <p className="text-gray-500 text-sm mt-2">Comece a praticar para ver suas mãos!</p>
            </div>
        );
    }

    // Mostrar últimos spots (ordenados do mais recente ao mais antigo)
    const recentHistory = history.slice(-50).reverse();

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    };

    const getPositionName = (position?: number): string => {
        if (position === undefined) return 'N/A';
        const positions = ['UTG', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
        return positions[position] || `P${position}`;
    };

    const parseCombo = (combo?: string) => {
        if (!combo || combo.length !== 4) return null;
        
        const card1Rank = combo[0];
        const card1Suit = combo[1];
        const card2Rank = combo[2];
        const card2Suit = combo[3];
        
        const suitSymbols: Record<string, string> = {
            's': '♠', 'h': '♥', 'd': '♦', 'c': '♣',
            'S': '♠', 'H': '♥', 'D': '♦', 'C': '♣'
        };
        
        const suitColors: Record<string, string> = {
            'd': '#3B82F6', // Ouros = Azul
            'D': '#3B82F6',
            'c': '#10B981', // Paus = Verde
            'C': '#10B981',
            's': '#4B5563', // Espadas = Cinza escuro
            'S': '#4B5563',
            'h': '#EF4444', // Copas = Vermelho
            'H': '#EF4444'
        };
        
        return {
            card1: { rank: card1Rank, suit: suitSymbols[card1Suit] || card1Suit, color: suitColors[card1Suit] || '#3B82F6' },
            card2: { rank: card2Rank, suit: suitSymbols[card2Suit] || card2Suit, color: suitColors[card2Suit] || '#3B82F6' }
        };
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Date</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Result</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Position</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Cards</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Action</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Score</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">EV</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Study</th>
                    </tr>
                </thead>
                <tbody>
                    {recentHistory.map((entry, index) => {
                        const cards = parseCombo(entry.combo);
                        const isMarked = markedHandIds?.has(entry.id) || false;
                        
                        return (
                            <tr 
                                key={entry.id}
                                className={`border-b border-gray-800 hover:bg-gray-700/50 transition-colors ${
                                    index % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-800/10'
                                }`}
                            >
                                {/* Date */}
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onToggleMark?.(entry)}
                                            className="p-2 hover:bg-gray-700/30 rounded transition-all cursor-pointer group"
                                            title={isMarked ? 'Remover dos marcados' : 'Marcar mão'}
                                        >
                                            {isMarked ? (
                                                <svg className="w-5 h-5 text-yellow-500 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-400 group-hover:scale-110 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                </svg>
                                            )}
                                        </button>
                                        <span className="text-white text-sm">{formatDate(entry.timestamp)}</span>
                                    </div>
                                </td>
                                
                                {/* Result */}
                                <td className="py-3 px-4">
                                    {entry.isCorrect ? (
                                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </td>
                                
                                {/* Position */}
                                <td className="py-3 px-4">
                                    <span className="text-white text-sm font-medium">
                                        {getPositionName(entry.position)}
                                    </span>
                                </td>
                                
                                {/* Cards */}
                                <td className="py-3 px-4">
                                    {cards ? (
                                        <div className="flex items-center gap-1">
                                            <div 
                                                className="rounded px-2 py-1 flex items-center gap-0.5 shadow-sm min-w-[32px] justify-center"
                                                style={{ backgroundColor: cards.card1.color }}
                                            >
                                                <span className="text-white font-bold text-base">{cards.card1.rank}</span>
                                            </div>
                                            <div 
                                                className="rounded px-2 py-1 flex items-center gap-0.5 shadow-sm min-w-[32px] justify-center"
                                                style={{ backgroundColor: cards.card2.color }}
                                            >
                                                <span className="text-white font-bold text-base">{cards.card2.rank}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-500 text-sm">{entry.hand}</span>
                                    )}
                                </td>
                                
                                {/* Action */}
                                <td className="py-3 px-4">
                                    <span className="text-white text-sm font-medium">
                                        {entry.playerAction || 'N/A'}
                                    </span>
                                </td>
                                
                                {/* Score */}
                                <td className="py-3 px-4">
                                    <span className={`text-sm font-bold ${entry.isCorrect ? 'text-green-400' : 'text-gray-400'}`}>
                                        {entry.isCorrect ? '+1' : '0'}
                                    </span>
                                </td>
                                
                                {/* EV */}
                                <td className="py-3 px-4">
                                    <span className={`text-sm font-semibold ${
                                        entry.ev === undefined ? 'text-gray-400' :
                                        entry.ev < 0 ? 'text-red-400' :
                                        entry.ev > 0 ? 'text-green-400' :
                                        'text-white'
                                    }`}>
                                        {entry.ev !== undefined ? entry.ev.toFixed(2) : 'N/A'}
                                    </span>
                                </td>
                                
                                {/* Study Button */}
                                <td className="py-3 px-4">
                                    <button 
                                        onClick={() => {
                                            if (entry.solutionPath && entry.nodeId !== undefined) {
                                                const baseUrl = window.location.origin + window.location.pathname;
                                                const params = new URLSearchParams();
                                                params.set('page', 'solutions');
                                                params.set('solution', entry.solutionPath);
                                                params.set('node', entry.nodeId.toString());
                                                if (entry.combo) {
                                                    params.set('hand', entry.combo);
                                                }
                                                
                                                const studyUrl = `${baseUrl}?${params.toString()}`;
                                                window.open(studyUrl, '_blank');
                                            }
                                        }}
                                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
                                        title="Study this spot"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                        Study
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
