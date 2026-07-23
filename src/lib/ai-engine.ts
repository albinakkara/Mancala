import type { BoardState, GameVariant, Difficulty, Player } from './types';
import { getLegalKalahMoves, makeKalahMove, KALAH_P1_PITS, KALAH_P0_PITS } from './kalah';
import { getLegalAvalancheMoves, makeAvalancheMove } from './avalanche';
import { getLegalOwareMoves, makeOwareMove, OWARE_P1_PITS, OWARE_P0_PITS } from './oware';

export const CPU_PLAYER: Player = 1;
export const NODE_BUDGET_HARD = 8_000;

export function engineGetLegalMovesForVariant(
  state: BoardState,
  variant: GameVariant,
  player: Player
): number[] {
  if (variant === 'kalah') return getLegalKalahMoves(state, player);
  if (variant === 'avalanche') return getLegalAvalancheMoves(state, player);
  return getLegalOwareMoves(state, player);
}

export function engineMakeMoveForVariant(
  state: BoardState,
  variant: GameVariant,
  pit: number
): BoardState {
  if (variant === 'kalah') return makeKalahMove(state, pit);
  if (variant === 'avalanche') return makeAvalancheMove(state, pit);
  return makeOwareMove(state, pit);
}

export function engineSelectEasyMove(
  state: BoardState,
  variant: GameVariant,
  legalMoves: number[]
): number {
  if (Math.random() < 0.7) {
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  let bestMove = legalMoves[0];
  let maxScore = -Infinity;

  for (const move of legalMoves) {
    const nextState = engineMakeMoveForVariant(state, variant, move);
    const score = nextState.scores[CPU_PLAYER] + (nextState.extraTurn ? 5 : 0);
    if (score > maxScore) {
      maxScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

export function engineDoesSowingReachOpponent(
  startPit: number,
  seeds: number,
  oppPits: number[]
): boolean {
  let pos = startPit;
  for (let i = 0; i < seeds; i++) {
    pos = (pos + 1) % 12;
    if (oppPits.includes(pos)) return true;
  }
  return false;
}

export function engineQuickEvaluateMove(
  state: BoardState,
  variant: GameVariant,
  pit: number,
  player: Player
): number {
  let score = 0;
  const seeds = state.pits[pit];

  if (variant === 'kalah' || variant === 'avalanche') {
    const cpuStore = player === 1 ? 13 : 6;
    const distToStore = cpuStore - pit;

    if (seeds === distToStore) {
      score += 1000;
    }

    if (variant === 'kalah') {
      const oppPit = 12 - pit;
      if (seeds === distToStore - 1 && state.pits[oppPit] > 0) {
        score += 800;
      }
    }

    score += seeds * 5;

    if (seeds === 1) {
      score -= 10;
    }
  }

  if (variant === 'oware') {
    const oppPits = player === 1 ? OWARE_P0_PITS : OWARE_P1_PITS;
    const landingPit = (pit + seeds) % 12;

    if (oppPits.includes(landingPit)) {
      const landingCount = state.pits[landingPit] + 1;
      if (landingCount === 2 || landingCount === 3) {
        score += 1000;
      }
    }

    const reachesOpp = engineDoesSowingReachOpponent(pit, seeds, oppPits);
    if (reachesOpp) {
      score += 50;
    }

    score += seeds * 2;
  }

  return score;
}

export function engineOrderMoves(
  state: BoardState,
  variant: GameVariant,
  moves: number[],
  player: Player
): number[] {
  return [...moves].sort((a, b) => {
    const scoreA = engineQuickEvaluateMove(state, variant, a, player);
    const scoreB = engineQuickEvaluateMove(state, variant, b, player);
    return scoreB - scoreA;
  });
}

export function engineEvaluateBoard(state: BoardState, variant: GameVariant): number {
  const cpuScore = state.scores[1];
  const playerScore = state.scores[0];

  let evalScore = (cpuScore - playerScore) * 100;

  if (state.isGameOver) {
    if (state.winner === 1) return 10000 + cpuScore;
    if (state.winner === 0) return -10000 - playerScore;
    return 0;
  }

  if (state.extraTurn && state.turn === 1) {
    evalScore += 40;
  } else if (state.extraTurn && state.turn === 0) {
    evalScore -= 40;
  }

  if (variant === 'kalah') {
    evalScore += engineEvaluateKalahPosition(state);
  } else if (variant === 'avalanche') {
    evalScore += engineEvaluateAvalanchePosition(state);
  } else if (variant === 'oware') {
    evalScore += engineEvaluateOwarePosition(state);
  }

  return evalScore;
}

export function engineEvaluateKalahPosition(state: BoardState): number {
  const cpuPits = KALAH_P1_PITS;
  const playerPits = KALAH_P0_PITS;
  let score = 0;

  const cpuSeeds = cpuPits.reduce((acc, p) => acc + state.pits[p], 0);
  const playerSeeds = playerPits.reduce((acc, p) => acc + state.pits[p], 0);
  score += (cpuSeeds - playerSeeds) * 2;

  for (const p of cpuPits) {
    const seeds = state.pits[p];
    const distToStore = 13 - p;
    if (seeds === distToStore) {
      score += 25;
    }
    if (seeds >= 4) {
      score += 3;
    }
    if (seeds === 1 && p !== 12) {
      score -= 8;
    }
  }

  for (const p of playerPits) {
    if (state.pits[p] === 1) {
      const cpuOpposite = 12 - p;
      if (cpuPits.includes(cpuOpposite) && state.pits[cpuOpposite] > 0) {
        score += 5;
      }
    }
  }

  return score;
}

export function engineEvaluateAvalanchePosition(state: BoardState): number {
  const cpuPits = KALAH_P1_PITS;
  const playerPits = KALAH_P0_PITS;
  let score = 0;

  const cpuSeeds = cpuPits.reduce((acc, p) => acc + state.pits[p], 0);
  const playerSeeds = playerPits.reduce((acc, p) => acc + state.pits[p], 0);
  score += (cpuSeeds - playerSeeds) * 2;

  for (const p of cpuPits) {
    const seeds = state.pits[p];
    const distToStore = 13 - p;
    if (seeds === distToStore) {
      score += 25;
    }
    if (seeds >= 6) {
      score += 10;
    } else if (seeds >= 4) {
      score += 4;
    }
    if (seeds === 1) {
      score -= 5;
    }
  }

  return score;
}

export function engineEvaluateOwarePosition(state: BoardState): number {
  const cpuPits = OWARE_P1_PITS;
  const playerPits = OWARE_P0_PITS;
  let score = 0;

  const cpuSeeds = cpuPits.reduce((acc, p) => acc + state.pits[p], 0);
  const playerSeeds = playerPits.reduce((acc, p) => acc + state.pits[p], 0);
  score += (cpuSeeds - playerSeeds) * 1;

  for (const p of playerPits) {
    const s = state.pits[p];
    if (s === 2 || s === 3) {
      score += 12;
    }
  }

  for (const p of cpuPits) {
    const s = state.pits[p];
    if (s >= 3 && s <= 6) {
      score += 3;
    }
  }

  return score;
}

export function engineSelectMinimaxMove(
  state: BoardState,
  variant: GameVariant,
  depth: number,
  useOrdering: boolean,
  checkBudget: () => boolean
): number {
  const legalMoves = engineGetLegalMovesForVariant(state, variant, CPU_PLAYER);
  let moves = legalMoves;
  if (useOrdering && moves.length > 1) {
    moves = engineOrderMoves(state, variant, moves, CPU_PLAYER);
  }

  let bestMove = moves[0];
  let bestValue = -Infinity;

  for (const move of moves) {
    const nextState = engineMakeMoveForVariant(state, variant, move);
    const currentDepth = depth - 1;
    const value = engineMinimax(
      nextState, variant, currentDepth, -Infinity, Infinity,
      nextState.turn === CPU_PLAYER, useOrdering, checkBudget
    );

    if (value > bestValue) {
      bestValue = value;
      bestMove = move;
    }
  }

  return bestMove;
}

export function engineSelectHardMove(
  state: BoardState,
  variant: GameVariant,
  legalMoves: number[],
  resetNodeCount: () => void,
  checkBudget: () => boolean
): number {
  const orderedMoves = engineOrderMoves(state, variant, legalMoves, CPU_PLAYER);
  const maxDepth = variant === 'avalanche' ? 4 : variant === 'oware' ? 5 : 6;
  let lastCompletedMove = orderedMoves[0];

  for (let d = 2; d <= maxDepth; d++) {
    resetNodeCount();
    let currentBestMove = orderedMoves[0];
    let currentBestValue = -Infinity;
    let budgetExceeded = false;

    for (const move of orderedMoves) {
      if (checkBudget()) {
        budgetExceeded = true;
        break;
      }

      const nextState = engineMakeMoveForVariant(state, variant, move);
      const value = engineMinimax(
        nextState, variant, d - 1, -Infinity, Infinity,
        nextState.turn === CPU_PLAYER, true, checkBudget
      );

      if (value > currentBestValue) {
        currentBestValue = value;
        currentBestMove = move;
      }
    }

    if (budgetExceeded) {
      break;
    }

    lastCompletedMove = currentBestMove;
  }

  return lastCompletedMove;
}

export function engineMinimax(
  state: BoardState,
  variant: GameVariant,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  useOrdering: boolean,
  checkBudget: () => boolean
): number {
  if (checkBudget()) {
    return engineEvaluateBoard(state, variant);
  }

  if (depth === 0 || state.isGameOver) {
    return engineEvaluateBoard(state, variant);
  }

  const currentPlayer: Player = isMaximizing ? 1 : 0;
  let moves = engineGetLegalMovesForVariant(state, variant, currentPlayer);

  if (moves.length === 0) {
    return engineEvaluateBoard(state, variant);
  }

  if (useOrdering && moves.length > 1) {
    moves = engineOrderMoves(state, variant, moves, currentPlayer);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      if (checkBudget()) break;
      const nextState = engineMakeMoveForVariant(state, variant, move);
      const nextDepth = depth - 1;
      const evalVal = engineMinimax(
        nextState, variant, nextDepth, alpha, beta,
        nextState.turn === CPU_PLAYER, useOrdering, checkBudget
      );
      maxEval = Math.max(maxEval, evalVal);
      alpha = Math.max(alpha, evalVal);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      if (checkBudget()) break;
      const nextState = engineMakeMoveForVariant(state, variant, move);
      const nextDepth = depth - 1;
      const evalVal = engineMinimax(
        nextState, variant, nextDepth, alpha, beta,
        nextState.turn === CPU_PLAYER, useOrdering, checkBudget
      );
      minEval = Math.min(minEval, evalVal);
      beta = Math.min(beta, evalVal);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function engineGetBestCpuMove(
  state: BoardState,
  variant: GameVariant,
  difficulty: Difficulty,
  checkBudget: () => boolean,
  resetNodeCount: () => void
): number | null {
  const legalMoves = engineGetLegalMovesForVariant(state, variant, CPU_PLAYER);
  if (legalMoves.length === 0) return null;
  if (legalMoves.length === 1) return legalMoves[0];

  if (difficulty === 'easy') {
    return engineSelectEasyMove(state, variant, legalMoves);
  } else if (difficulty === 'medium') {
    return engineSelectMinimaxMove(state, variant, 2, false, checkBudget);
  } else {
    resetNodeCount();
    return engineSelectHardMove(state, variant, legalMoves, resetNodeCount, checkBudget);
  }
}
