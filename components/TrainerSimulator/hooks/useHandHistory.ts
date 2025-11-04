/**
 * useHandHistory Hook
 * 
 * Builds hand history from the current spot's node path.
 * Returns HandHistoryData with all actions leading to hero's decision.
 */

import { useMemo } from 'react';
import type { AppData } from '../../../types';
import type { HandHistoryData } from '../types';
import { buildHandHistory } from '../utils/handHistoryBuilder';

interface UseHandHistoryProps {
    solution: AppData | null;
    nodeId: number;
    displayMode: 'bb' | 'chips';
}

interface UseHandHistoryReturn {
    history: HandHistoryData;
    hasActions: boolean;
}

export const useHandHistory = ({
    solution,
    nodeId,
    displayMode
}: UseHandHistoryProps): UseHandHistoryReturn => {
    
    const history = useMemo(() => {
        if (!solution || nodeId === 0) {
            return {
                actions: [],
                currentStreet: 'Preflop' as const
            };
        }
        
        return buildHandHistory(solution, nodeId, displayMode);
    }, [solution, nodeId, displayMode]);
    
    const hasActions = history.actions.length > 0;
    
    return {
        history,
        hasActions
    };
};
