/**
 * 🎯 Sistema de Pontuação e Avaliação de Ações
 * 
 * Define como as ações são avaliadas baseado em frequência e EV
 */

export type ActionQuality = 'best' | 'correct' | 'inaccuracy' | 'mistake' | 'blunder';

export interface ActionEvaluation {
    quality: ActionQuality;
    points: number;
    livesLost: number; // Para modo torneio
    message: string;
    color: string; // Cor para UI
}

/**
 * Avalia a qualidade de uma ação baseado em frequência e EV
 * 
 * Regras:
 * - Best Move: Ação com maior frequência [1.25 pontos, 0 vidas perdidas]
 * - Correct Move: EV positivo e frequência >= 3.5% [1 ponto, 0 vidas perdidas]
 * - Inaccuracy: Frequência > 0.5% e < 3.5% [0.5 pontos, 0.5 vidas perdidas]
 * - Mistake: Frequência > 0% e <= 0.5% [0 pontos, 1 vida perdida]
 * - Blunder: Frequência = 0% [0 pontos, 1 vida perdida]
 */
export function evaluateAction(
    chosenActionIndex: number,
    frequencies: number[],
    evs: number[] | undefined,
    actions: Array<{type: string}>
): ActionEvaluation {
    const chosenFreq = frequencies[chosenActionIndex] || 0;
    const chosenEv = evs?.[chosenActionIndex];
    
    // Encontrar a ação com maior frequência (best move)
    const maxFreq = Math.max(...frequencies);
    const isBestMove = Math.abs(chosenFreq - maxFreq) < 0.001; // Tolerância para float
    
    // Converter frequências para percentual
    const freqPercent = chosenFreq * 100;
    
    console.log('📊 Action Evaluation:', {
        chosenAction: actions[chosenActionIndex].type,
        frequency: `${freqPercent.toFixed(1)}%`,
        ev: chosenEv?.toFixed(3),
        maxFrequency: `${(maxFreq * 100).toFixed(1)}%`,
        isBestMove,
        allFrequencies: frequencies.map((f, i) => ({
            action: actions[i].type,
            freq: `${(f * 100).toFixed(1)}%`,
            ev: evs?.[i]?.toFixed(3)
        }))
    });
    
    // BEST MOVE: Ação com maior frequência
    if (isBestMove) {
        return {
            quality: 'best',
            points: 1.25,
            livesLost: 0,
            message: `Best Move! (${freqPercent.toFixed(1)}%)`,
            color: 'text-green-400'
        };
    }
    
    // CORRECT MOVE: EV positivo e frequência >= 3.5%
    if (freqPercent >= 3.5) {
        const hasPositiveEv = chosenEv === undefined || chosenEv > 0;
        if (hasPositiveEv) {
            return {
                quality: 'correct',
                points: 1.0,
                livesLost: 0,
                message: `Correct Move (${freqPercent.toFixed(1)}%)`,
                color: 'text-green-300'
            };
        }
    }
    
    // INACCURACY: Frequência > 0.5% e < 3.5%
    if (freqPercent > 0.5 && freqPercent < 3.5) {
        return {
            quality: 'inaccuracy',
            points: 0.5,
            livesLost: 0.5,
            message: `Inaccuracy (${freqPercent.toFixed(1)}% frequency)`,
            color: 'text-yellow-400'
        };
    }
    
    // MISTAKE: Frequência > 0% e <= 0.5%
    if (freqPercent > 0 && freqPercent <= 0.5) {
        return {
            quality: 'mistake',
            points: 0,
            livesLost: 1,
            message: `Mistake (${freqPercent.toFixed(1)}% frequency)`,
            color: 'text-orange-400'
        };
    }
    
    // BLUNDER: Frequência = 0%
    return {
        quality: 'blunder',
        points: 0,
        livesLost: 1,
        message: `Blunder! Never play this (0% frequency)`,
        color: 'text-red-400'
    };
}

/**
 * Determina se a ação é considerada "correta" para propósitos de estatísticas
 * (Best, Correct ou Inaccuracy são considerados "corretos" para accuracy)
 */
export function isActionCorrect(quality: ActionQuality): boolean {
    return quality === 'best' || quality === 'correct' || quality === 'inaccuracy';
}
