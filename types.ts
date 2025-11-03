export interface HandData {
  weight: number;
  played: number[];
  evs: number[];
}

export interface Action {
  type: 'F' | 'R' | 'C' | 'X'; // Fold, Raise, Call, Check
  amount: number;
  node?: number;
}

export interface VillainAction {
  position: number;
  action: string; // 'Fold', 'Call', 'Raise X', 'Allin'
  amount?: number; // Bet amount (if applicable)
  combo?: string; // Hand combo used by villain (e.g., "AhKd")
}

export interface NodeData {
  player: number;
  street: number;
  children: number;
  sequence: any[];
  actions: Action[];
  hands: { [hand: string]: HandData };
}

export interface StructureData {
  name?: string;
  bountyType?: string;
  progressiveFactor?: number;
  chips?: number;
  prizes?: { [key: string]: number };
}

export interface EqModelData {
  otheravgbounty: number;
  otherstacks: number[];
  id: string;
  structure: StructureData;
}

export interface SettingsData {
  handdata: {
    stacks: number[];
    blinds: number[]; // [SB, BB, Ante]
    bounties: number[];
    anteType: string;
  };
  eqmodel: EqModelData;
  treeconfig: any;
  engine: any;
}

export interface EquityData {
    equityUnit: string;
    preHandEquity: number[];
    bubbleFactors: number[][];
}


export interface SolutionMetadata {
  path: string;
  fileName: string;
  tournamentPhase: string;
  nodeIds: number[];
  totalNodes: number;
}

export interface AppData {
  id: string;
  fileName: string;
  tournamentPhase: string;
  settings: SettingsData;
  equity: EquityData;
  nodes: Map<number, NodeData>;
  path?: string; // Caminho para carregar nodes sob demanda
}

// ====================================
// Composed Interface Types for PokerTable
// ====================================

/**
 * Display configuration for the poker table
 */
export interface DisplaySettings {
  mode: 'bb' | 'chips';
  showBountyInDollars: boolean;
}

/**
 * Tournament context information
 */
export interface TournamentInfo {
  phase?: string;
  fileName?: string;
}

/**
 * Spot-specific context information for training mode
 */
export interface SpotContext {
  type?: string;
  raiserPosition?: number;
  shoverPositions?: number[];
  villainActions?: VillainAction[];
}