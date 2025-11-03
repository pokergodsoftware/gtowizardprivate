import React from 'react';
import { useDraggable } from '../../hooks/useDraggable';

interface Prize {
    [position: string]: number;
}

interface PayoutPanelProps {
    prizes?: Prize;
}

export const PayoutPanel: React.FC<PayoutPanelProps> = ({ prizes }) => {
    const {
        position,
        isDragging,
        dragRef,
        handleMouseDown,
        handleResetPosition
    } = useDraggable({
        storageKey: 'trainer_payout_position',
        initialPosition: { x: 0, y: 0 }
    });

    return (
        <div 
            ref={dragRef}
            className={`absolute z-40 bg-[#23272f] border-2 rounded-lg p-3.5 min-w-[212px] max-w-[300px] transition-all ${
                isDragging 
                    ? 'border-yellow-400 cursor-grabbing shadow-2xl scale-105' 
                    : 'border-purple-400 cursor-grab shadow-xl hover:border-purple-300'
            }`}
            style={{
                left: position.x === 0 ? '8%' : `${position.x}px`,
                top: position.y === 0 ? '50%' : `${position.y}px`,
                transform: position.y === 0 ? 'translateY(-50%)' : 'none',
                userSelect: 'none'
            }}
            onMouseDown={handleMouseDown}
        >
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-bold text-sm flex items-center gap-1">
                    💰 Payouts
                    {isDragging && <span className="text-yellow-400 text-xs animate-pulse">movendo...</span>}
                </h3>
                <div className="flex items-center gap-2">
                    {(position.x !== 0 || position.y !== 0) && !isDragging ? (
                        <button
                            onClick={handleResetPosition}
                            className="text-gray-400 hover:text-yellow-400 text-base transition-colors font-bold"
                            title="Resetar posição"
                        >
                            ↺
                        </button>
                    ) : null}
                    <div className={`text-xs ${isDragging ? 'text-yellow-400' : 'text-gray-400'}`}>
                        {isDragging ? '✊' : '🖐️'}
                    </div>
                </div>
            </div>
            
            <div className="payout-content space-y-1.5 max-h-[225px] overflow-y-auto">
                {prizes ? (
                    Object.entries(prizes)
                        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                        .map(([position, prize], index) => (
                            <div 
                                key={position}
                                className="flex items-center justify-between bg-[#2d3238] px-2.5 py-1.5 rounded"
                            >
                                <span className="text-gray-300 font-semibold text-sm">
                                    {index === 0 ? '1º-2º' : `${position}º`}
                                </span>
                                <span className="text-green-400 font-bold text-sm">
                                    ${(prize as number).toFixed(2)}
                                </span>
                            </div>
                        ))
                ) : (
                    <div className="text-gray-400 text-sm text-center py-1.5">
                        Payouts N/A
                    </div>
                )}
            </div>
        </div>
    );
};
