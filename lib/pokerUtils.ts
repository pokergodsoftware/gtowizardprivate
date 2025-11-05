
import { SettingsData, NodeData } from '../types.ts';

export const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

export const generateHandMatrix = (): string[][] => {
  return ranks.map((rank1, i) => {
    return ranks.map((rank2, j) => {
      if (i === j) {
        return `${rank1}${rank2}`;
      } else if (i < j) {
        return `${rank1}${rank2}s`;
      } else {
        return `${rank2}${rank1}o`;
      }
    });
  });
};

const positionNameMappings: { [key: number]: string[] } = {
  9: ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  8: ['UTG', 'UTG1', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  7: ['UTG', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  6: ['LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  5: ['HJ', 'CO', 'BTN', 'SB', 'BB'],
  4: ['CO', 'BTN', 'SB', 'BB'],
  3: ['BTN', 'SB', 'BB'],
  2: ['BTN', 'BB'], // SB is BTN in heads-up
};

export const getPlayerPositions = (numPlayers: number): string[] => {
    return positionNameMappings[numPlayers] || Array.from({length: numPlayers}, (_, i) => `P${i+1}`);
}

export const getActionColor = (
    actionName: string, 
    playerIndex?: number, 
    numPlayers?: number
): string => {
    const isPlayerBB = (playerIndex !== undefined && numPlayers !== undefined && numPlayers > 1) 
        ? playerIndex === numPlayers - 1 
        : false;

  // Cores inspiradas no GTO Wizard
  // Normalizamos o nome da ação (removendo caracteres não-alfa-numéricos e em lowercase)
  // para aceitar tanto 'All-in' quanto 'Allin' (e variações com/sem hífen).
  const normalizedAction = actionName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalizedAction.includes('allin')) return 'bg-[#d946ef]'; // Magenta vibrante para All-in (como GTO Wizard)
    if (actionName.startsWith('Raise')) return 'bg-[#f97316]'; // Laranja para Raise
    if (actionName.startsWith('Fold')) return 'bg-[#0ea5e9]'; // Azul cyan para Fold
    if (actionName.startsWith('Call')) return 'bg-[#10b981]'; // Verde para Call
    if (actionName.startsWith('Check')) {
        // If the current player is the Big Blind, their "Check" action is green, like a "Call".
        if (isPlayerBB) {
            return 'bg-[#10b981]';
        }
        return 'bg-[#6b7280]';
    }
    return 'bg-[#4b5563]'; // Fallback for unexpected actions
};

export const formatChips = (amount: number): string => {
  // Use toLocaleString to format the number with thousand separators (e.g., 1,234)
  // instead of abbreviating it (e.g., 1.2k), which was the previous incorrect behavior.
  // Check if the number has decimals, if so, format with up to 2 decimal places
  const hasDecimals = amount % 1 !== 0;
  if (hasDecimals) {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  return Math.round(amount).toLocaleString('en-US');
};

export const getActionName = (
    action: {type: string; amount: number}, 
    bigBlind: number, 
    playerStack: number, 
    displayMode: 'bb' | 'chips',
    allStacks?: readonly number[]
): string => {
    // Ajustar bigBlind para cálculos em modo BB (dividir por 100)
    const adjustedBigBlind = displayMode === 'bb' ? bigBlind / 100 : bigBlind;
    
    // Convert action amount and player stack to BB for comparison
    const actionAmountBB = adjustedBigBlind > 0 ? (action.amount / 100) / adjustedBigBlind : 0;
    const playerStackBB = adjustedBigBlind > 0 ? (playerStack / 100) / adjustedBigBlind : 0;
    
    // An action (Raise or Call) is considered "All-in" if it commits at least 90% of the player's stack
    // OR if the remaining stack is less than 0.5 BB (essentially all-in)
    // This catches both exact all-ins and actions that exceed the stack
    const remainingStackBB = playerStackBB - actionAmountBB;
    const isAllIn = (action.type === 'R' || action.type === 'C') && 
                    playerStackBB > 0 && 
                    (actionAmountBB >= playerStackBB * 0.90 || remainingStackBB < 0.5);
    
    // New logic: Check if the raise is an all-in against a shorter-stacked opponent.
    let isOpponentAllIn = false;
    if (allStacks && action.type === 'R' && adjustedBigBlind > 0) {
        const raiseSizeBB = (action.amount / 100) / adjustedBigBlind;
        for (const stack of allStacks) {
            // Check against stacks smaller than the actor's stack
            if (stack < playerStack) {
                const opponentStackBB = (stack / 100) / adjustedBigBlind;
                // Check for a very close match to identify raises sized to put an opponent all-in
                if (Math.abs(raiseSizeBB - opponentStackBB) < 0.05) {
                    isOpponentAllIn = true;
                    break;
                }
            }
        }
    }


    switch (action.type) {
        case 'F': return 'Fold';
        case 'R': 
            let formattedSize: string;
            if (displayMode === 'chips') {
                formattedSize = formatChips(action.amount / 100);
            } else {
                if (adjustedBigBlind > 0) {
                    const raiseSizeBB = ((action.amount / 100) / adjustedBigBlind).toFixed(1);
                    formattedSize = raiseSizeBB.endsWith('.0') ? raiseSizeBB.slice(0, -2) : raiseSizeBB;
                } else {
                    formattedSize = action.amount.toString();
                }
            }
            if(isAllIn || isOpponentAllIn) return `All-in ${formattedSize}`;
            return `Raise ${formattedSize}`;
        case 'C': 
            // Check if call is all-in
            if (isAllIn) {
                let formattedSize: string;
                if (displayMode === 'chips') {
                    formattedSize = formatChips(action.amount / 100);
                } else {
                    if (adjustedBigBlind > 0) {
                        const callSizeBB = ((action.amount / 100) / adjustedBigBlind).toFixed(1);
                        formattedSize = callSizeBB.endsWith('.0') ? callSizeBB.slice(0, -2) : callSizeBB;
                    } else {
                        formattedSize = action.amount.toString();
                    }
                }
                return `All-in ${formattedSize}`;
            }
            return 'Call';
        case 'X': return 'Check';
        default: return action.type;
    }
};

export const getHandTypeMaxCombos = (handName: string): number => {
    if (handName.length < 2) return 0;
    const r1 = handName[0];
    const r2 = handName[1];

    if (r1 === r2) { // Pair
        return 6;
    }
    if (handName.length > 2 && handName[2] === 's') { // Suited
        return 4;
    }
    if (handName.length > 2 && handName[2] === 'o') { // Offsuit
        return 12;
    }
    return 0;
};


export const suits: { [key: string]: { char: string; color: string } } = {
  s: { char: '♠', color: 'text-gray-300' },
  h: { char: '♥', color: 'text-red-500' },
  d: { char: '♦', color: 'text-blue-400' },
  c: { char: '♣', color: 'text-green-500' },
};

const suitChars = ['s', 'h', 'd', 'c'];

export const getCombosForHand = (hand: string): string[] => {
  if (!hand || hand.length < 2) return [];

  const r1 = hand[0];
  const r2 = hand[1];
  const combos: string[] = [];

  if (r1 === r2) { // Pair
    for (let i = 0; i < suitChars.length; i++) {
      for (let j = i + 1; j < suitChars.length; j++) {
        // Order suits alphabetically for consistency (cdhs)
        const s1 = suitChars[i] < suitChars[j] ? suitChars[i] : suitChars[j];
        const s2 = suitChars[i] < suitChars[j] ? suitChars[j] : suitChars[i];
        combos.push(`${r1}${s1}${r2}${s2}`);
      }
    }
  } else if (hand.length === 3 && hand[2] === 's') { // Suited
    for (const suit of suitChars) {
      combos.push(`${r1}${suit}${r2}${suit}`);
    }
  } else if (hand.length === 3 && hand[2] === 'o') { // Offsuit
    for (let i = 0; i < suitChars.length; i++) {
      for (let j = 0; j < suitChars.length; j++) {
        if (i !== j) {
          combos.push(`${r1}${suitChars[i]}${r2}${suitChars[j]}`);
        }
      }
    }
  }
  
  return combos;
};

export const formatPayouts = (payouts: number[]): { position: string; prize: string }[] => {
  if (!payouts || payouts.length === 0) {
    return [];
  }

  const formatted: { position: string; prize: string }[] = [];
  let startIndex = 0;

  for (let i = 1; i <= payouts.length; i++) {
    if (i === payouts.length || payouts[i] !== payouts[startIndex]) {
      const endIndex = i - 1;
      let position: string;
      if (startIndex === endIndex) {
        position = `${startIndex + 1}.`;
      } else {
        position = `${startIndex + 1}-${endIndex + 1}.`;
      }
      
      const prize = `$${payouts[startIndex].toLocaleString('en-US')}`;
      
      formatted.push({ position, prize });
      startIndex = i;
    }
  }

  return formatted;
};

// Mapeamento de bounties iniciais por tipo de speed
const INITIAL_BOUNTIES: { [key: string]: number } = {
  'speed32': 7.5,
  'speed20': 5,
  'speed50': 12.5,
  'speed108': 25
};

/**
 * Extrai o tipo de speed do nome do arquivo da solução
 * Ex: "speed32_1" -> "speed32"
 */
export const getSpeedType = (fileName: string): string | null => {
  const match = fileName.match(/speed(\d+)/i);
  return match ? `speed${match[1]}` : null;
};

/**
 * Retorna o bounty inicial baseado no tipo de speed
 */
export const getInitialBounty = (fileName: string): number => {
  const speedType = getSpeedType(fileName);
  return speedType ? (INITIAL_BOUNTIES[speedType] || 0) : 0;
};

/**
 * Calcula quantos bounties iniciais o jogador possui
 * Retorna string formatada como "1x", "2x", etc.
 */
export const calculateBountyMultiplier = (bountyAmount: number, fileName: string): string => {
  const initialBounty = getInitialBounty(fileName);
  if (initialBounty === 0 || bountyAmount === 0) return '';
  
  const multiplier = Math.round(bountyAmount / initialBounty);
  return multiplier > 0 ? `${multiplier}x` : '';
};