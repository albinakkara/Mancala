import type { GameVariant } from './types';
import type { ReactNode } from 'react';
import { Shield, Repeat, Sparkles } from 'lucide-react';

export interface VariantRuleInfo {
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  keyRule: string;
  icon: ReactNode;
  objective: string;
  boardSetup: string;
  rules: { label: string; text: string }[];
  scoring: string;
  strategy: string[];
  proTips: string[];
  rulesHeaderColor: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
}

export const variantData: Record<GameVariant, VariantRuleInfo> = {
  kalah: {
    title: 'Kalah',
    subtitle: 'Standard International Rules',
    description: 'The most popular Mancala variant. Fill side stores, score extra turns when landing in your store, and capture opposite pits!',
    badge: 'Classic Kalaha',
    keyRule: 'Extra turns on store landing + opposite pit captures.',
    icon: <Shield className="h-5 w-5 text-[#0070f3]" />,
    objective: 'Accumulate the highest count of seeds in your right-hand store (pit 6 for P1, pit 13 for P2).',
    boardSetup: '14 pits total: 6 pits per player + 1 store on each side. Each of the 12 playing pits starts with 4 seeds.',
    rules: [
      { label: 'Sowing', text: "Pick all seeds from any pit on your side and sow them 1-by-1 counter-clockwise, skipping your opponent's store." },
      { label: 'Extra Turn', text: 'If your final seed lands directly inside your store, you get an immediate extra turn!' },
      { label: 'Pit Captures', text: "If your final seed lands in an empty pit on your side and the opposite opponent pit has seeds, capture all opposite seeds plus your landing seed into your store!" },
      { label: 'End Game', text: "When one player's pits are empty, remaining seeds on the other side belong to that player." },
    ],
    scoring: 'All seeds captured into your store count as points. The player with the most seeds in their store at the end wins.',
    strategy: [
      'Always aim to land your last seed in your store to gain extra turns.',
      'Avoid leaving seeds in pits that allow your opponent to capture on their next move.',
      'Plan your captures carefully — sometimes it is better to sacrifice a turn for a larger capture.',
      'In the endgame, count seeds carefully to determine if you can win the current board state.',
      'Control the center pits early — they offer the most sowing flexibility.',
    ],
    proTips: [
      'Setting up a "double capture" (landing in an empty pit that is opposite another empty pit) is extremely rare but game-winning.',
      'If you cannot force a capture, prioritize moves that keep your opponent from getting an extra turn.',
      'In the last few moves, hoard seeds near your store for quick pickup.',
    ],
    rulesHeaderColor: 'text-[#0070f3]',
    accentBg: 'bg-[#eef6ff]',
    accentBorder: 'border-[#0070f3]/20',
    accentText: 'text-[#0070f3]',
  },
  avalanche: {
    title: 'Avalanche Mancala',
    subtitle: 'Continuous Multi-Lap Sowing',
    description: 'Fast-paced continuous sowing. If your last seed lands in a non-empty pit, pick up ALL seeds and keep sowing!',
    badge: 'Multi-Lap Sowing',
    keyRule: 'Continuous laps until landing in an empty pit or store.',
    icon: <Repeat className="h-5 w-5 text-[#7928ca]" />,
    objective: 'Master continuous multi-lap sowing to trigger cascading turns and fill your store!',
    boardSetup: '14 pits total: 6 pits per player + 1 store on each side. Each of the 12 playing pits starts with 4 seeds. No captures by default.',
    rules: [
      { label: 'Continuous Multi-Lap Sowing', text: 'If your last seed lands in a pit containing existing seeds, pick up ALL seeds in that pit and continue sowing in the same direction!' },
      { label: 'Turn End Condition', text: 'Your turn only ends when your last seed lands in an empty pit (1 seed total) or in your store.' },
      { label: 'Store Bonus', text: 'Landing in your store gives you an extra turn choice!' },
    ],
    scoring: 'Standard scoring applies. Some variants award bonus points for emptying all pits on the opponent\'s side.',
    strategy: [
      'Look for pits that will trigger avalanches — they can multiply your seed count dramatically.',
      'Chain reactions are key — plan moves that cascade through multiple pits.',
      'Avoid moves that end in empty pits unless you are setting up a future avalanche.',
      'The store is your friend — landing there gives you another chance to trigger cascades.',
      'Early game: focus on building up a "launch pit" with 5+ seeds to maximize avalanche range.',
    ],
    proTips: [
      'The most powerful move in Avalanche is chaining 3+ pits in a single turn — practice visualizing the full path before sowing.',
      'If you land in your store, you keep going. Use this to "reset" your position and pick a better launching pit.',
      'Leaving a single seed in a pit is risky unless it is adjacent to your store.',
    ],
    rulesHeaderColor: 'text-[#7928ca]',
    accentBg: 'bg-[#f3e8ff]',
    accentBorder: 'border-[#7928ca]/20',
    accentText: 'text-[#7928ca]',
  },
  oware: {
    title: 'Oware / Awale',
    subtitle: 'Traditional West African Game',
    description: 'Strategic 12-pit board without side stores. Harvest opponent pits containing 2 or 3 seeds with Feed and Grand Slam rules!',
    badge: 'West African Awale',
    keyRule: 'Harvest 2/3 seeds, enforced Feed & Grand Slam protection.',
    icon: <Sparkles className="h-5 w-5 text-[#eb367f]" />,
    objective: 'Capture 25 or more seeds from your opponent across a 12-pit board. No side stores on the board!',
    boardSetup: '12 pits total: 6 pits per player, no side stores. Each pit starts with 4 seeds. Captured seeds are kept off-board in personal reserves.',
    rules: [
      { label: 'Harvesting 2 or 3 Seeds', text: 'If your last seed drops into an opponent pit and makes its total 2 or 3 seeds, harvest those seeds!' },
      { label: 'Cascading Capture', text: 'If previous preceding opponent pits also contain 2 or 3 seeds, harvest them continuously backwards!' },
      { label: 'Grand Slam Rule', text: 'If a capture would take ALL opponent seeds on the board, the capture is illegal. All seeds stay on board.' },
      { label: 'Feed Rule', text: 'If your opponent has 0 seeds, you MUST play a move that feeds seeds to their side if possible.' },
    ],
    scoring: 'First player to capture 25+ seeds wins. In some variants, if a player cannot make a legal move, the game ends and remaining seeds go to the opponent.',
    strategy: [
      'Always check for cascading capture opportunities — they can net you many seeds at once.',
      'The Feed Rule means you must keep your opponent in the game — plan accordingly.',
      'Grand Slam protection means you cannot empty your opponent in one move — aim for gradual accumulation.',
      'Count seeds carefully — the first to 25 wins, so every capture matters.',
      'Control the pit distribution: avoid leaving 2 or 3 seeds in adjacent pits when it is your opponent\'s turn.',
    ],
    proTips: [
      'Mastering the Feed Rule is what separates beginners from experts. Always verify your opponent has seeds before making a move.',
      'A "double harvest" (two consecutive 2/3 captures) can swing the game by 6+ seeds in one turn.',
      'If you are behind, look for moves that set up cascading captures across multiple pits.',
    ],
    rulesHeaderColor: 'text-[#eb367f]',
    accentBg: 'bg-[#fff0f5]',
    accentBorder: 'border-[#eb367f]/20',
    accentText: 'text-[#eb367f]',
  },
};

export const variantColorMap: Record<GameVariant, string> = {
  kalah: 'text-[#0070f3]',
  avalanche: 'text-[#7928ca]',
  oware: 'text-[#eb367f]',
};
