import React from 'react';

interface PlayerHandProps {
    hand: string; // Ex: "AhKd", "QsQc"
}

export const PlayerHand: React.FC<PlayerHandProps> = ({ hand }) => {
    if (!hand || hand.length < 4) return null;

    // Parse a mão (ex: "AhKd" -> ["Ah", "Kd"])
    const card1 = hand.substring(0, 2);
    const card2 = hand.substring(2, 4);

    const renderCard = (card: string) => {
        const rank = card[0];
        const suit = card[1];

        const suitSymbols: Record<string, string> = {
            's': '♠',
            'h': '♥',
            'd': '♦',
            'c': '♣'
        };

        const suitColors: Record<string, string> = {
            's': 'text-gray-800',
            'h': 'text-red-600',
            'd': 'text-blue-600',
            'c': 'text-green-600'
        };

        return (
            <div className="relative bg-white rounded-lg shadow-2xl border-2 border-gray-300 w-24 h-32 flex flex-col items-center justify-between p-2">
                {/* Rank no topo */}
                <div className={`text-3xl font-bold ${suitColors[suit]}`}>
                    {rank}
                </div>
                
                {/* Naipe no centro */}
                <div className={`text-5xl ${suitColors[suit]}`}>
                    {suitSymbols[suit]}
                </div>
                
                {/* Rank invertido embaixo */}
                <div className={`text-3xl font-bold ${suitColors[suit]} transform rotate-180`}>
                    {rank}
                </div>
            </div>
        );
    };

    return (
        <div className="flex gap-3 items-center justify-center">
            {renderCard(card1)}
            {renderCard(card2)}
        </div>
    );
};
