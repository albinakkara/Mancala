import type { BoardState, GameVariant, Difficulty, Player } from './types';
import {
  engineGetLegalMovesForVariant,
  engineMakeMoveForVariant,
  engineGetBestCpuMove,
} from './ai-engine';

let nodeCount = 0;

function resetNodeCount() {
  nodeCount = 0;
}

function checkBudget() {
  return nodeCount > 8_000;
}

export function getLegalMovesForVariant(state: BoardState, variant: GameVariant, player: Player): number[] {
  return engineGetLegalMovesForVariant(state, variant, player);
}

export function makeMoveForVariant(state: BoardState, variant: GameVariant, pit: number): BoardState {
  return engineMakeMoveForVariant(state, variant, pit);
}

export function getBestCpuMove(
  state: BoardState,
  variant: GameVariant,
  difficulty: Difficulty
): number | null {
  return engineGetBestCpuMove(state, variant, difficulty, checkBudget, resetNodeCount);
}
