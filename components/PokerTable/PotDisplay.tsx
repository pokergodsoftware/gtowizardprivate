import React from 'react';

interface PotDisplayProps {
    totalPot: number;
    bigBlind: number;
    displayMode: 'bb' | 'chips';
}

/**
 * Component to display the pot in the center of the table
 */
export const PotDisplay: React.FC<PotDisplayProps> = ({
    totalPot,
    bigBlind,
    displayMode
}) => {
    if (totalPot <= 0) return null;

    return (
        <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="flex flex-col items-center gap-0.5">
                {/* Stacked chips in center */}
                <div className="flex items-center justify-center gap-0.5">
                    {/* Purple chip */}
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 border border-purple-300 shadow-md flex items-center justify-center">
                        <div className="w-0.5 h-0.5 rounded-full bg-white/40" />
                    </div>
                    {/* Yellow chip */}
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border border-yellow-200 shadow-md flex items-center justify-center -ml-1">
                        <div className="w-0.5 h-0.5 rounded-full bg-white/40" />
                    </div>
                    {/* Green chip */}
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-green-500 to-green-700 border border-green-300 shadow-md flex items-center justify-center -ml-1">
                        <div className="w-0.5 h-0.5 rounded-full bg-white/40" />
                    </div>
                </div>
                
                {/* Pot value */}
                <div className="bg-black/90 backdrop-blur-sm border border-yellow-500 rounded px-3 py-1 shadow-md">
                    <div className="text-center">
                        <div className="text-yellow-400 font-bold text-xs">
                            Total Pot : {displayMode === 'bb' 
                                ? `${(totalPot / bigBlind).toFixed(1)} BB`
                                : (totalPot / 100).toLocaleString()
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
