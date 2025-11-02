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
}

interface SpotHistoryProps {
    history: SpotHistoryEntry[];
}

export const SpotHistory: React.FC<SpotHistoryProps> = ({ history }) => {
    if (history.length === 0) {
        return null;
    }

    // Mostrar apenas os últimos 30
    const recentHistory = history.slice(-30).reverse();

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4">
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Histórico ({recentHistory.length}/30)
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {recentHistory.map((entry, index) => {
                    const [rank, suit] = entry.hand.split('');
                    const suitSymbols: Record<string, string> = {
                        's': '♠',
                        'h': '♥',
                        'd': '♦',
                        'c': '♣'
                    };
                    
                    const suitColors: Record<string, string> = {
                        's': 'text-gray-400',
                        'h': 'text-red-500',
                        'd': 'text-blue-500',
                        'c': 'text-green-500'
                    };

                    return (
                        <div 
                            key={entry.id}
                            className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${
                                entry.isCorrect 
                                    ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20' 
                                    : 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
                            }`}
                        >
                            {/* Ícone de Acerto/Erro */}
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                entry.isCorrect ? 'bg-green-500' : 'bg-red-500'
                            }`}>
                                {entry.isCorrect ? (
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                            </div>

                            {/* Mão - Mostra combo se disponível */}
                            <div className="flex flex-col min-w-[80px]">
                                <div className="flex items-center gap-1">
                                    <span className="text-white font-bold text-lg">{rank}</span>
                                    <span className={`font-bold text-lg ${suitColors[suit]}`}>
                                        {suitSymbols[suit]}
                                    </span>
                                </div>
                                {entry.combo && (
                                    <span className="text-gray-400 text-[10px] font-mono">
                                        {entry.combo}
                                    </span>
                                )}
                            </div>

                            {/* Pontos */}
                            <div className="flex-shrink-0 min-w-[50px]">
                                <span className={`text-xs font-bold ${
                                    entry.isCorrect ? 'text-green-400' : 'text-gray-500'
                                }`}>
                                    {entry.isCorrect ? `+${entry.points}` : '0'}
                                </span>
                            </div>

                            {/* Botão Study */}
                            <div className="flex-1 flex items-center justify-end gap-2">
                                {entry.solutionPath && entry.nodeId !== undefined ? (
                                    <button 
                                        onClick={() => {
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
                                        }}
                                        className="px-3 py-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded text-xs font-bold transition-all flex items-center gap-1"
                                        title="Estudar este spot"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                        Study
                                    </button>
                                ) : (
                                    <span className="text-gray-500 text-xs">N/A</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
