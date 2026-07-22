import type { BoardState, Player, MoveRecord } from './types';
import { KALAH_P0_PITS, KALAH_P1_PITS, KALAH_P0_STORE, KALAH_P1_STORE } from './kalah';

export function createInitialAvalancheState(seedsPerPit: number = 4): BoardState {
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
    statusMessage: "Avalanche Mancala! Sowing continues until landing in an empty pit or store.",
    moveHistory: [],
  };
}

export function getLegalAvalancheMoves(state: BoardState, player: Player): number[] {
  if (state.isGameOver) return [];
  const playerPits = player === 0 ? KALAH_P0_PITS : KALAH_P1_PITS;
  return playerPits.filter((pit) => state.pits[pit] > 0);
}

export function makeAvalancheMove(state: BoardState, chosenPit: number): BoardState {
  const legalMoves = getLegalAvalancheMoves(state, state.turn);
  if (!legalMoves.includes(chosenPit)) {
    return state;
  }

  const newPits = [...state.pits];
  const currentTurn = state.turn;
  const opponentStore = currentTurn === 0 ? KALAH_P1_STORE : KALAH_P0_STORE;
  const ownStore = currentTurn === 0 ? KALAH_P0_STORE : KALAH_P1_STORE;

  let handSeeds = newPits[chosenPit];
  const originalHandSize = handSeeds;
  newPits[chosenPit] = 0;

  let currentPit = chosenPit;
  let totalLaps = 1;
  let totalSeedsSownInMove = handSeeds;
  let extraTurnGranted = false;

  // Continuous sowing loop
  while (handSeeds > 0) {
    currentPit = (currentPit + 1) % 14;
    if (currentPit === opponentStore) {
      continue; // Skip opponent store
    }

    newPits[currentPit] += 1;
    handSeeds -= 1;

    // If hand is empty, check ending pit
    if (handSeeds === 0) {
      if (currentPit === ownStore) {
        // Ending in own store gives extra turn
        extraTurnGranted = true;
        break;
      } else if (newPits[currentPit] > 1) {
        // Landing in non-empty pit: pick up ALL seeds and keep sowing!
        handSeeds = newPits[currentPit];
        newPits[currentPit] = 0;
        totalSeedsSownInMove += handSeeds;
        totalLaps += 1;
      } else {
        // Landing in empty pit (value is 1 now): turn ends!
        break;
      }
    }
  }

  // Check end game (if either side is out of moves)
  const p0Empty = KALAH_P0_PITS.every((pit) => newPits[pit] === 0);
  const p1Empty = KALAH_P1_PITS.every((pit) => newPits[pit] === 0);

  let isGameOver = false;
  let winner: Player | 'draw' | null = null;
  let nextTurn: Player = extraTurnGranted ? currentTurn : (currentTurn === 0 ? 1 : 0);

  if (p0Empty || p1Empty) {
    isGameOver = true;
    if (p0Empty) {
      const remP1 = KALAH_P1_PITS.reduce((sum, p) => sum + newPits[p], 0);
      KALAH_P1_PITS.forEach((p) => (newPits[p] = 0));
      newPits[KALAH_P1_STORE] += remP1;
    }
    if (p1Empty) {
      const remP0 = KALAH_P0_PITS.reduce((sum, p) => sum + newPits[p], 0);
      KALAH_P0_PITS.forEach((p) => (newPits[p] = 0));
      newPits[KALAH_P0_STORE] += remP0;
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
    seedsSown: originalHandSize,
    captured: 0, // Avalanche has no capture mechanic
    extraTurn: extraTurnGranted,
    timestamp: timeStr,
  };

  let statusMsg = "";
  if (isGameOver) {
    if (winner === 'draw') statusMsg = "Game Over! It's a tie!";
    else statusMsg = `Game Over! Player ${winner === 0 ? '1' : '2 (CPU)'} wins!`;
  } else if (extraTurnGranted) {
    statusMsg = `Avalanche! Player ${currentTurn === 0 ? '1' : '2 (CPU)'} completed ${totalLaps} lap(s) and landed in store — Extra Turn!`;
  } else if (totalLaps > 1) {
    statusMsg = `Avalanche cascade! Player ${currentTurn === 0 ? '1' : '2 (CPU)'} completed ${totalLaps} sowing laps!`;
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
    extraTurn: extraTurnGranted,
    statusMessage: statusMsg,
    moveHistory: [moveRecord, ...state.moveHistory],
  };
}
