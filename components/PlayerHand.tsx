import React from 'react';

interface PlayerHandProps {
    hand: string; // Ex: "AhKd", "QsQc"
}

export const PlayerHand: React.FC<PlayerHandProps> = ({ hand }) => {
    if (!hand || hand.length < 4) return null;

    // Parse a mão (ex: "AhKd" -> ["Ah", "Kd"])
    const card1 = hand.substring(0, 2);
    const card2 = hand.substring(2, 4);

    const renderCard = (card: string, isFirst: boolean) => {
        const rank = card[0];
        const suit = card[1];

        const suitSymbols: Record<string, string> = {
            's': '♠',
            'h': '♥',
            'd': '♦',
            'c': '♣'
        };

        // Background colors para sistema de 4 cores - mais vibrante estilo GGPoker
        const cardBgColors: Record<string, string> = {
            's': 'from-gray-600 to-gray-800',        // Cinza para espadas
            'h': 'from-red-500 to-red-700',          // Vermelho para copas
            'd': 'from-blue-500 to-blue-700',        // Azul para ouros
            'c': 'from-green-500 to-green-700'       // Verde para paus
        };

        return (
            <div 
                className={`relative bg-gradient-to-br ${cardBgColors[suit]} rounded-lg shadow-2xl border-2 border-black/40 w-16 h-24 flex flex-col items-center justify-start pt-1 ${
                    isFirst ? 'z-10' : '-ml-2 z-0'
                }`}
                style={{
                    boxShadow: '0 8px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                    // Inclinação estilo GGPoker: primeira carta -8°, segunda carta +8°
                    transform: isFirst ? 'rotate(-8deg)' : 'rotate(8deg)',
                    transformOrigin: 'center center'
                }}
            >
                {/* Rank grande no topo - estilo GGPoker */}
                <div className="text-4xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-none">
                    {rank}
                </div>
                
                {/* Naipe BEM MAIOR embaixo do rank */}
                <div className="text-4xl text-white/95 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-none">
                    {suitSymbols[suit]}
                </div>

                {/* Brilho superior para efeito 3D */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/10 rounded-lg pointer-events-none" />
                
                {/* Borda interna sutil */}
                <div className="absolute inset-[3px] border border-white/10 rounded-md pointer-events-none" />
            </div>
        );
    };

    return (
        <div className="flex items-center justify-center">
            {renderCard(card1, true)}
            {renderCard(card2, false)}
        </div>
    );
};
