import type { BoardState, Player, MoveRecord } from './types';

export const KALAH_P0_PITS = [0, 1, 2, 3, 4, 5];
export const KALAH_P1_PITS = [7, 8, 9, 10, 11, 12];
export const KALAH_P0_STORE = 6;
export const KALAH_P1_STORE = 13;

export function createInitialKalahState(seedsPerPit: number = 4): BoardState {
  const pits = new Array(14).fill(seedsPerPit);
  pits[KALAH_P0_STORE] = 0;
  pits[KALAH_P1_STORE] = 0;

  return {
    pits,
    scores: [0, 0],
    turn: 0,
    isGameOver: false,
    winner: null,
    lastSownPit: null,
    extraTurn: false,
    statusMessage: "Player 1's turn. Choose a pit to sow seeds.",
    moveHistory: [],
  };
}

export function getLegalKalahMoves(state: BoardState, player: Player): number[] {
  if (state.isGameOver) return [];
  const playerPits = player === 0 ? KALAH_P0_PITS : KALAH_P1_PITS;
  return playerPits.filter((pit) => state.pits[pit] > 0);
}

export function makeKalahMove(state: BoardState, chosenPit: number): BoardState {
  const legalMoves = getLegalKalahMoves(state, state.turn);
  if (!legalMoves.includes(chosenPit)) {
    return state;
  }

  const newPits = [...state.pits];
  let seeds = newPits[chosenPit];
  newPits[chosenPit] = 0;

  const currentTurn = state.turn;
  const opponentStore = currentTurn === 0 ? KALAH_P1_STORE : KALAH_P0_STORE;
  const ownStore = currentTurn === 0 ? KALAH_P0_STORE : KALAH_P1_STORE;
  const ownPits = currentTurn === 0 ? KALAH_P0_PITS : KALAH_P1_PITS;

  let currentPit = chosenPit;
  while (seeds > 0) {
    currentPit = (currentPit + 1) % 14;
    if (currentPit === opponentStore) {
      continue; // Skip opponent store
    }
    newPits[currentPit] += 1;
    seeds -= 1;
  }

  let capturedCount = 0;
  let capturedPitsIndices: number[] = [];
  let getExtraTurn = false;

  // Check extra turn rule
  if (currentPit === ownStore) {
    getExtraTurn = true;
  }
  // Check capture rule: landed in empty pit on own side & opposite pit has seeds
  else if (ownPits.includes(currentPit) && newPits[currentPit] === 1) {
    const oppositePit = 12 - currentPit;
    if (newPits[oppositePit] > 0) {
      capturedCount = newPits[oppositePit] + 1;
      capturedPitsIndices = [currentPit, oppositePit];
      newPits[ownStore] += capturedCount;
      newPits[oppositePit] = 0;
      newPits[currentPit] = 0;
    }
  }

  // Check for game completion (if either side is empty)
  const p0Empty = KALAH_P0_PITS.every((pit) => newPits[pit] === 0);
  const p1Empty = KALAH_P1_PITS.every((pit) => newPits[pit] === 0);

  let isGameOver = false;
  let winner: Player | 'draw' | null = null;
  let nextTurn: Player = getExtraTurn ? currentTurn : (currentTurn === 0 ? 1 : 0);

  if (p0Empty || p1Empty) {
    isGameOver = true;
    // Sweep remaining seeds to owner stores
    if (p0Empty) {
      const remainingP1 = KALAH_P1_PITS.reduce((sum, p) => sum + newPits[p], 0);
      KALAH_P1_PITS.forEach((p) => (newPits[p] = 0));
      newPits[KALAH_P1_STORE] += remainingP1;
    }
    if (p1Empty) {
      const remainingP0 = KALAH_P0_PITS.reduce((sum, p) => sum + newPits[p], 0);
      KALAH_P0_PITS.forEach((p) => (newPits[p] = 0));
      newPits[KALAH_P0_STORE] += remainingP0;
    }

    const finalP0 = newPits[KALAH_P0_STORE];
    const finalP1 = newPits[KALAH_P1_STORE];
    if (finalP0 > finalP1) winner = 0;
    else if (finalP1 > finalP0) winner = 1;
    else winner = 'draw';
  }

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const moveRecord: MoveRecord = {
    player: currentTurn,
    pitIndex: chosenPit,
    seedsSown: state.pits[chosenPit],
    captured: capturedCount,
    capturedPits: capturedCount > 0 ? capturedPitsIndices : undefined,
    extraTurn: getExtraTurn,
    timestamp: timeStr,
  };

  let statusMsg = "";
  if (isGameOver) {
    if (winner === 'draw') statusMsg = "Game Over! It's a tie!";
    else statusMsg = `Game Over! Player ${winner === 0 ? '1' : '2 (CPU)'} wins!`;
  } else if (getExtraTurn) {
    statusMsg = `Player ${currentTurn === 0 ? '1' : '2 (CPU)'} landed in store — Extra Turn!`;
  } else if (capturedCount > 0) {
    statusMsg = `Player ${currentTurn === 0 ? '1' : '2 (CPU)'} captured ${capturedCount} seeds!`;
  } else {
    statusMsg = `Player ${nextTurn === 0 ? '1' : '2 (CPU)'}'s turn.`;
  }

  return {
    pits: newPits,
    scores: [newPits[KALAH_P0_STORE], newPits[KALAH_P1_STORE]],
    turn: nextTurn,
    isGameOver,
    winner,
    lastSownPit: currentPit,
    extraTurn: getExtraTurn,
    statusMessage: statusMsg,
    moveHistory: [moveRecord, ...state.moveHistory],
  };
}
