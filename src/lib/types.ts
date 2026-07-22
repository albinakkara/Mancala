export type GameVariant = 'kalah' | 'avalanche' | 'oware';
export type GameMode = 'pvc' | 'pvp';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Player = 0 | 1;

export interface MoveRecord {
  player: Player;
  pitIndex: number;
  seedsSown: number;
  captured: number;
  capturedPits?: number[];
  extraTurn: boolean;
  timestamp: string;
}

export interface BoardState {
  pits: number[];
  scores: [number, number];
  turn: Player;
  isGameOver: boolean;
  winner: Player | 'draw' | null;
  lastSownPit: number | null;
  extraTurn: boolean;
  statusMessage: string;
  moveHistory: MoveRecord[];
  animatingPit?: number | null;
}

export interface VariantInfo {
  id: GameVariant;
  name: string;
  subtitle: string;
  description: string;
  badge: string;
  initialSeedsPerPit: number;
  totalPits: number;
  hasStores: boolean;
  keyRule: string;
}

export interface GameStats {
  kalah: { wins: number; losses: number; draws: number };
  avalanche: { wins: number; losses: number; draws: number };
  oware: { wins: number; losses: number; draws: number };
}
