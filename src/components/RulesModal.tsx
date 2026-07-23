import React from 'react';
import { X, BookOpen, CheckCircle2 } from 'lucide-react';
import type { GameVariant } from '../lib/types';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialVariant?: GameVariant;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, initialVariant = 'kalah' }) => {
  const [activeTab, setActiveTab] = React.useState<GameVariant>(initialVariant);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-[#ebebeb] bg-white p-6 shadow-2xl transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[#666] hover:bg-[#f5f5f5] hover:text-black transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-[#0070f3]" />
          <h2 className="text-xl font-bold tracking-tight text-[#171717]">
            Mancala Game Rules & Strategies
          </h2>
        </div>

        {/* Variant Tabs */}
        <div className="flex border-b border-[#ebebeb] mb-6">
          {(['kalah', 'avalanche', 'oware'] as const).map((variant) => {
            const labels = {
              kalah: 'Kalah',
              avalanche: 'Avalanche Mancala',
              oware: 'Oware / Awale',
            };
            return (
              <button
                key={variant}
                onClick={() => setActiveTab(variant)}
                className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === variant
                    ? 'border-black text-black'
                    : 'border-transparent text-[#888888] hover:text-black'
                }`}
              >
                {labels[variant]}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="space-y-4 text-sm text-[#4d4d4d] max-h-[60vh] overflow-y-auto pr-2">
          {activeTab === 'kalah' && (
            <div className="space-y-3">
              <div className="rounded-lg bg-[#fafafa] border border-[#ebebeb] p-3">
                <span className="font-mono-code text-xs font-bold text-[#171717] block mb-1">
                  OBJECTIVE
                </span>
                <p className="text-xs text-[#4d4d4d]">
                  Accumulate the highest count of seeds in your right-hand store (pit 6 for P1, pit 13 for P2).
                </p>
              </div>

              <h4 className="font-semibold text-[#171717] text-sm flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#0070f3]" />
                Key Gameplay Rules:
              </h4>
              <ul className="list-disc list-inside space-y-1.5 text-xs">
                <li>
                  <strong className="text-[#171717]">Sowing:</strong> Pick all seeds from any pit on your side and sow them 1-by-1 counter-clockwise, skipping your opponent&apos;s store.
                </li>
                <li>
                  <strong className="text-[#171717]">Extra Turn:</strong> If your final seed lands directly inside your store, you get an immediate extra turn!
                </li>
                <li>
                  <strong className="text-[#171717]">Pit Captures:</strong> If your final seed lands in an empty pit on your side and the opposite opponent pit has seeds, capture all opposite seeds plus your landing seed into your store!
                </li>
                <li>
                  <strong className="text-[#171717]">End Game:</strong> When one player&apos;s pits are empty, remaining seeds on the other side belong to that player.
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'avalanche' && (
            <div className="space-y-3">
              <div className="rounded-lg bg-[#fafafa] border border-[#ebebeb] p-3">
                <span className="font-mono-code text-xs font-bold text-[#171717] block mb-1">
                  OBJECTIVE
                </span>
                <p className="text-xs text-[#4d4d4d]">
                  Master continuous multi-lap sowing to trigger cascading turns and fill your store!
                </p>
              </div>

              <h4 className="font-semibold text-[#171717] text-sm flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#7928ca]" />
                Key Gameplay Rules:
              </h4>
              <ul className="list-disc list-inside space-y-1.5 text-xs">
                <li>
                  <strong className="text-[#171717]">Continuous Multi-Lap Sowing:</strong> If your last seed lands in a pit containing existing seeds, pick up ALL seeds in that pit and continue sowing in the same direction!
                </li>
                <li>
                  <strong className="text-[#171717]">Turn End Condition:</strong> Your turn only ends when your last seed lands in an empty pit (1 seed total) or in your store.
                </li>
                <li>
                  <strong className="text-[#171717]">Store Bonus:</strong> Landing in your store gives you an extra turn choice!
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'oware' && (
            <div className="space-y-3">
              <div className="rounded-lg bg-[#fafafa] border border-[#ebebeb] p-3">
                <span className="font-mono-code text-xs font-bold text-[#171717] block mb-1">
                  OBJECTIVE
                </span>
                <p className="text-xs text-[#4d4d4d]">
                  Capture 25 or more seeds from your opponent across a 12-pit board. No side stores on the board!
                </p>
              </div>

              <h4 className="font-semibold text-[#171717] text-sm flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#eb367f]" />
                Key Gameplay Rules:
              </h4>
              <ul className="list-disc list-inside space-y-1.5 text-xs">
                <li>
                  <strong className="text-[#171717]">Harvesting 2 or 3 Seeds:</strong> If your last seed drops into an opponent pit and makes its total 2 or 3 seeds, harvest those seeds!
                </li>
                <li>
                  <strong className="text-[#171717]">Cascading Capture:</strong> If previous preceding opponent pits also contain 2 or 3 seeds, harvest them continuously backwards!
                </li>
                <li>
                  <strong className="text-[#171717]">Grand Slam Rule:</strong> If a capture would take ALL opponent seeds on the board, the capture is illegal. All seeds stay on board.
                </li>
                <li>
                  <strong className="text-[#171717]">Feed Rule:</strong> If your opponent has 0 seeds, you MUST play a move that feeds seeds to their side if possible.
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer Button */}
        <div className="mt-6 pt-4 border-t border-[#ebebeb] flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-[#333] transition"
          >
            Got it, Let&apos;s Play
          </button>
        </div>
      </div>
    </div>
  );
};
