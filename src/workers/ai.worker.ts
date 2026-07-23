import type { BoardState, GameVariant, Difficulty } from '../lib/types';
import { engineGetBestCpuMove } from '../lib/ai-engine';

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
  return nodeCount > 8_000;
}

function getBestCpuMove(state: BoardState, variant: GameVariant, difficulty: Difficulty): number | null {
  return engineGetBestCpuMove(state, variant, difficulty, checkBudget, resetNodeCount);
}

self.onmessage = (event: MessageEvent) => {
  const { type, state, variant, difficulty, id } = event.data;

  if (type === 'GET_BEST_MOVE') {
    try {
      const move = getBestCpuMove(state, variant, difficulty);
      const response: WorkerResponse = {
        type: 'BEST_MOVE',
        move,
        id
      };
      self.postMessage(response);
    } catch {
      self.postMessage({ type: 'BEST_MOVE', move: null, id } as WorkerResponse);
    }
  }
};

export type { WorkerMessage, WorkerResponse };
