import React from 'react';
import { BookOpen, Shield, Repeat, Sparkles, CheckCircle2, Play, ArrowRight } from 'lucide-react';
import type { GameVariant } from '../lib/types';

const variantData: Record<GameVariant, {
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  keyRule: string;
  icon: React.ReactNode;
  objective: string;
  rules: { label: string; text: string }[];
  strategy: string[];
}> = {
  kalah: {
    title: 'Kalah',
    subtitle: 'Standard International Rules',
    description: 'The most popular Mancala variant. Fill side stores, score extra turns when landing in your store, and capture opposite pits!',
    badge: 'Classic Kalaha',
    keyRule: 'Extra turns on store landing + opposite pit captures.',
    icon: <Shield className="h-5 w-5 text-[#0070f3]" />,
    objective: 'Accumulate the highest count of seeds in your right-hand store (pit 6 for P1, pit 13 for P2).',
    rules: [
      { label: 'Sowing', text: "Pick all seeds from any pit on your side and sow them 1-by-1 counter-clockwise, skipping your opponent's store." },
      { label: 'Extra Turn', text: 'If your final seed lands directly inside your store, you get an immediate extra turn!' },
      { label: 'Pit Captures', text: "If your final seed lands in an empty pit on your side and the opposite opponent pit has seeds, capture all opposite seeds plus your landing seed into your store!" },
      { label: 'End Game', text: "When one player's pits are empty, remaining seeds on the other side belong to that player." },
    ],
    strategy: [
      'Always aim to land your last seed in your store to gain extra turns.',
      'Avoid leaving seeds in pits that allow your opponent to capture on their next move.',
      'Plan your captures carefully — sometimes it is better to sacrifice a turn for a larger capture.',
      'In the endgame, count seeds carefully to determine if you can win the current board state.',
    ],
  },
  avalanche: {
    title: 'Avalanche Mancala',
    subtitle: 'Continuous Multi-Lap Sowing',
    description: 'Fast-paced continuous sowing. If your last seed lands in a non-empty pit, pick up ALL seeds and keep sowing!',
    badge: 'Multi-Lap Sowing',
    keyRule: 'Continuous laps until landing in an empty pit or store.',
    icon: <Repeat className="h-5 w-5 text-[#7928ca]" />,
    objective: 'Master continuous multi-lap sowing to trigger cascading turns and fill your store!',
    rules: [
      { label: 'Continuous Multi-Lap Sowing', text: 'If your last seed lands in a pit containing existing seeds, pick up ALL seeds in that pit and continue sowing in the same direction!' },
      { label: 'Turn End Condition', text: 'Your turn only ends when your last seed lands in an empty pit (1 seed total) or in your store.' },
      { label: 'Store Bonus', text: 'Landing in your store gives you an extra turn choice!' },
    ],
    strategy: [
      'Look for pits that will trigger avalanches — they can multiply your seed count dramatically.',
      'Chain reactions are key — plan moves that cascade through multiple pits.',
      'Avoid moves that end in empty pits unless you are setting up a future avalanche.',
      'The store is your friend — landing there gives you another chance to trigger cascades.',
    ],
  },
  oware: {
    title: 'Oware / Awale',
    subtitle: 'Traditional West African Game',
    description: 'Strategic 12-pit board without side stores. Harvest opponent pits containing 2 or 3 seeds with Feed and Grand Slam rules!',
    badge: 'West African Awale',
    keyRule: 'Harvest 2/3 seeds, enforced Feed & Grand Slam protection.',
    icon: <Sparkles className="h-5 w-5 text-[#eb367f]" />,
    objective: 'Capture 25 or more seeds from your opponent across a 12-pit board. No side stores on the board!',
    rules: [
      { label: 'Harvesting 2 or 3 Seeds', text: 'If your last seed drops into an opponent pit and makes its total 2 or 3 seeds, harvest those seeds!' },
      { label: 'Cascading Capture', text: 'If previous preceding opponent pits also contain 2 or 3 seeds, harvest them continuously backwards!' },
      { label: 'Grand Slam Rule', text: 'If a capture would take ALL opponent seeds on the board, the capture is illegal. All seeds stay on board.' },
      { label: 'Feed Rule', text: 'If your opponent has 0 seeds, you MUST play a move that feeds seeds to their side if possible.' },
    ],
    strategy: [
      'Always check for cascading capture opportunities — they can net you many seeds at once.',
      'The Feed Rule means you must keep your opponent in the game — plan accordingly.',
      'Grand Slam protection means you cannot empty your opponent in one move — aim for gradual accumulation.',
      'Count seeds carefully — the first to 25 wins, so every capture matters.',
    ],
  },
};

export const RulesContent: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<GameVariant>('kalah');

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <BookOpen className="h-6 w-6 text-[#0070f3]" />
          <h1 className="text-3xl font-bold tracking-tight text-[#171717]">
            Mancala Game Rules & Strategies
          </h1>
        </div>
        <p className="text-sm text-[#888888] max-w-2xl mx-auto">
          Learn the rules and master strategies for all three Mancala variants. Choose a variant below to get started.
        </p>
      </div>

      {/* Variant Tabs */}
      <div className="flex border-b border-[#ebebeb] mb-8">
        {(['kalah', 'avalanche', 'oware'] as const).map((variant) => {
          const data = variantData[variant];
          return (
            <button
              key={variant}
              onClick={() => setActiveTab(variant)}
              className={`flex items-center gap-2 py-3 px-5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === variant
                  ? 'border-black text-black'
                  : 'border-transparent text-[#888888] hover:text-black'
              }`}
            >
              {data.icon}
              {data.title}
            </button>
          );
        })}
      </div>

      {/* Content Body */}
      <div className="space-y-8">
        {(['kalah', 'avalanche', 'oware'] as const).map((variant) => {
          if (activeTab !== variant) return null;
          const data = variantData[variant];

          return (
            <div key={variant} className="space-y-6">
              {/* Objective Card */}
              <div className="rounded-xl bg-[#fafafa] border border-[#ebebeb] p-6">
                <span className="font-mono-code text-xs font-bold text-[#171717] block mb-2">
                  OBJECTIVE
                </span>
                <p className="text-sm text-[#4d4d4d]">
                  {data.objective}
                </p>
              </div>

              {/* Key Gameplay Rules */}
              <div>
                <h3 className="font-semibold text-[#171717] text-lg flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-5 w-5 text-[#0070f3]" />
                  Key Gameplay Rules
                </h3>
                <ul className="space-y-3">
                  {data.rules.map((rule, idx) => (
                    <li key={idx} className="flex gap-3">
                      <strong className="text-[#171717] min-w-[140px] font-medium">{rule.label}:</strong>
                      <span className="text-sm text-[#4d4d4d]">{rule.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Strategy Tips */}
              <div>
                <h3 className="font-semibold text-[#171717] text-lg flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-[#7928ca]" />
                  Strategy Tips
                </h3>
                <ul className="space-y-2">
                  {data.strategy.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0070f3] mt-1.5 flex-shrink-0" />
                      <span className="text-sm text-[#4d4d4d]">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Play Button */}
              <div className="pt-4 border-t border-[#ebebeb]">
                <a
                  href={`/play?variant=${variant}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#171717] px-5 py-2.5 text-xs font-medium text-white hover:bg-black transition-all shadow-sm active:scale-98"
                >
                  <Play className="h-3.5 w-3.5" />
                  Play {data.title}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
