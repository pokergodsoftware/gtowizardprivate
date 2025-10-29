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