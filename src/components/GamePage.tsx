import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { MancalaBoard } from './MancalaBoard';
import { Footer } from './Footer';
import type { GameVariant, GameMode, Difficulty, Player } from '../lib/types';

interface GamePageProps {
  initialVariant?: GameVariant;
}

export const GamePage: React.FC<GamePageProps> = ({ initialVariant = 'kalah' }) => {
  const [selectedVariant, setSelectedVariant] = useState<GameVariant>(initialVariant);
  const [resetKey, setResetKey] = useState(0);

  const handleGameEnd = (winner: Player | 'draw', variant: GameVariant, mode: GameMode, difficulty: Difficulty) => {
    if (typeof window === 'undefined') return;
    const existingStr = localStorage.getItem('onlinemancala_stats');
    let stats = {
      kalah: { wins: 0, losses: 0, draws: 0 },
      avalanche: { wins: 0, losses: 0, draws: 0 },
      oware: { wins: 0, losses: 0, draws: 0 },
    };

    if (existingStr) {
      try {
        stats = JSON.parse(existingStr);
      } catch (e) { }
    }

    if (winner === 0) stats[variant].wins += 1;
    else if (winner === 1) stats[variant].losses += 1;
    else stats[variant].draws += 1;

    localStorage.setItem('onlinemancala_stats', JSON.stringify(stats));
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar
        currentVariant={selectedVariant}
        onResetGame={() => setResetKey((prev) => prev + 1)}
      />

      {/* LIVE GAME BOARD SECTION */}
      <section className="py-8 sm:py-12 bg-[#fafafa] flex-1">
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <span className="font-mono-code text-[10px] sm:text-xs text-[#0070f3] font-bold uppercase tracking-wider">
                ACTIVE MATCH
              </span>
              <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-[#171717] capitalize">
                Playing {selectedVariant === 'oware' ? 'Oware / Awale' : selectedVariant} Mancala
              </h2>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {(['kalah', 'avalanche', 'oware'] as const).map((v) => (
                <a
                  key={v}
                  href={`/${v}`}
                  className={`rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold border transition ${selectedVariant === v
                      ? 'bg-black text-white border-black shadow-sm'
                      : 'bg-white text-[#4d4d4d] border-[#ebebeb] hover:border-black'
                    }`}
                >
                  {v.toUpperCase()}
                </a>
              ))}
            </div>
          </div>

          <MancalaBoard key={`${selectedVariant}-${resetKey}`} variant={selectedVariant} onGameEnd={handleGameEnd} />
        </div>
      </section>

      <Footer />
    </div>
  );
};
