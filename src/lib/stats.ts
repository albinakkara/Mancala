import type { GameStats, Player, GameVariant, GameMode, Difficulty } from './types';

const STATS_KEY = 'onlinemancala_stats';

function getInitialStats(): GameStats {
  return {
    kalah: { wins: 0, losses: 0, draws: 0 },
    avalanche: { wins: 0, losses: 0, draws: 0 },
    oware: { wins: 0, losses: 0, draws: 0 },
  };
}

export function loadStats(): GameStats {
  if (typeof window === 'undefined') return getInitialStats();
  const existingStr = localStorage.getItem(STATS_KEY);
  if (!existingStr) return getInitialStats();
  try {
    return JSON.parse(existingStr);
  } catch {
    return getInitialStats();
  }
}

export function saveStats(stats: GameStats): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function recordGameEnd(
  winner: Player | 'draw',
  variant: GameVariant,
  _mode: GameMode,
  _difficulty: Difficulty
): void {
  const stats = loadStats();
  if (winner === 0) stats[variant].wins += 1;
  else if (winner === 1) stats[variant].losses += 1;
  else stats[variant].draws += 1;
  saveStats(stats);
}
