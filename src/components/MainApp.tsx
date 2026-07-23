import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { VariantCard } from './VariantCard';
import { MancalaBoard } from './MancalaBoard';
import { RulesModal } from './RulesModal';
import { StatsDrawer } from './StatsDrawer';
import { Footer } from './Footer';
import type { GameVariant, GameMode, Difficulty, Player } from '../lib/types';
import { recordGameEnd } from '../lib/stats';
import { Check } from 'lucide-react';

export const MainApp: React.FC = () => {
  const [selectedVariant, setSelectedVariant] = useState<GameVariant>('kalah');
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleGameEnd = (winner: Player | 'draw', variant: GameVariant, mode: GameMode, difficulty: Difficulty) => {
    recordGameEnd(winner, variant, mode, difficulty);
  };

  const scrollToBoard = (variant: GameVariant) => {
    setSelectedVariant(variant);
    const boardEl = document.getElementById('mancala-game-board');
    if (boardEl) {
      boardEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar
        currentVariant={selectedVariant}
        onResetGame={() => setResetKey((prev) => prev + 1)}
      />

      <section className="relative overflow-hidden border-b border-[#ebebeb] bg-gradient-to-b from-[#fafafa] via-white to-white py-16 sm:py-24">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-48 pointer-events-none opacity-20 blur-3xl">
          <div className="h-full w-full bg-gradient-to-r from-[#007cf0] via-[#7928ca] to-[#ff0080]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ebebeb] bg-white px-3 py-1 shadow-sm mb-6">
            <span className="h-2 w-2 rounded-full bg-[#0070f3] animate-pulse" />
            <span className="font-mono-code text-xs font-medium text-[#171717]">
              onlinemancala.com — Play Free Online
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#171717] max-w-4xl mx-auto leading-tight sm:leading-none">
            The Ancient Game of Strategy, Reimagined for the Modern Web.
          </h1>

          <p className="mt-4 text-base sm:text-lg text-[#4d4d4d] max-w-2xl mx-auto">
            Play <strong>Kalah</strong>, <strong>Avalanche Mancala</strong>, or <strong>Oware / Awale</strong> against intelligent AI algorithms (Easy, Medium, Hard) or challenge a friend in 2-player pass & play mode.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[#666] font-mono-code">
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-[#0070f3]" />
              3 Mancala Game Variants
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-[#7928ca]" />
              3 CPU AI Difficulties
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-[#eb367f]" />
              Pass & Play 2-Player
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-[#00dfd8]" />
              No Registration Required
            </div>
          </div>
        </div>
      </section>

      <section id="variants" className="py-12 bg-white border-b border-[#ebebeb]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171717]">
              Choose Your Mancala Variant
            </h2>
            <p className="mt-1 text-sm text-[#888888]">
              Select one of the 3 classic variants on the landing page to start your match.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <VariantCard
              id="kalah"
              title="Kalah"
              subtitle="Standard International Rules"
              description="The most popular Mancala variant. Fill side stores, score extra turns when landing in your store, and capture opposite pits!"
              badge="Classic Kalaha"
              keyRule="Extra turns on store landing + opposite pit captures."
              isActive={selectedVariant === 'kalah'}
              onSelect={scrollToBoard}
            />

            <VariantCard
              id="avalanche"
              title="Avalanche Mancala"
              subtitle="Continuous Multi-Lap Sowing"
              description="Fast-paced continuous sowing. If your last seed lands in a non-empty pit, pick up ALL seeds and keep sowing!"
              badge="Multi-Lap Sowing"
              keyRule="Continuous laps until landing in an empty pit or store."
              isActive={selectedVariant === 'avalanche'}
              onSelect={scrollToBoard}
            />

            <VariantCard
              id="oware"
              title="Oware / Awale"
              subtitle="Traditional West African Game"
              description="Strategic 12-pit board without side stores. Harvest opponent pits containing 2 or 3 seeds with Feed and Grand Slam rules!"
              badge="West African Awale"
              keyRule="Harvest 2/3 seeds, enforced Feed & Grand Slam protection."
              isActive={selectedVariant === 'oware'}
              onSelect={scrollToBoard}
            />
          </div>
        </div>
      </section>

      <section id="mancala-game-board" className="py-8 sm:py-12 bg-[#fafafa] flex-1">
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
                <button
                  key={v}
                  onClick={() => setSelectedVariant(v)}
                  className={`rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold border transition ${selectedVariant === v
                      ? 'bg-black text-white border-black shadow-sm'
                      : 'bg-white text-[#4d4d4d] border-[#ebebeb] hover:border-black'
                    }`}
                >
                  {v.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <MancalaBoard key={`${selectedVariant}-${resetKey}`} variant={selectedVariant} onGameEnd={handleGameEnd} />
        </div>
      </section>

      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} initialVariant={selectedVariant} />
      <StatsDrawer isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />

      <Footer />
    </div>
  );
};
