import type { BoardState, GameVariant, Difficulty, Player } from './types';
import { getLegalKalahMoves, makeKalahMove, KALAH_P1_PITS, KALAH_P0_PITS } from './kalah';
import { getLegalAvalancheMoves, makeAvalancheMove } from './avalanche';
import { getLegalOwareMoves, makeOwareMove, OWARE_P1_PITS, OWARE_P0_PITS } from './oware';

const CPU_PLAYER: Player = 1;

// ── Node budget for performance safety ──
// Hard mode will stop searching if it exceeds this many nodes in a single turn.
// This guarantees the UI never freezes regardless of position complexity.
const NODE_BUDGET_HARD = 8_000;
let nodeCount = 0;

export function getLegalMovesForVariant(state: BoardState, variant: GameVariant, player: Player): number[] {
  if (variant === 'kalah') return getLegalKalahMoves(state, player);
  if (variant === 'avalanche') return getLegalAvalancheMoves(state, player);
  return getLegalOwareMoves(state, player);
}

export function makeMoveForVariant(state: BoardState, variant: GameVariant, pit: number): BoardState {
  if (variant === 'kalah') return makeKalahMove(state, pit);
  if (variant === 'avalanche') return makeAvalancheMove(state, pit);
  return makeOwareMove(state, pit);
}

export function getBestCpuMove(
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
    // ── Hard mode: iterative deepening with node budget ──
    // Uses move ordering to maximize alpha-beta pruning efficiency.
    // Iterative deepening means we try depth 2, then 3, then 4...
    // If we exceed the node budget mid-search, we return the best
    // move found from the last COMPLETED depth. This auto-adapts:
    //   - Simple positions → deeper search (depth 5-6+)
    //   - Complex positions → shallower search (depth 2-3)
    //   - NEVER freezes the UI
    nodeCount = 0;
    return selectHardMove(state, variant, legalMoves);
  }
}

// ── Easy mode (unchanged) ──

function selectEasyMove(state: BoardState, variant: GameVariant, legalMoves: number[]): number {
  // 70% random, 30% simple greedy
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

// ── Medium mode (unchanged, no move ordering) ──

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

// ── Hard mode: iterative deepening ──

function selectHardMove(
  state: BoardState,
  variant: GameVariant,
  legalMoves: number[]
): number {
  // Order moves once at the root — this gives us a good fallback
  const orderedMoves = orderMoves(state, variant, legalMoves, CPU_PLAYER);
  let bestMove = orderedMoves[0];
  let bestValue = -Infinity;

  // Maximum depth to attempt (will stop early if node budget exceeded)
  const maxDepth = variant === 'avalanche' ? 4 : variant === 'oware' ? 5 : 6;
  let completedDepth = 0;

  // We store the best result from the latest completed depth
  let lastCompletedMove = orderedMoves[0];
  let lastCompletedValue = -Infinity;

  for (let d = 2; d <= maxDepth; d++) {
    // Check if we already exceeded the budget from a previous iteration
    // (unlikely since each iteration starts fresh, but safe)
    nodeCount = 0;
    let currentBestMove = orderedMoves[0];
    let currentBestValue = -Infinity;
    let budgetExceeded = false;

    for (const move of orderedMoves) {
      if (nodeCount > NODE_BUDGET_HARD) {
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
      // Node budget hit — return best from previous completed depth
      break;
    }

    // This depth completed successfully — save as fallback
    lastCompletedMove = currentBestMove;
    lastCompletedValue = currentBestValue;
    completedDepth = d;
  }

  return lastCompletedMove;
}

// ── Move ordering: sort moves so promising ones are searched first ──
// This dramatically improves alpha-beta pruning efficiency.
// Good moves first → more pruning → can search deeper in same time.

function orderMoves(
  state: BoardState,
  variant: GameVariant,
  moves: number[],
  player: Player
): number[] {
  return [...moves].sort((a, b) => {
    const scoreA = quickEvaluateMove(state, variant, a, player);
    const scoreB = quickEvaluateMove(state, variant, b, player);
    return scoreB - scoreA; // descending (best first)
  });
}

function quickEvaluateMove(
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

    // Move lands in own store → extra turn (high priority)
    if (seeds === distToStore) {
      score += 1000;
    }

    // Move captures (only in Kalah)
    if (variant === 'kalah') {
      const oppPit = 12 - pit; // opposite pit
      if (seeds === distToStore - 1 && state.pits[oppPit] > 0) {
        score += 800; // capture setup
      }
    }

    // More seeds = more sowing power (cascades in Avalanche)
    score += seeds * 5;

    // Penalize picking from a pit with only 1 seed (usually suboptimal)
    if (seeds === 1) {
      score -= 10;
    }
  }

  if (variant === 'oware') {
    const oppPits = player === 1 ? OWARE_P0_PITS : OWARE_P1_PITS;
    const landingPit = (pit + seeds) % 12;

    // Move that captures on last pit
    if (oppPits.includes(landingPit)) {
      const landingCount = state.pits[landingPit] + 1; // +1 because we sow 1 there
      if (landingCount === 2 || landingCount === 3) {
        score += 1000;
      }
    }

    // Prefer moves that sow into opponent territory
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

// ── Minimax with alpha-beta pruning ──

function minimax(
  state: BoardState,
  variant: GameVariant,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  useOrdering: boolean
): number {
  // Budget check
  nodeCount++;
  if (nodeCount > NODE_BUDGET_HARD) {
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

  // Order moves for much better alpha-beta pruning (only in hard mode)
  if (useOrdering && moves.length > 1) {
    moves = orderMoves(state, variant, moves, currentPlayer);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      if (nodeCount > NODE_BUDGET_HARD) break;
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
      if (nodeCount > NODE_BUDGET_HARD) break;
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

// ── Enhanced evaluation function ──

function evaluateBoard(state: BoardState, variant: GameVariant): number {
  const cpuScore = state.scores[1];
  const playerScore = state.scores[0];

  let evalScore = (cpuScore - playerScore) * 100;

  if (state.isGameOver) {
    if (state.winner === 1) return 10000 + cpuScore;
    if (state.winner === 0) return -10000 - playerScore;
    return 0;
  }

  // Extra turn value
  if (state.extraTurn && state.turn === 1) {
    evalScore += 40;
  } else if (state.extraTurn && state.turn === 0) {
    evalScore -= 40;
  }

  // ── Variant-specific positional evaluation ──
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

  // Seeds-on-board advantage
  const cpuSeeds = cpuPits.reduce((acc, p) => acc + state.pits[p], 0);
  const playerSeeds = playerPits.reduce((acc, p) => acc + state.pits[p], 0);
  score += (cpuSeeds - playerSeeds) * 2;

  // Reward pits that can land directly into CPU store (extra turn setup)
  for (const p of cpuPits) {
    const seeds = state.pits[p];
    const distToStore = 13 - p;
    if (seeds === distToStore) {
      score += 25;
    }
    // Reward having multiple seeds (capture potential)
    if (seeds >= 4) {
      score += 3;
    }
    // Penalize single-seed pits (vulnerable to capture)
    if (seeds === 1 && p !== 12) {
      score -= 8;
    }
  }

  // Check opponent vulnerability (opponent pits with 1 seed that CPU can capture)
  for (const p of playerPits) {
    if (state.pits[p] === 1) {
      const cpuOpposite = 12 - p;
      if (cpuPits.includes(cpuOpposite) && state.pits[cpuOpposite] > 0) {
        // CPU can capture this — reward
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

  // In Avalanche, bigger pits are valuable (cascading bonus)
  for (const p of cpuPits) {
    const seeds = state.pits[p];
    const distToStore = 13 - p;
    // Direct store landing
    if (seeds === distToStore) {
      score += 25;
    }
    // Larger seed counts = more cascading potential
    if (seeds >= 6) {
      score += 10;
    } else if (seeds >= 4) {
      score += 4;
    }
    // Penalize single seeds
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

  // Seeds on CPU side are safe; seeds on opponent side are at risk
  const cpuSeeds = cpuPits.reduce((acc, p) => acc + state.pits[p], 0);
  const playerSeeds = playerPits.reduce((acc, p) => acc + state.pits[p], 0);
  score += (cpuSeeds - playerSeeds) * 1; // subtle preference

  // Reward having 2 or 3 seeds on opponent side (CPU can capture)
  for (const p of playerPits) {
    const s = state.pits[p];
    if (s === 2 || s === 3) {
      score += 12; // Ripe for capture
    }
  }

  // Reward CPU having varied seed counts (more flexible play)
  for (const p of cpuPits) {
    const s = state.pits[p];
    if (s >= 3 && s <= 6) {
      score += 3; // Good range for tactical sowing
    }
  }

  return score;
}

