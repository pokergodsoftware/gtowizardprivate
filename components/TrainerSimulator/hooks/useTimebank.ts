/**
 * useTimebank Hook
 * 
 * Manages tournament mode timebank timer with audio alerts.
 * Extracted from TrainerSimulator.tsx during Phase 2 refactoring.
 */

import { useState, useEffect, useRef } from 'react';
import { getTrainerAssetUrl } from '../../../src/config.ts';
import type { SpotSimulation } from '../types.ts';

export interface UseTimebankProps {
    tournamentMode: boolean;
    currentSpot: SpotSimulation | null;
    showFeedback: boolean;
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
    showFeedback,
    onTimeExpired
}: UseTimebankProps): UseTimebankReturn => {
    const [timeLeft, setTimeLeft] = useState(15); // 15 seconds
    const [hasPlayedTimebank1, setHasPlayedTimebank1] = useState(false);
    const [hasPlayedTimebank2, setHasPlayedTimebank2] = useState(false);
    const timebankAudio1 = useRef<HTMLAudioElement | null>(null);
    const timebankAudio2 = useRef<HTMLAudioElement | null>(null);

    // Initialize timebank audio files (only in tournament mode)
    useEffect(() => {
        if (tournamentMode) {
            timebankAudio1.current = new Audio(getTrainerAssetUrl('timebank1.mp3'));
            timebankAudio2.current = new Audio(getTrainerAssetUrl('timebank2.mp3'));
            console.log('🎵 Timebank audios initialized from CDN');
        }
        
        // Cleanup: stop and remove audio elements
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
        if (currentSpot && !showFeedback && tournamentMode) {
            console.log('⏱️ Resetting timebank to 15s');
            setTimeLeft(15);
            setHasPlayedTimebank1(false);
            setHasPlayedTimebank2(false);
        }
    }, [currentSpot, showFeedback, tournamentMode]);
    
    // Timebank countdown timer (only in tournament mode)
    useEffect(() => {
        if (!tournamentMode || showFeedback || !currentSpot) {
            console.log('⏱️ Timebank countdown NOT active:', { 
                tournamentMode, 
                showFeedback, 
                hasSpot: !!currentSpot 
            });
            return;
        }
        
        console.log('⏱️ Timebank countdown ACTIVE');
        
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                const newTime = prev - 1;
                
                // Log every 5 seconds or when ≤5s remaining
                if (newTime % 5 === 0 || newTime <= 5) {
                    console.log(`⏱️ Timebank: ${newTime}s`);
                }
                
                // Play first warning at 8s
                if (newTime === 8 && !hasPlayedTimebank1 && timebankAudio1.current) {
                    console.log('🔊 Playing timebank1 audio (8s)');
                    timebankAudio1.current.play().catch(err => 
                        console.error('Erro ao tocar timebank1:', err)
                    );
                    setHasPlayedTimebank1(true);
                }
                
                // Play second warning at 4s
                if (newTime === 4 && !hasPlayedTimebank2 && timebankAudio2.current) {
                    console.log('🔊 Playing timebank2 audio (4s)');
                    timebankAudio2.current.play().catch(err => 
                        console.error('Erro ao tocar timebank2:', err)
                    );
                    setHasPlayedTimebank2(true);
                }
                
                // Time expired - trigger callback
                if (newTime <= 0) {
                    console.log('⏰ Timebank expired - calling onTimeExpired');
                    onTimeExpired();
                    return 0;
                }
                
                return newTime;
            });
        }, 1000);
        
        return () => clearInterval(interval);
    }, [tournamentMode, showFeedback, currentSpot, hasPlayedTimebank1, hasPlayedTimebank2, onTimeExpired]);

    // Function to stop all audio playback
    const stopAudios = () => {
        if (timebankAudio1.current) {
            timebankAudio1.current.pause();
            timebankAudio1.current.currentTime = 0;
        }
        if (timebankAudio2.current) {
            timebankAudio2.current.pause();
            timebankAudio2.current.currentTime = 0;
        }
        console.log('🔇 Timebank audios stopped');
    };

    return {
        timeLeft,
        stopAudios
    };
};
