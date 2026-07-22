import type { BoardState, Player, MoveRecord } from './types';

export const OWARE_P0_PITS = [0, 1, 2, 3, 4, 5];
export const OWARE_P1_PITS = [6, 7, 8, 9, 10, 11];

export function createInitialOwareState(): BoardState {
  return {
    pits: new Array(12).fill(4), // 12 pits * 4 seeds = 48 total seeds
    scores: [0, 0],
    turn: 0,
    isGameOver: false,
    winner: null,
    lastSownPit: null,
    extraTurn: false,
    statusMessage: "Oware / Awale! Sow seeds counter-clockwise to harvest 2 or 3 seeds on opponent side.",
    moveHistory: [],
  };
}

export function getLegalOwareMoves(state: BoardState, player: Player): number[] {
  if (state.isGameOver) return [];
  const ownPits = player === 0 ? OWARE_P0_PITS : OWARE_P1_PITS;
  const oppPits = player === 0 ? OWARE_P1_PITS : OWARE_P0_PITS;

  const nonPits = ownPits.filter((pit) => state.pits[pit] > 0);
  const oppHasSeeds = oppPits.some((pit) => state.pits[pit] > 0);

  // If opponent has no seeds, player MUST play a move that feeds opponent if possible
  if (!oppHasSeeds) {
    const feedingMoves = nonPits.filter((pit) => {
      const seeds = state.pits[pit];
      // Check if sowing reaches opp territory
      let dist = 0;
      let curr = pit;
      while (dist < seeds) {
        curr = (curr + 1) % 12;
        if (curr !== pit) dist++;
        if (oppPits.includes(curr)) return true;
      }
      return false;
    });

    if (feedingMoves.length > 0) {
      return feedingMoves;
    }
  }

  return nonPits;
}

export function makeOwareMove(state: BoardState, chosenPit: number): BoardState {
  const legalMoves = getLegalOwareMoves(state, state.turn);
  if (!legalMoves.includes(chosenPit)) {
    return state;
  }

  let newPits = [...state.pits];
  const newScores: [number, number] = [...state.scores];
  const currentTurn = state.turn;
  const oppPits = currentTurn === 0 ? OWARE_P1_PITS : OWARE_P0_PITS;

  let handSeeds = newPits[chosenPit];
  newPits[chosenPit] = 0;

  const originalHandSeeds = handSeeds;
  let currentPit = chosenPit;

  // Sow seeds counter-clockwise (skipping origin pit if hand >= 12)
  while (handSeeds > 0) {
    currentPit = (currentPit + 1) % 12;
    if (currentPit === chosenPit) continue; // Skip starting pit on full rounds
    newPits[currentPit] += 1;
    handSeeds -= 1;
  }

  // Calculate potential captures backwards from last sown pit
  let tempPits = [...newPits];
  let capturedCount = 0;
  let scanPit = currentPit;

  const capturedPitsIndices: number[] = [];

  while (oppPits.includes(scanPit)) {
    const count = tempPits[scanPit];
    if (count === 2 || count === 3) {
      capturedCount += count;
      capturedPitsIndices.push(scanPit);
      tempPits[scanPit] = 0;
      scanPit = (scanPit - 1 + 12) % 12;
    } else {
      break;
    }
  }

  // Check Grand Slam Rule: if capture takes ALL seeds from opponent side, capture is illegal!
  const remainingOppSeeds = oppPits.reduce((sum, p) => sum + tempPits[p], 0);
  let grandSlamDisallowed = false;

  if (capturedCount > 0 && remainingOppSeeds === 0) {
    // Grand Slam! Disallow capture, keep original sowings
    grandSlamDisallowed = true;
    capturedCount = 0;
  } else if (capturedCount > 0) {
    // Apply capture to real pits and add to score
    newPits = tempPits;
    newScores[currentTurn] += capturedCount;
  }

  // Next turn (Oware never has extra turn from store)
  const nextTurn: Player = currentTurn === 0 ? 1 : 0;

  // Check Game Over conditions
  let isGameOver = false;
  let winner: Player | 'draw' | null = null;

  // Condition 1: Player reaches 25+ seeds (majority of 48)
  if (newScores[0] >= 25) {
    isGameOver = true;
    winner = 0;
  } else if (newScores[1] >= 25) {
    isGameOver = true;
    winner = 1;
  } else if (newScores[0] === 24 && newScores[1] === 24) {
    isGameOver = true;
    winner = 'draw';
  } else {
    // Condition 2: Next player has no legal moves (starvation)
    const nextPlayerLegalMoves = getLegalOwareMoves({ ...state, pits: newPits, scores: newScores }, nextTurn);
    if (nextPlayerLegalMoves.length === 0) {
      isGameOver = true;
      // Next player cannot move: current player sweeps remaining seeds
      const remainingSeeds = newPits.reduce((sum, val) => sum + val, 0);
      newScores[currentTurn] += remainingSeeds;
      newPits.fill(0);

      if (newScores[0] > newScores[1]) winner = 0;
      else if (newScores[1] > newScores[0]) winner = 1;
      else winner = 'draw';
    }
  }

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const moveRecord: MoveRecord = {
    player: currentTurn,
    pitIndex: chosenPit,
    seedsSown: originalHandSeeds,
    captured: capturedCount,
    capturedPits: capturedCount > 0 ? capturedPitsIndices : undefined,
    extraTurn: false,
    timestamp: timeStr,
  };

  let statusMsg = "";
  if (isGameOver) {
    if (winner === 'draw') statusMsg = "Game Over! It's a tie!";
    else if (winner !== null) statusMsg = `Game Over! Player ${winner === 0 ? '1' : '2 (CPU)'} wins with ${newScores[winner]} seeds!`;
  } else if (grandSlamDisallowed) {
    statusMsg = `Grand Slam rule triggered! Capture disallowed to avoid starving opponent.`;
  } else if (capturedCount > 0) {
    statusMsg = `Player ${currentTurn === 0 ? '1' : '2 (CPU)'} captured ${capturedCount} seeds!`;
  } else {
    statusMsg = `Player ${nextTurn === 0 ? '1' : '2 (CPU)'}'s turn.`;
  }

  return {
    pits: newPits,
    scores: newScores,
    turn: nextTurn,
    isGameOver,
    winner,
    lastSownPit: currentPit,
    extraTurn: false,
    statusMessage: statusMsg,
    moveHistory: [moveRecord, ...state.moveHistory],
  };
}
