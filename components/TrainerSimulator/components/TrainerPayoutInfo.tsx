import React from 'react';

interface Prize {
    [position: string]: number;
}

interface TrainerPayoutInfoProps {
    prizes?: Prize;
    solutionFileName: string;
}

/**
 * Helper function to determine initial bounty based on solution filename
 */
const getInitialBountyValue = (fileName: string): number => {
    const lowerName = fileName.toLowerCase();
    
    if (lowerName.includes('speed20')) return 5;
    if (lowerName.includes('speed30')) return 7.5;
    if (lowerName.includes('speed50')) return 12.5;
    if (lowerName.includes('speed108')) return 25;
    
    // Default fallback
    return 7.5;
};

/**
 * TrainerPayoutInfo - Fixed (non-draggable) component for payouts and tournament info
 * 
 * Displays:
 * - Payouts structure (prize distribution)
 * - Starting stack: 10,000
 * - Initial bounty based on tournament speed
 * 
 * Used in TrainerTable below Settings panel
 */
export const TrainerPayoutInfo: React.FC<TrainerPayoutInfoProps> = ({ prizes, solutionFileName }) => {
    const initialBounty = getInitialBountyValue(solutionFileName);
    
    return (
        <div className="bg-[#2d3238] rounded-lg p-3 space-y-2">
            {/* Payouts Section */}
            <div>
                <h4 className="text-white font-bold text-xs mb-2 flex items-center gap-1">
                    💰 Payouts
                </h4>
                
                <div className="space-y-1 max-h-[120px] overflow-y-auto">
                    {prizes && Object.keys(prizes).length > 0 ? (
                        Object.entries(prizes)
                            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                            .map(([position, prize], index) => (
                                <div 
                                    key={position}
                                    className="flex items-center justify-between bg-[#23272f] px-2 py-1 rounded"
                                >
                                    <span className="text-gray-300 font-semibold text-[10px]">
                                        {index === 0 ? '1º-2º' : `${position}º`}
                                    </span>
                                    <span className="text-green-400 font-bold text-[10px]">
                                        ${(prize as number).toFixed(2)}
                                    </span>
                                </div>
                            ))
                    ) : (
                        <div className="text-gray-400 text-[10px] text-center py-1 bg-[#23272f] rounded">
                            Payouts N/A
                        </div>
                    )}
                </div>
            </div>
            
            {/* Tournament Info Section */}
            <div className="border-t border-gray-700 pt-2 space-y-1.5">
                <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-[10px]">Starting stack:</span>
                    <span className="text-white font-semibold text-[10px]">10,000</span>
                </div>
                
                <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-[10px]">Initial bounty:</span>
                    <span className="text-yellow-400 font-semibold text-[10px]">${initialBounty}</span>
                </div>
            </div>
        </div>
    );
};
