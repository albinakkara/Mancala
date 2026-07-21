import React, { useEffect, useState } from 'react';
import { X, Trophy, RefreshCcw, Award, Percent } from 'lucide-react';
import type { GameStats } from '../lib/types';

interface StatsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatsDrawer: React.FC<StatsDrawerProps> = ({ isOpen, onClose }) => {
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
  }, [isOpen]);

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

  if (!isOpen) return null;

  const calculateWinRate = (wins: number, losses: number, draws: number) => {
    const total = wins + losses + draws;
    if (total === 0) return '0%';
    return `${Math.round((wins / total) * 100)}%`;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative h-full w-full max-w-md border-l border-[#ebebeb] bg-white p-6 shadow-2xl transition-all flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#ebebeb] pb-4 mb-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#0070f3]" />
              <h3 className="text-lg font-bold text-[#171717]">Player Statistics</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#666] hover:bg-[#f5f5f5] hover:text-black transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stats Breakdown */}
          <div className="space-y-4">
            {(['kalah', 'avalanche', 'oware'] as const).map((variant) => {
              const data = stats[variant];
              const total = data.wins + data.losses + data.draws;
              const winRate = calculateWinRate(data.wins, data.losses, data.draws);
              const names = {
                kalah: 'Kalah',
                avalanche: 'Avalanche Mancala',
                oware: 'Oware / Awale',
              };

              return (
                <div
                  key={variant}
                  className="rounded-xl border border-[#ebebeb] bg-[#fafafa] p-4 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-[#171717]">
                      {names[variant]}
                    </span>
                    <span className="font-mono-code text-xs text-[#0070f3] font-bold">
                      Win Rate: {winRate}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center mt-3">
                    <div className="rounded bg-white p-2 border border-[#ebebeb]">
                      <span className="block font-mono-code text-[10px] text-[#888888]">PLAYED</span>
                      <span className="font-mono-code text-sm font-bold text-[#171717]">{total}</span>
                    </div>
                    <div className="rounded bg-white p-2 border border-[#ebebeb]">
                      <span className="block font-mono-code text-[10px] text-[#0070f3]">WINS</span>
                      <span className="font-mono-code text-sm font-bold text-[#0070f3]">{data.wins}</span>
                    </div>
                    <div className="rounded bg-white p-2 border border-[#ebebeb]">
                      <span className="block font-mono-code text-[10px] text-[#ee0000]">LOSSES</span>
                      <span className="font-mono-code text-sm font-bold text-[#ee0000]">{data.losses}</span>
                    </div>
                    <div className="rounded bg-white p-2 border border-[#ebebeb]">
                      <span className="block font-mono-code text-[10px] text-[#888888]">DRAWS</span>
                      <span className="font-mono-code text-sm font-bold text-[#666]">{data.draws}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-[#ebebeb] pt-4 flex items-center justify-between">
          <button
            onClick={clearStats}
            className="flex items-center gap-1.5 text-xs text-[#888888] hover:text-[#ee0000] transition"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Reset Stats
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-black px-4 py-2 text-xs font-medium text-white hover:bg-[#333] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
