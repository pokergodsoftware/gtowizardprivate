/**
 * useTimebank Hook
 * 
 * Manages tournament mode timebank timer with audio alerts.
 * Extracted from TrainerSimulator.tsx during Phase 2 refactoring.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getTrainerAssetUrl } from '../../../src/config.ts';
import type { SpotSimulation } from '../types.ts';

export interface UseTimebankProps {
    tournamentMode: boolean;
    currentSpot: SpotSimulation | null;
    userAction: string | null;
    onTimeExpired: () => void;
}

export interface UseTimebankReturn {
    timeLeft: number;
    stopAudios: () => void;
}

/**
 * Custom hook for managing timebank timer in tournament mode
 * - Initializes audio files from CDN
 * - Resets timer when new spot is generated
 * - Plays warning sounds at 8s and 4s
 * - Calls onTimeExpired callback when time runs out
 */
export const useTimebank = ({
    tournamentMode,
    currentSpot,
    userAction,
    onTimeExpired
}: UseTimebankProps): UseTimebankReturn => {
    const [timeLeft, setTimeLeft] = useState(15); // 15 seconds
    const [hasPlayedTimebank1, setHasPlayedTimebank1] = useState(false);
    const [hasPlayedTimebank2, setHasPlayedTimebank2] = useState(false);
    const timebankAudio1 = useRef<HTMLAudioElement | null>(null);
    const timebankAudio2 = useRef<HTMLAudioElement | null>(null);

    // Initialize audio files (only in tournament mode)
    useEffect(() => {
        if (tournamentMode) {
            const url1 = getTrainerAssetUrl('timebank1.ogg');
            const url2 = getTrainerAssetUrl('timebank2.ogg');
            
            timebankAudio1.current = new Audio(url1);
            timebankAudio1.current.volume = 1.0;
            timebankAudio2.current = new Audio(url2);
            timebankAudio2.current.volume = 1.0;
        }
        
        return () => {
            if (timebankAudio1.current) {
                timebankAudio1.current.pause();
                timebankAudio1.current = null;
            }
            if (timebankAudio2.current) {
                timebankAudio2.current.pause();
                timebankAudio2.current = null;
            }
        };
    }, [tournamentMode]);
    
    // Reset timebank when new spot is generated
    useEffect(() => {
        if (currentSpot && !userAction && tournamentMode) {
            setTimeLeft(15);
            setHasPlayedTimebank1(false);
            setHasPlayedTimebank2(false);
        }
    }, [currentSpot, userAction, tournamentMode]);
    
    // Function to play audio file
    const playBeep = (alertNumber: 1 | 2) => {
        try {
            const audio = alertNumber === 1 ? timebankAudio1.current : timebankAudio2.current;
            if (!audio) return;
            
            audio.currentTime = 0;
            audio.play().catch(e => console.error('❌ Audio playback failed:', e));
        } catch (err) {
            console.error('❌ Error playing audio:', err);
        }
    };
    
    // Timebank countdown timer (only in tournament mode)
    useEffect(() => {
        if (!tournamentMode || userAction || !currentSpot) {
            return;
        }
        
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                const newTime = prev - 1;
                
                // Play first warning at 8s
                if (newTime === 8 && !hasPlayedTimebank1) {
                    playBeep(1);
                    setHasPlayedTimebank1(true);
                }
                
                // Play second warning at 4s
                if (newTime === 4 && !hasPlayedTimebank2) {
                    playBeep(2);
                    setHasPlayedTimebank2(true);
                }
                
                // Time expired - trigger callback
                if (newTime <= 0) {
                    onTimeExpired();
                    return 0;
                }
                
                return newTime;
            });
        }, 1000);
        
        return () => clearInterval(interval);
    }, [tournamentMode, userAction, currentSpot, hasPlayedTimebank1, hasPlayedTimebank2, onTimeExpired]);

    // Function to stop all audio playback
    const stopAudios = useCallback(() => {
        if (timebankAudio1.current) {
            timebankAudio1.current.pause();
            timebankAudio1.current.currentTime = 0;
        }
        if (timebankAudio2.current) {
            timebankAudio2.current.pause();
            timebankAudio2.current.currentTime = 0;
        }
    }, []);

    return {
        timeLeft,
        stopAudios
    };
};
