/**
 * Spot Generators Index
 * 
 * Central export point for all spot generation functions.
 * 
 * Spot types:
 * - RFI: Raise First In (hero opens the pot)
 * - vs Open: Hero faces a 2BB open raise
 * - vs Shove: Hero faces an all-in
 * - vs Multiway: Hero faces multiple all-ins
 * - Any: Random navigation through game tree
 */

// RFI Spot Generator
export {
    generateRFISpot,
    isValidRFISolution,
    getValidRFIPositions,
    getPositionName,
    type RFISpotResult
} from './generateRFISpot';

// vs Open Spot Generator
export {
    generateVsOpenSpot,
    isValidVsOpenSolution,
    getValidVsOpenHeroPositions,
    type VsOpenConfig,
    type VsOpenSpotResult
} from './generateVsOpenSpot';

// vs Shove Spot Generator
export {
    generateVsShoveSpot,
    isValidVsShoveSolution,
    getValidVsShoveHeroPositions,
    type VsShoveConfig,
    type VsShoveSpotResult
} from './generateVsShoveSpot';

// vs Multiway Spot Generator
export {
    generateVsMultiwaySpot,
    isValidVsMultiwaySolution,
    type VsMultiwayConfig,
    type VsMultiwaySpotResult
} from './generateVsMultiwaySpot';

// Any Spot Generator
export {
    generateAnySpot,
    isValidAnySolution,
    type AnySpotConfig,
    type AnySpotResult
} from './generateAnySpot';
