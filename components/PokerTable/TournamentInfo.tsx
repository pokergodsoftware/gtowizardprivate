import React from 'react';

interface TournamentInfoProps {
    tournamentName: string;
    tournamentPhase?: string;
}

/**
 * Component to display tournament information badges
 */
export const TournamentInfo: React.FC<TournamentInfoProps> = ({
    tournamentName,
    tournamentPhase
}) => {
    return (
        <>
            {/* Tournament Name - Top LEFT corner of table */}
            {tournamentName && (
                <div className="absolute top-3 left-3 z-40 bg-[#23272f] border-2 border-yellow-400 rounded-lg px-4 py-2 shadow-lg">
                    <div className="text-yellow-400 font-bold text-[15px] whitespace-nowrap">
                        {tournamentName}
                    </div>
                </div>
            )}
            
            {/* Stage - Top RIGHT corner of table */}
            {tournamentPhase && (
                <div className="absolute top-3 right-3 z-40 bg-[#23272f] border-2 border-teal-400 rounded-lg px-4 py-2 shadow-lg">
                    <div className="text-teal-400 font-bold text-[15px] whitespace-nowrap">
                        Stage: {tournamentPhase}
                    </div>
                </div>
            )}
        </>
    );
};
