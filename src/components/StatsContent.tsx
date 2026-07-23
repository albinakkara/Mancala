import React, { useEffect, useState } from 'react';
import { Trophy, RefreshCcw, Home } from 'lucide-react';
import type { GameStats } from '../lib/types';

export const StatsContent: React.FC = () => {
  const [stats, setStats] = useState<GameStats>({
    kalah: { wins: 0, losses: 0, draws: 0 },
    avalanche: { wins: 0, losses: 0, draws: 0 },
    oware: { wins: 0, losses: 0, draws: 0 },
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('onlinemancala_stats');
      if (saved) {
        try {
          setStats(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const clearStats = () => {
    const empty: GameStats = {
      kalah: { wins: 0, losses: 0, draws: 0 },
      avalanche: { wins: 0, losses: 0, draws: 0 },
      oware: { wins: 0, losses: 0, draws: 0 },
    };
    setStats(empty);
    if (typeof window !== 'undefined') {
      localStorage.setItem('onlinemancala_stats', JSON.stringify(empty));
    }
  };

  const calculateWinRate = (wins: number, losses: number, draws: number) => {
    const total = wins + losses + draws;
    if (total === 0) return '0%';
    return `${Math.round((wins / total) * 100)}%`;
  };

  const totalGames = stats.kalah.wins + stats.kalah.losses + stats.kalah.draws +
    stats.avalanche.wins + stats.avalanche.losses + stats.avalanche.draws +
    stats.oware.wins + stats.oware.losses + stats.oware.draws;

  const totalWins = stats.kalah.wins + stats.avalanche.wins + stats.oware.wins;
  const overallWinRate = calculateWinRate(
    stats.kalah.wins + stats.avalanche.wins + stats.oware.wins,
    stats.kalah.losses + stats.avalanche.losses + stats.oware.losses,
    stats.kalah.draws + stats.avalanche.draws + stats.oware.draws
  );

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Trophy className="h-6 w-6 text-[#0070f3]" />
          <h1 className="text-3xl font-bold tracking-tight text-[#171717]">
            Player Statistics
          </h1>
        </div>
        <p className="text-sm text-[#888888] max-w-2xl mx-auto">
          Track your performance across all Mancala variants. Win rates, total games, and more.
        </p>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-[#ebebeb] bg-white p-6 text-center">
          <span className="font-mono-code text-xs text-[#888888]">TOTAL GAMES</span>
          <span className="block font-mono-code text-3xl font-bold text-[#171717] mt-1">
            {totalGames}
          </span>
        </div>
        <div className="rounded-xl border border-[#ebebeb] bg-white p-6 text-center">
          <span className="font-mono-code text-xs text-[#888888]">TOTAL WINS</span>
          <span className="block font-mono-code text-3xl font-bold text-[#0070f3] mt-1">
            {totalWins}
          </span>
        </div>
        <div className="rounded-xl border border-[#ebebeb] bg-white p-6 text-center">
          <span className="font-mono-code text-xs text-[#888888]">OVERALL WIN RATE</span>
          <span className="block font-mono-code text-3xl font-bold text-[#7928ca] mt-1">
            {overallWinRate}
          </span>
        </div>
      </div>

      {/* Variant Stats */}
      <div className="space-y-6">
        {(['kalah', 'avalanche', 'oware'] as const).map((variant) => {
          const data = stats[variant];
          const total = data.wins + data.losses + data.draws;
          const winRate = calculateWinRate(data.wins, data.losses, data.draws);
          const names = {
            kalah: 'Kalah',
            avalanche: 'Avalanche Mancala',
            oware: 'Oware / Awale',
          } as const;
          const colors = {
            kalah: 'text-[#0070f3]',
            avalanche: 'text-[#7928ca]',
            oware: 'text-[#eb367f]',
          };

          return (
            <div
              key={variant}
              className="rounded-xl border border-[#ebebeb] bg-white p-6 transition"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${colors[variant].replace('text-', 'bg-')}`} />
                  <span className="font-semibold text-lg text-[#171717]">
                    {names[variant]}
                  </span>
                </div>
                <span className={`font-mono-code text-sm font-bold ${colors[variant]}`}>
                  Win Rate: {winRate}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="rounded-lg bg-[#fafafa] p-3 border border-[#ebebeb]">
                  <span className="block font-mono-code text-[10px] text-[#888888] mb-1">PLAYED</span>
                  <span className="font-mono-code text-xl font-bold text-[#171717]">{total}</span>
                </div>
                <div className="rounded-lg bg-[#fafafa] p-3 border border-[#ebebeb]">
                  <span className="block font-mono-code text-[10px] text-[#0070f3] mb-1">WINS</span>
                  <span className="font-mono-code text-xl font-bold text-[#0070f3]">{data.wins}</span>
                </div>
                <div className="rounded-lg bg-[#fafafa] p-3 border border-[#ebebeb]">
                  <span className="block font-mono-code text-[10px] text-[#ee0000] mb-1">LOSSES</span>
                  <span className="font-mono-code text-xl font-bold text-[#ee0000]">{data.losses}</span>
                </div>
                <div className="rounded-lg bg-[#fafafa] p-3 border border-[#ebebeb]">
                  <span className="block font-mono-code text-[10px] text-[#888888] mb-1">DRAWS</span>
                  <span className="font-mono-code text-xl font-bold text-[#666]">{data.draws}</span>
                </div>
              </div>

              {/* Progress Bar */}
              {total > 0 && (
                <div className="mt-4 h-2 rounded-full bg-[#ebebeb] overflow-hidden flex">
                  <div
                    className="h-full bg-[#0070f3] transition-all duration-500"
                    style={{ width: `${(data.wins / total) * 100}%` }}
                  />
                  <div
                    className="h-full bg-[#ee0000] transition-all duration-500"
                    style={{ width: `${(data.losses / total) * 100}%` }}
                  />
                  <div
                    className="h-full bg-[#666] transition-all duration-500"
                    style={{ width: `${(data.draws / total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reset Button */}
      <div className="mt-8 pt-6 border-t border-[#ebebeb] flex items-center justify-between">
        <button
          onClick={clearStats}
          className="flex items-center gap-1.5 text-xs text-[#888888] hover:text-[#ee0000] transition"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          Reset All Stats
        </button>
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-1.5 rounded-lg border border-[#ebebeb] px-4 py-2 text-xs font-medium text-[#171717] hover:bg-[#f5f5f5] transition"
          >
            <Home className="h-3.5 w-3.5" />
            Back to Home
          </a>
          <a
            href="/play"
            className="flex items-center gap-1.5 rounded-lg bg-[#171717] px-4 py-2 text-xs font-medium text-white hover:bg-black transition"
          >
            Back to Game
          </a>
        </div>
      </div>
    </div>
  );
};
