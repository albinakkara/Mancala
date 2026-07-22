import type { BoardState, GameVariant, Difficulty, Player } from './types';
import { getLegalKalahMoves, makeKalahMove, KALAH_P1_PITS } from './kalah';
import { getLegalAvalancheMoves, makeAvalancheMove } from './avalanche';
import { getLegalOwareMoves, makeOwareMove, OWARE_P1_PITS } from './oware';

const CPU_PLAYER: Player = 1;

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
    return selectMinimaxMove(state, variant, 2);
  } else {
    // Hard mode — use conservative depths per variant to avoid freezing
    // Avalanche has cascading loops making each node very expensive
    // Oware has feed-rule overhead per node
    const depth = variant === 'avalanche' ? 2 : variant === 'oware' ? 2 : 3;
    return selectMinimaxMove(state, variant, depth);
  }
}

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

function selectMinimaxMove(state: BoardState, variant: GameVariant, depth: number): number {
  const legalMoves = getLegalMovesForVariant(state, variant, CPU_PLAYER);
  let bestMove = legalMoves[0];
  let bestValue = -Infinity;

  for (const move of legalMoves) {
    const nextState = makeMoveForVariant(state, variant, move);
    // Always decrement depth by at least 1, even on extra turns,
    // to prevent exponential blowup (especially for Avalanche cascades)
    const currentDepth = depth - 1;
    const value = minimax(nextState, variant, currentDepth, -Infinity, Infinity, nextState.turn === CPU_PLAYER);

    if (value > bestValue) {
      bestValue = value;
      bestMove = move;
    }
  }

  return bestMove;
}

function minimax(
  state: BoardState,
  variant: GameVariant,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || state.isGameOver) {
    return evaluateBoard(state, variant);
  }

  const currentPlayer: Player = isMaximizing ? 1 : 0;
  const moves = getLegalMovesForVariant(state, variant, currentPlayer);

  if (moves.length === 0) {
    return evaluateBoard(state, variant);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const nextState = makeMoveForVariant(state, variant, move);
      // Always decrement depth by at least 1, even on extra turns
      const nextDepth = depth - 1;

      const evalVal = minimax(nextState, variant, nextDepth, alpha, beta, nextState.turn === CPU_PLAYER);
      maxEval = Math.max(maxEval, evalVal);
      alpha = Math.max(alpha, evalVal);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const nextState = makeMoveForVariant(state, variant, move);
      // Always decrement depth by at least 1, even on extra turns
      const nextDepth = depth - 1;

      const evalVal = minimax(nextState, variant, nextDepth, alpha, beta, nextState.turn === CPU_PLAYER);
      minEval = Math.min(minEval, evalVal);
      beta = Math.min(beta, evalVal);
      if (beta <= alpha) break;
    }
    return minEval;
  }
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

  // Extra turn value
  if (state.extraTurn && state.turn === 1) {
    evalScore += 40;
  } else if (state.extraTurn && state.turn === 0) {
    evalScore -= 40;
  }

  // Board positional weights
  if (variant === 'kalah' || variant === 'avalanche') {
    const cpuPits = KALAH_P1_PITS;
    const playerPits = [0, 1, 2, 3, 4, 5];

    // Give bonus for seeds on CPU side
    const cpuSeedsOnBoard = cpuPits.reduce((acc, p) => acc + state.pits[p], 0);
    const playerSeedsOnBoard = playerPits.reduce((acc, p) => acc + state.pits[p], 0);
    evalScore += (cpuSeedsOnBoard - playerSeedsOnBoard) * 2;

    // Check for pits that can land directly into CPU store (pit 13)
    cpuPits.forEach((p) => {
      const seeds = state.pits[p];
      const distToStore = 13 - p;
      if (seeds === distToStore) {
        evalScore += 15; // Setup for extra turn
      }
    });
  } else if (variant === 'oware') {
    const cpuPits = OWARE_P1_PITS;
    const playerPits = [0, 1, 2, 3, 4, 5];

    // Encourage keeping 1 or 2 seeds on player side to setup captures
    playerPits.forEach((p) => {
      if (state.pits[p] === 1 || state.pits[p] === 2) {
        evalScore += 10; // Potential target for CPU harvest
      }
    });
  }

  return evalScore;
}
