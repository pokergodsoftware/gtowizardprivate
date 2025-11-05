import React, { useState, useMemo, useEffect } from 'react';
import type { AppData } from '../types.ts';
import { getPlayerPositions } from '../lib/pokerUtils.ts';

interface SolutionRowProps {
  solution: AppData;
  onSelect: (id: string) => void;
  positionsHeader: string[];
}

const SolutionRow: React.FC<SolutionRowProps> = ({ solution, onSelect, positionsHeader }) => {
    const { settings } = solution;
    const numPlayers = settings.handdata.stacks.length;
    
    const avgStack = settings.handdata.stacks.reduce((a, b) => a + b, 0) / numPlayers;
    const blinds = settings.handdata.blinds;
    const bigBlind = blinds.length > 1 ? Math.max(blinds[0], blinds[1]) : (blinds[0] || 1);
    const avgStackBB = (avgStack / bigBlind).toFixed(1);

    // Get positions for this specific solution to map its stacks correctly.
    const solutionPositions = getPlayerPositions(numPlayers);
    const stackMap = new Map<string, number>();
    solutionPositions.forEach((pos, index) => {
        stackMap.set(pos, settings.handdata.stacks[index]);
    });

    return (
        <tr 
            className="bg-[#2d3238] hover:bg-[#3c414b] cursor-pointer transition-colors duration-150"
            onClick={() => onSelect(solution.id)}
        >
            <td className="p-3 rounded-l-md text-center">{numPlayers}</td>
            <td className="p-3 text-center">{avgStackBB}bb</td>
            
            {positionsHeader.map((headerPos) => {
                const stack = stackMap.get(headerPos);
                const displayValue = (stack !== undefined && bigBlind > 0) 
                    ? (stack / bigBlind).toFixed(1) 
                    : '-';
                
                return (
                    <td key={headerPos} className="p-3 text-center">
                        {displayValue}
                    </td>
                );
            })}
             {/* Add an empty cell to align with the potential last-column rounding */}
             <td className="p-3 rounded-r-md"></td>
        </tr>
    );
};


interface SolutionsLibraryProps {
  solutions: AppData[];
  onSelectSolution: (solutionId: string) => void;
  onFileChange: (files: FileList, tournamentPhase: string) => void;
  isLoading: boolean;
  error: string | null;
  onBack?: () => void;
}

const tournamentPhases = [
    '100~60% left',
    '60~40% left',
    '40~20% left',
    'Near bubble',
    'After bubble',
    '3 tables',
    '2 tables',
    'Final table'
];

type SortDirection = 'ascending' | 'descending';
interface SortConfig {
    key: string;
    direction: SortDirection;
}

export const SolutionsLibrary: React.FC<SolutionsLibraryProps> = ({ solutions, onSelectSolution, onBack }) => {
    const [activePhaseFilter, setActivePhaseFilter] = useState<string>(tournamentPhases[0]);
    const [activePlayerFilter, setActivePlayerFilter] = useState<number | 'All'>('All');
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    // When the solution list changes, intelligently select the first filter that has solutions,
    // but only if the currently selected filter is empty. This prevents jarring UX on file upload.
    useEffect(() => {
        if (solutions.length > 0) {
            const currentFilterHasSolutions = solutions.some(s => s.tournamentPhase === activePhaseFilter);
            if (!currentFilterHasSolutions) {
                const firstPhaseWithSolutions = tournamentPhases.find(phase => 
                    solutions.some(s => s.tournamentPhase === phase)
                );
                if (firstPhaseWithSolutions) {
                    setActivePhaseFilter(firstPhaseWithSolutions);
                }
            }
        }
    }, [solutions]);
    
    const playerFilters = useMemo<(number | 'All')[]>(() => {
        if (solutions.length === 0) return ['All'];
        // Filter solutions by active phase first, then get unique player counts
        const phaseSolutions = solutions.filter(s => s.tournamentPhase === activePhaseFilter);
        if (phaseSolutions.length === 0) return ['All'];
        const availableCounts = new Set<number>(phaseSolutions.map(s => s.settings.handdata.stacks.length));
        const sortedCounts = Array.from(availableCounts).sort((a, b) => a - b);
        return ['All', ...sortedCounts];
    }, [solutions, activePhaseFilter]);

    useEffect(() => {
        if (activePlayerFilter !== 'All' && !playerFilters.includes(activePlayerFilter)) {
            setActivePlayerFilter('All');
        }
    }, [playerFilters, activePlayerFilter]);

    const filteredSolutions = useMemo(() => {
        return solutions
            .filter(s => s.tournamentPhase === activePhaseFilter)
            .filter(s => activePlayerFilter === 'All' || s.settings.handdata.stacks.length === activePlayerFilter);
    }, [solutions, activePhaseFilter, activePlayerFilter]);

    const positionsHeader = useMemo(() => {
        if (filteredSolutions.length === 0) {
            return ['UTG', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
        }
        const allActivePositions = new Set<string>();
        filteredSolutions.forEach(solution => {
            const positions = getPlayerPositions(solution.settings.handdata.stacks.length);
            positions.forEach(pos => allActivePositions.add(pos));
        });
        const masterPositionOrder = ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
        return masterPositionOrder.filter(pos => allActivePositions.has(pos));
    }, [filteredSolutions]);

    const requestSort = (key: string) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const getBigBlind = (solution: AppData) => {
        const blinds = solution.settings.handdata.blinds;
        return blinds.length > 1 ? Math.max(blinds[0], blinds[1]) : (blinds[0] || 1);
    };

    const sortedSolutions = useMemo(() => {
        let sortableItems = [...filteredSolutions];
        if (sortConfig === null) return sortableItems;

        const compare = (a: AppData, b: AppData) => {
            let aVal: string | number;
            let bVal: string | number;

            switch (sortConfig.key) {
                case 'fileName':
                    aVal = a.fileName.toLowerCase();
                    bVal = b.fileName.toLowerCase();
                    break;
                case 'players':
                    aVal = a.settings.handdata.stacks.length;
                    bVal = b.settings.handdata.stacks.length;
                    break;
                case 'avgStack':
                    const aBB = getBigBlind(a);
                    const aAvgStack = a.settings.handdata.stacks.reduce((x, y) => x + y, 0) / a.settings.handdata.stacks.length;
                    aVal = aAvgStack / aBB;
                    
                    const bBB = getBigBlind(b);
                    const bAvgStack = b.settings.handdata.stacks.reduce((x, y) => x + y, 0) / b.settings.handdata.stacks.length;
                    bVal = bAvgStack / bBB;
                    break;
                default: // Handles position columns
                    const getStackForPos = (sol: AppData, pos: string) => {
                        const bb = getBigBlind(sol);
                        const positions = getPlayerPositions(sol.settings.handdata.stacks.length);
                        const stackIndex = positions.indexOf(pos);
                        if (stackIndex === -1) return -1; // Treat non-existent positions as -1 for sorting
                        return sol.settings.handdata.stacks[stackIndex] / bb;
                    };
                    aVal = getStackForPos(a, sortConfig.key);
                    bVal = getStackForPos(b, sortConfig.key);
                    break;
            }

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return aVal.localeCompare(bVal);
            }
            // FIX: Replaced unsafe type cast with a proper type guard to prevent runtime errors
            // when comparing potentially mixed-type values. This resolves the arithmetic error.
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                if (aVal < bVal) return -1;
                if (aVal > bVal) return 1;
                return 0;
            }
            return 0;
        };

        sortableItems.sort((a, b) => {
            const order = compare(a, b);
            return sortConfig.direction === 'ascending' ? order : -order;
        });

        return sortableItems;
    }, [filteredSolutions, sortConfig]);

    const SortableHeader: React.FC<{ label: string; sortKey: string; className?: string; }> = ({ label, sortKey, className = '' }) => {
        const isSorting = sortConfig?.key === sortKey;
        const icon = sortConfig?.direction === 'ascending' ? '▲' : '▼';

        return (
            <th className={`p-3 select-none transition-colors duration-150 ${className}`} onClick={() => requestSort(sortKey)}>
                 <div className="flex items-center justify-center cursor-pointer hover:text-gray-200">
                    <span>{label}</span>
                    {isSorting && <span className="ml-1 text-xs">{icon}</span>}
                </div>
            </th>
        );
    };
  
    return (
    <div className="flex items-center justify-center min-h-screen bg-[#1e2227] p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <header className="mb-6">
            <div className="flex items-center gap-4 mb-4">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="px-4 py-2 bg-[#2d3238] hover:bg-[#353a42] text-white rounded-lg transition-colors"
                    >
                        ← Back
                    </button>
                )}
                <div>
                    <h1 className="text-4xl font-bold text-gray-100 mb-2">Solutions Library</h1>
                    <p className="text-gray-400">Select a solution to analyze.</p>
                </div>
            </div>
        </header>

        <div className="w-full space-y-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-300 mb-3">Tournament phase</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {tournamentPhases.map(phase => (
                             <button
                                key={phase}
                                onClick={() => setActivePhaseFilter(phase)}
                                className={`w-full px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 ${
                                    activePhaseFilter === phase
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-[#2d3238] text-gray-300 hover:bg-[#3c414b]'
                                }`}
                            >
                                {phase}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-gray-300 mb-3">Players</h2>
                     <div className="flex flex-wrap gap-2">
                        {playerFilters.map(num => (
                             <button
                                key={num}
                                onClick={() => setActivePlayerFilter(num)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 ${
                                    activePlayerFilter === num
                                    ? 'bg-gray-500 text-white shadow-md'
                                    : 'bg-[#2d3238] text-gray-300 hover:bg-[#3c414b]'
                                }`}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                </div>


                 <div className="bg-[#282c33] p-4 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4 text-gray-200">Available Solutions</h2>
                    {solutions.length > 0 ? (
                        <div className="overflow-x-auto">
                             {filteredSolutions.length > 0 ? (
                                <table className="w-full border-separate" style={{ borderSpacing: '0 0.5rem' }}>
                                    <thead>
                                        <tr className="text-xs text-gray-400 uppercase font-semibold">
                                            <SortableHeader label="Players" sortKey="players" className="rounded-l-md" />
                                            <SortableHeader label="Avg. Stack" sortKey="avgStack" />
                                            {positionsHeader.map(pos => <SortableHeader key={pos} label={pos} sortKey={pos} />)}
                                            {/* Empty header for spacing to match rounded corners */}
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedSolutions.map(solution => (
                                            <SolutionRow 
                                                key={solution.id} 
                                                solution={solution} 
                                                onSelect={onSelectSolution} 
                                                positionsHeader={positionsHeader} 
                                            />
                                        ))}
                                    </tbody>
                                </table>
                             ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <p>No solutions match the current filters.</p>
                                </div>
                             )}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <p>No solutions found.</p>
                            <p className="text-sm">Add solutions manually to the spots folder.</p>
                        </div>
                    )}
                 </div>
        </div>
      </div>
    </div>
  );
};