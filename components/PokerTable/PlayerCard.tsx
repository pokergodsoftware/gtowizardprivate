import React from 'react';
import { getTrainerAssetUrl } from '../../src/config';
import { formatBounty, formatStack } from '../../utils/pokerTableCalculations';

interface VillainAction {
    position: number;
    action: string;
    amount?: number;
    combo?: string;
}

export interface PlayerBadge {
    type: 'RAISE' | 'SHOVE' | 'CALL' | 'FOLD' | 'CHECK' | 'ALLIN';
    color: string;
}

interface PlayerCardProps {
    index: number;
    position: string;
    stack: number;
    bounty: number;
    isCurrentPlayer: boolean;
    isBB: boolean;
    isSB: boolean;
    isBTN: boolean;
    isRaiser: boolean;
    isShover: boolean;
    isMultiwayShover: boolean;
    isAutoAllin: boolean;
    hasFolded: boolean;
    villainAction?: VillainAction;
    bigBlind: number;
    smallBlind: number;
    ante: number;
    displayMode: 'bb' | 'chips';
    showBountyInDollars: boolean;
    solutionFileName?: string;
    onToggleDisplayMode?: () => void;
}

// Sub-component: Bounty Badge
interface BountyBadgeProps {
    bounty: number;
    showBountyInDollars: boolean;
    solutionFileName?: string;
}

const BountyBadge: React.FC<BountyBadgeProps> = React.memo(({ bounty, showBountyInDollars, solutionFileName }) => (
    <div className="mb-0.5 bg-gradient-to-r from-yellow-500 to-yellow-600 px-2 py-0.5 rounded-full border border-yellow-400 shadow-md">
        <span className="text-white font-bold text-[10px]">
            {formatBounty(bounty, showBountyInDollars, solutionFileName)}
        </span>
    </div>
));

BountyBadge.displayName = 'BountyBadge';

// Sub-component: Player Avatar
interface PlayerAvatarProps {
    index: number;
    position: string;
    isFolded: boolean;
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = React.memo(({ index, position, isFolded }) => {
    const avatarNumber = (index % 8) + 1;
    
    if (isFolded) {
        return (
            <div className="relative z-0 -mb-5">
                <img 
                    src={getTrainerAssetUrl(`avatar${avatarNumber}.png`)}
                    alt={position}
                    className="w-20 h-20 rounded-full"
                />
            </div>
        );
    }
    
    return (
        <div className="relative z-0 -mb-3">
            <img 
                src={getTrainerAssetUrl('cards.png')}
                alt="cards"
                className="w-16"
            />
        </div>
    );
});

PlayerAvatar.displayName = 'PlayerAvatar';

// Sub-component: Player Info Card
interface PlayerInfoProps {
    position: string;
    stack: string;
    isBTN: boolean;
    onToggleDisplayMode?: () => void;
}

const PlayerInfo: React.FC<PlayerInfoProps> = React.memo(({ position, stack, isBTN, onToggleDisplayMode }) => (
    <div className="relative z-10 rounded-xl overflow-hidden ring-1 ring-gray-600 min-w-[60px]">
        {/* Button (D) symbol - positioned beside card */}
        {isBTN && (
            <div className="absolute -left-6 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full bg-white border border-gray-700 shadow-md flex items-center justify-center z-10">
                <span className="text-gray-900 font-black text-[9px]">D</span>
            </div>
        )}
        
        {/* Card hero style - position and stack */}
        <div className="bg-black/90 backdrop-blur-sm rounded-b-lg px-2.5 py-1 border border-gray-600">
            <div className="text-center">
                <div className="text-white font-bold text-[10px] mb-0.5">{position}</div>
                <button
                    onClick={onToggleDisplayMode}
                    className="text-blue-400 font-bold text-xs cursor-pointer hover:text-blue-300 transition-colors"
                >
                    {stack}
                </button>
            </div>
        </div>
    </div>
));

PlayerInfo.displayName = 'PlayerInfo';

// Sub-component: Player Badges
interface PlayerBadgesProps {
    badges: PlayerBadge[];
}

const PlayerBadges: React.FC<PlayerBadgesProps> = React.memo(({ badges }) => {
    if (badges.length === 0) return null;
    
    return (
        <div className="absolute top-10 right-0 z-30">
            {badges.map((badge, idx) => (
                <div 
                    key={idx}
                    className={`${badge.color} backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-[8px] font-bold`}
                >
                    {badge.type}
                </div>
            ))}
        </div>
    );
});

PlayerBadges.displayName = 'PlayerBadges';

// Helper function to determine player classes
const getPlayerCardClasses = (shouldShowTransparent: boolean): string => {
    return `relative flex flex-col items-center transition-opacity duration-300 ${
        shouldShowTransparent ? 'opacity-80' : 'opacity-100'
    }`;
};

// Helper function to generate badges based on player state
const generatePlayerBadges = (
    isRaiser: boolean,
    isShover: boolean,
    isMultiwayShover: boolean,
    isAutoAllin: boolean,
    hasFolded: boolean,
    villainAction?: VillainAction
): PlayerBadge[] => {
    const badges: PlayerBadge[] = [];
    
    // RAISE badge for raiser
    if (isRaiser) {
        badges.push({ type: 'RAISE', color: 'bg-orange-500/90' });
    }
    
    // SHOVE badge for shovers (single or multiway)
    if (isShover || isMultiwayShover) {
        badges.push({ type: 'SHOVE', color: 'bg-purple-500/90' });
    }
    
    // CALL badge for players with negative/zero stack (auto all-in)
    if (isAutoAllin) {
        badges.push({ type: 'CALL', color: 'bg-green-500/90' });
    }
    
    // FOLD badge for players who folded
    if (hasFolded && !isRaiser && !isShover && !isMultiwayShover && !isAutoAllin && !villainAction) {
        badges.push({ type: 'FOLD', color: 'bg-red-500/80' });
    }
    
    // Badges for "Any" type - shows villain action
    if (villainAction) {
        const action = villainAction.action;
        
        if (action === 'Fold') {
            badges.push({ type: 'FOLD', color: 'bg-red-500/80' });
        } else if (action === 'Call') {
            badges.push({ type: 'CALL', color: 'bg-green-500/90' });
        } else if (action === 'Check') {
            badges.push({ type: 'CHECK', color: 'bg-gray-500/90' });
        } else if (action === 'Allin') {
            badges.push({ type: 'ALLIN', color: 'bg-purple-500/90' });
        } else if (action.startsWith('Raise')) {
            badges.push({ type: 'RAISE', color: 'bg-orange-500/90' });
        }
    }
    
    return badges;
};


/**
 * Component to display individual player card with position, stack, bounty, and badges
 * 
 * Refactored into modular sub-components:
 * - BountyBadge: Displays player bounty
 * - PlayerAvatar: Shows avatar (folded) or cards (active)
 * - PlayerInfo: Position, stack, and dealer button
 * - PlayerBadges: Action badges (RAISE, FOLD, CALL, etc.)
 */
export const PlayerCard: React.FC<PlayerCardProps> = React.memo(({
    index,
    position,
    stack,
    bounty,
    isCurrentPlayer,
    isBB,
    isSB,
    isBTN,
    isRaiser,
    isShover,
    isMultiwayShover,
    isAutoAllin,
    hasFolded,
    villainAction,
    bigBlind,
    smallBlind,
    ante,
    displayMode,
    showBountyInDollars,
    solutionFileName,
    onToggleDisplayMode
}) => {
    // Don't show card for hero (current player)
    if (isCurrentPlayer) return null;

    const hasVillainFolded = villainAction && villainAction.action === 'Fold';
    const hasVillainAction = villainAction && villainAction.action !== 'Fold';
    const shouldShowTransparent = (hasFolded || hasVillainFolded) && 
        !isRaiser && !isShover && !isMultiwayShover && !isAutoAllin && 
        !hasVillainAction && !isSB && !isBB;

    // Player has folded if: hasFolded AND not raiser/shover/autoallin AND (no villainAction OR villainAction is Fold)
    const playerHasFolded = hasFolded && !isRaiser && !isShover && 
        !isMultiwayShover && !isAutoAllin && 
        (!villainAction || villainAction.action === 'Fold');

    // Generate badges based on player state
    const badges = generatePlayerBadges(
        isRaiser,
        isShover,
        isMultiwayShover,
        isAutoAllin,
        hasFolded,
        villainAction
    );

    // Format stack display
    const formattedStack = (isShover || isMultiwayShover || isAutoAllin)
        ? (displayMode === 'bb' ? '0bb' : '0')
        : formatStack(
            stack,
            bigBlind,
            displayMode,
            ante,
            isBB,
            isSB,
            smallBlind,
            villainAction?.amount || 0
        );

    return (
        <div className={getPlayerCardClasses(shouldShowTransparent)}>
            {/* Action badges */}
            <PlayerBadges badges={badges} />
            
            {/* Bounty display */}
            {bounty > 0 && (
                <BountyBadge 
                    bounty={bounty}
                    showBountyInDollars={showBountyInDollars}
                    solutionFileName={solutionFileName}
                />
            )}
            
            {/* Avatar or cards */}
            <PlayerAvatar 
                index={index}
                position={position}
                isFolded={playerHasFolded}
            />

            {/* Main info card */}
            <PlayerInfo 
                position={position}
                stack={formattedStack}
                isBTN={isBTN}
                onToggleDisplayMode={onToggleDisplayMode}
            />
        </div>
    );
});

PlayerCard.displayName = 'PlayerCard';
