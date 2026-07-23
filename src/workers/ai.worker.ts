import type { BoardState, GameVariant, Difficulty, Player } from '../lib/types';
import { getLegalKalahMoves, makeKalahMove, KALAH_P1_PITS, KALAH_P0_PITS } from '../lib/kalah';
import { getLegalAvalancheMoves, makeAvalancheMove } from '../lib/avalanche';
import { getLegalOwareMoves, makeOwareMove, OWARE_P1_PITS, OWARE_P0_PITS } from '../lib/oware';

const CPU_PLAYER: Player = 1;
const NODE_BUDGET_HARD = 8_000;

interface WorkerMessage {
  type: 'GET_BEST_MOVE';
  state: BoardState;
  variant: GameVariant;
  difficulty: Difficulty;
  id: number;
}

interface WorkerResponse {
  type: 'BEST_MOVE';
  move: number | null;
  id: number;
}

let nodeCount = 0;

function resetNodeCount() {
  nodeCount = 0;
}

function checkBudget(): boolean {
  return nodeCount > NODE_BUDGET_HARD;
}

function incrementNodeCount() {
  nodeCount++;
}

function getLegalMovesForVariant(state: BoardState, variant: GameVariant, player: Player): number[] {
  if (variant === 'kalah') return getLegalKalahMoves(state, player);
  if (variant === 'avalanche') return getLegalAvalancheMoves(state, player);
  return getLegalOwareMoves(state, player);
}

function makeMoveForVariant(state: BoardState, variant: GameVariant, pit: number): BoardState {
  if (variant === 'kalah') return makeKalahMove(state, pit);
  if (variant === 'avalanche') return makeAvalancheMove(state, pit);
  return makeOwareMove(state, pit);
}

function selectEasyMove(state: BoardState, variant: GameVariant, legalMoves: number[]): number {
  if (Math.random() < 0.7) {
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  let bestMove = legalMoves[0];
  let maxScore = -Infinity;

  for (const move of legalMoves) {
    const nextState = makeMoveForVariant(state, variant, move);
    const score = nextState.scores[CPU_PLAYER] + (nextState.extraTurn ? 5 : 0);
    if (score > maxScore) {
      maxScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

function quickEvaluateMove(state: BoardState, variant: GameVariant, pit: number, player: Player): number {
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

    const reachesOpp = doesSowingReachOpponent(pit, seeds, oppPits);
    if (reachesOpp) {
      score += 50;
    }

    score += seeds * 2;
  }

  return score;
}

function doesSowingReachOpponent(startPit: number, seeds: number, oppPits: number[]): boolean {
  let pos = startPit;
  for (let i = 0; i < seeds; i++) {
    pos = (pos + 1) % 12;
    if (oppPits.includes(pos)) return true;
  }
  return false;
}

function orderMoves(state: BoardState, variant: GameVariant, moves: number[], player: Player): number[] {
  return [...moves].sort((a, b) => {
    const scoreA = quickEvaluateMove(state, variant, a, player);
    const scoreB = quickEvaluateMove(state, variant, b, player);
    return scoreB - scoreA;
  });
}

function evaluateBoard(state: BoardState, variant: GameVariant): number {
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
    evalScore += evaluateKalahPosition(state);
  } else if (variant === 'avalanche') {
    evalScore += evaluateAvalanchePosition(state);
  } else if (variant === 'oware') {
    evalScore += evaluateOwarePosition(state);
  }

  return evalScore;
}

function evaluateKalahPosition(state: BoardState): number {
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

function evaluateAvalanchePosition(state: BoardState): number {
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

function evaluateOwarePosition(state: BoardState): number {
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

function selectMinimaxMove(
  state: BoardState,
  variant: GameVariant,
  depth: number,
  useOrdering: boolean
): number {
  const legalMoves = getLegalMovesForVariant(state, variant, CPU_PLAYER);
  let moves = legalMoves;
  if (useOrdering && moves.length > 1) {
    moves = orderMoves(state, variant, moves, CPU_PLAYER);
  }

  let bestMove = moves[0];
  let bestValue = -Infinity;

  for (const move of moves) {
    const nextState = makeMoveForVariant(state, variant, move);
    const currentDepth = depth - 1;
    const value = minimax(
      nextState, variant, currentDepth, -Infinity, Infinity,
      nextState.turn === CPU_PLAYER, useOrdering
    );

    if (value > bestValue) {
      bestValue = value;
      bestMove = move;
    }
  }

  return bestMove;
}

function selectHardMove(
  state: BoardState,
  variant: GameVariant,
  legalMoves: number[]
): number {
  const orderedMoves = orderMoves(state, variant, legalMoves, CPU_PLAYER);
  let bestMove = orderedMoves[0];
  let bestValue = -Infinity;

  const maxDepth = variant === 'avalanche' ? 4 : variant === 'oware' ? 5 : 6;
  let lastCompletedMove = orderedMoves[0];
  let lastCompletedValue = -Infinity;

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

      const nextState = makeMoveForVariant(state, variant, move);
      const value = minimax(
        nextState, variant, d - 1, -Infinity, Infinity,
        nextState.turn === CPU_PLAYER, true
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
    lastCompletedValue = currentBestValue;
  }

  return lastCompletedMove;
}

function minimax(
  state: BoardState,
  variant: GameVariant,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  useOrdering: boolean
): number {
  incrementNodeCount();
  if (checkBudget()) {
    return evaluateBoard(state, variant);
  }

  if (depth === 0 || state.isGameOver) {
    return evaluateBoard(state, variant);
  }

  const currentPlayer: Player = isMaximizing ? 1 : 0;
  let moves = getLegalMovesForVariant(state, variant, currentPlayer);

  if (moves.length === 0) {
    return evaluateBoard(state, variant);
  }

  if (useOrdering && moves.length > 1) {
    moves = orderMoves(state, variant, moves, currentPlayer);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      if (checkBudget()) break;
      const nextState = makeMoveForVariant(state, variant, move);
      const nextDepth = depth - 1;
      const evalVal = minimax(nextState, variant, nextDepth, alpha, beta, nextState.turn === CPU_PLAYER, useOrdering);
      maxEval = Math.max(maxEval, evalVal);
      alpha = Math.max(alpha, evalVal);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      if (checkBudget()) break;
      const nextState = makeMoveForVariant(state, variant, move);
      const nextDepth = depth - 1;
      const evalVal = minimax(nextState, variant, nextDepth, alpha, beta, nextState.turn === CPU_PLAYER, useOrdering);
      minEval = Math.min(minEval, evalVal);
      beta = Math.min(beta, evalVal);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function getBestCpuMove(
  state: BoardState,
  variant: GameVariant,
  difficulty: Difficulty
): number | null {
  const legalMoves = getLegalMovesForVariant(state, variant, CPU_PLAYER);
  if (legalMoves.length === 0) return null;
  if (legalMoves.length === 1) return legalMoves[0];

  if (difficulty === 'easy') {
    return selectEasyMove(state, variant, legalMoves);
  } else if (difficulty === 'medium') {
    return selectMinimaxMove(state, variant, 2, false);
  } else {
    resetNodeCount();
    return selectHardMove(state, variant, legalMoves);
  }
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, state, variant, difficulty, id } = event.data;
  
  if (type === 'GET_BEST_MOVE') {
    const move = getBestCpuMove(state, variant, difficulty);
    const response: WorkerResponse = {
      type: 'BEST_MOVE',
      move,
      id
    };
    self.postMessage(response);
  }
};

export type { WorkerMessage, WorkerResponse };