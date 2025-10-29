import { getCombosForHand } from './pokerUtils';

/**
 * Sorteia um elemento aleatório de um array
 */
export function randomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Sorteia um combo de mão aleatório de uma lista de combos
 */
export function getRandomCombo(hand: string): string {
    const combos = getCombosForHand(hand);
    if (combos.length === 0) return '';
    return randomElement(combos);
}

/**
 * Sorteia combos únicos para múltiplos jogadores
 * Garante que não há cartas duplicadas
 */
export function dealRandomCombos(hands: string[]): string[] {
    const usedCards = new Set<string>();
    const dealtCombos: string[] = [];

    for (const hand of hands) {
        const combos = getCombosForHand(hand);
        
        // Filtra combos que não usam cartas já distribuídas
        const availableCombos = combos.filter(combo => {
            const card1 = combo.substring(0, 2);
            const card2 = combo.substring(2, 4);
            return !usedCards.has(card1) && !usedCards.has(card2);
        });

        if (availableCombos.length === 0) {
            // Se não há combos disponíveis, retorna vazio
            dealtCombos.push('');
            continue;
        }

        const selectedCombo = randomElement(availableCombos);
        dealtCombos.push(selectedCombo);

        // Marca as cartas como usadas
        const card1 = selectedCombo.substring(0, 2);
        const card2 = selectedCombo.substring(2, 4);
        usedCards.add(card1);
        usedCards.add(card2);
    }

    return dealtCombos;
}

/**
 * Sorteia uma mão do range do jogador baseado nas frequências
 */
export function selectHandFromRange(played: number[]): number {
    // Calcula a soma total das frequências
    const total = played.reduce((sum, freq) => sum + freq, 0);
    
    if (total === 0) {
        // Se não há frequências, retorna índice aleatório
        return Math.floor(Math.random() * played.length);
    }

    // Sorteia um número entre 0 e total
    let random = Math.random() * total;
    
    // Encontra o índice correspondente
    for (let i = 0; i < played.length; i++) {
        random -= played[i];
        if (random <= 0) {
            return i;
        }
    }
    
    return played.length - 1;
}

/**
 * Converte índice de combo para string de mão (ex: 0 -> "AhAs")
 */
export function comboIndexToString(handName: string, comboIndex: number): string {
    const combos = getCombosForHand(handName);
    if (comboIndex < 0 || comboIndex >= combos.length) {
        return combos[0] || '';
    }
    return combos[comboIndex];
}
