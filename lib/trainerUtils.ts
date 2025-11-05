import { getCombosForHand } from './pokerUtils';

/**
 * Picks a random element from an array
 */
export function randomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Picks a random combo for a given hand from the list of combos
 */
export function getRandomCombo(hand: string): string {
    const combos = getCombosForHand(hand);
    if (combos.length === 0) return '';
    return randomElement(combos);
}

/**
 * Deals unique combos for multiple players
 * Ensures there are no duplicate cards
 */
export function dealRandomCombos(hands: string[]): string[] {
    const usedCards = new Set<string>();
    const dealtCombos: string[] = [];

    for (const hand of hands) {
        const combos = getCombosForHand(hand);
        
        // Filter combos that don't use already dealt cards
        const availableCombos = combos.filter(combo => {
            const card1 = combo.substring(0, 2);
            const card2 = combo.substring(2, 4);
            return !usedCards.has(card1) && !usedCards.has(card2);
        });

        if (availableCombos.length === 0) {
            // If no combos are available, return an empty string
            dealtCombos.push('');
            continue;
        }

        const selectedCombo = randomElement(availableCombos);
        dealtCombos.push(selectedCombo);

        // Mark the cards as used
        const card1 = selectedCombo.substring(0, 2);
        const card2 = selectedCombo.substring(2, 4);
        usedCards.add(card1);
        usedCards.add(card2);
    }

    return dealtCombos;
}

/**
 * Selects a hand from the player's range based on frequency weights
 */
export function selectHandFromRange(played: number[]): number {
    // Calculate total sum of frequencies
    const total = played.reduce((sum, freq) => sum + freq, 0);
    
    if (total === 0) {
        // If there are no frequencies, return a random index
        return Math.floor(Math.random() * played.length);
    }

    // Draw a random number between 0 and total
    let random = Math.random() * total;
    
    // Find the corresponding index
    for (let i = 0; i < played.length; i++) {
        random -= played[i];
        if (random <= 0) {
            return i;
        }
    }
    
    return played.length - 1;
}

/**
 * Convert combo index to hand string (e.g., 0 -> "AhAs")
 */
export function comboIndexToString(handName: string, comboIndex: number): string {
    const combos = getCombosForHand(handName);
    if (comboIndex < 0 || comboIndex >= combos.length) {
        return combos[0] || '';
    }
    return combos[comboIndex];
}
