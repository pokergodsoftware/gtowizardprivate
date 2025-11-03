import React from 'react';

interface ChipStackProps {
    amount: number;
    bigBlind: number;
    displayMode: 'bb' | 'chips';
    isRaiser?: boolean;
    isShover?: boolean;
    isMultiwayShover?: boolean;
    isAutoAllin?: boolean;
    isSB?: boolean;
    isBB?: boolean;
    hasFolded?: boolean;
    hasVillainFolded?: boolean;
    hasVillainAction?: boolean;
}

/**
 * Component to display betting chips with visual stack
 */
export const ChipStack: React.FC<ChipStackProps> = ({
    amount,
    bigBlind,
    displayMode,
    isRaiser = false,
    isShover = false,
    isMultiwayShover = false,
    isAutoAllin = false,
    isSB = false,
    isBB = false,
    hasFolded = false,
    hasVillainFolded = false,
    hasVillainAction = false
}) => {
    if (amount <= 0) return null;

    // SB and BB ALWAYS have visible chips (opacity 100%)
    // Raiser, shovers, auto all-ins, SB, BB and villains with actions don't have transparency
    // Except if the action is Fold
    const shouldShowTransparent = (hasFolded || hasVillainFolded) && 
        !isRaiser && !isShover && !isMultiwayShover && !isAutoAllin && 
        !hasVillainAction && !isSB && !isBB;

    return (
        <div className={`flex flex-col items-center gap-1 transition-opacity duration-300 ${
            shouldShowTransparent ? 'opacity-40' : 'opacity-100'
        }`}>
            {/* Stacked chips */}
            <div className="flex items-center gap-0.5">
                {/* Purple chip */}
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 border border-purple-300 shadow-md flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                </div>
                
                {/* Yellow chip (if bet >= BB) */}
                {amount >= bigBlind && (
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border border-yellow-300 shadow-md flex items-center justify-center -ml-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                    </div>
                )}
                
                {/* Extra chips for raise (2BB) - more yellow stacked */}
                {isRaiser && (
                    <>
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border border-yellow-300 shadow-md flex items-center justify-center -ml-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                        </div>
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border border-orange-300 shadow-md flex items-center justify-center -ml-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                        </div>
                    </>
                )}
                
                {/* Extra chips for shove (all-in) - stack with varied colors */}
                {(isShover || isMultiwayShover) && (
                    <>
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border border-yellow-300 shadow-md flex items-center justify-center -ml-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                        </div>
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-red-400 to-red-600 border border-red-300 shadow-md flex items-center justify-center -ml-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                        </div>
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border border-purple-300 shadow-md flex items-center justify-center -ml-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                        </div>
                    </>
                )}
            </div>
            
            {/* Bet amount */}
            <div className={`bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded border ${
                isRaiser ? 'border-orange-500/70' : 
                (isShover || isMultiwayShover) ? 'border-purple-500/70' : 
                isAutoAllin ? 'border-green-500/70' : 
                'border-yellow-500/50'
            }`}>
                <span className={`font-bold text-[10px] whitespace-nowrap ${
                    isRaiser ? 'text-orange-400' : 
                    (isShover || isMultiwayShover) ? 'text-purple-400' : 
                    isAutoAllin ? 'text-green-400' : 
                    'text-yellow-400'
                }`}>
                    {displayMode === 'bb' 
                        ? isBB && amount === bigBlind
                            ? '1 BB'  // BB shows "1 BB" without decimals
                            : `${(amount / bigBlind).toFixed(1)} BB`
                        : (amount / 100).toLocaleString()
                    }
                </span>
            </div>
        </div>
    );
};
