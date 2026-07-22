import React, { useEffect, useState } from 'react';
import { Award, RotateCcw, Trophy } from 'lucide-react';
import type { Player, GameVariant, GameMode } from '../lib/types';

interface WinnerPopupProps {
    isOpen: boolean;
    winner: Player | 'draw' | null;
    scores: [number, number];
    variant: GameVariant;
    mode: GameMode;
    onNewGame: () => void;
}

export const WinnerPopup: React.FC<WinnerPopupProps> = ({
    isOpen,
    winner,
    scores,
    variant,
    mode,
    onNewGame,
}) => {
    const [visible, setVisible] = useState(false);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setVisible(true);
            // Stagger entrance: backdrop first, then content
            setTimeout(() => setShowContent(true), 80);
        } else {
            setShowContent(false);
            const timer = setTimeout(() => setVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!visible) return null;

    const isDraw = winner === 'draw';
    const winnerLabel = isDraw
        ? "It's a Draw!"
        : winner === 0
            ? 'Player 1 Wins!'
            : mode === 'pvc'
                ? 'CPU Wins!'
                : 'Player 2 Wins!';

    const winnerSubtext = isDraw
        ? 'Neither player managed to outscore the other.'
        : winner === 0
            ? 'Player 1 takes the victory with a higher score!'
            : mode === 'pvc'
                ? 'The CPU outplayed you this round. Try again!'
                : 'Player 2 takes the victory with a higher score!';

    const variantLabel =
        variant === 'kalah' ? 'Kalah' : variant === 'avalanche' ? 'Avalanche' : 'Oware / Awale';

    const iconColor = isDraw
        ? 'text-[#888888]'
        : winner === 0
            ? 'text-[#0070f3]'
            : 'text-[#eb367f]';

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${showContent ? 'bg-black/40 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none'
                }`}
            onClick={(e) => {
                // Close on backdrop click
                if (e.target === e.currentTarget) onNewGame();
            }}
        >
            <div
                className={`relative w-full max-w-md rounded-2xl border border-[#ebebeb] bg-white p-8 shadow-2xl text-center transition-all duration-300 ${showContent
                        ? 'scale-100 opacity-100 translate-y-0'
                        : 'scale-90 opacity-0 translate-y-4'
                    }`}
            >
                {/* Close button (subtle) */}
                <button
                    onClick={onNewGame}
                    className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full text-[#888888] hover:text-[#171717] hover:bg-[#f5f5f5] transition"
                    aria-label="Close popup"
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M3 3l8 8M11 3l-8 8" />
                    </svg>
                </button>

                {/* Trophy / Award Icon */}
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#fafafa] border border-[#ebebeb]">
                    {isDraw ? (
                        <Award className={`h-10 w-10 ${iconColor}`} />
                    ) : (
                        <Trophy className={`h-10 w-10 ${iconColor}`} />
                    )}
                </div>

                {/* Winner Text */}
                <h2 className="text-2xl font-bold tracking-tight text-[#171717] mb-1">
                    {winnerLabel}
                </h2>

                <p className="text-sm text-[#666] mb-6 max-w-xs mx-auto leading-relaxed">
                    {winnerSubtext}
                </p>

                {/* Divider */}
                <div className="border-t border-[#ebebeb] pt-5 mb-6">
                    <span className="font-mono-code text-[11px] text-[#888888] uppercase tracking-wider font-semibold">
                        Final Scores — {variantLabel}
                    </span>

                    <div className="mt-4 flex items-center justify-center gap-8">
                        {/* Player 1 Score */}
                        <div className="flex flex-col items-center">
                            <span className="text-xs font-medium text-[#0070f3] mb-1">Player 1</span>
                            <span className="text-4xl font-bold font-mono-code text-[#171717]">
                                {scores[0]}
                            </span>
                            {!isDraw && winner === 0 && (
                                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#0070f3]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#0070f3]">
                                    WINNER
                                </span>
                            )}
                        </div>

                        {/* VS Divider */}
                        <div className="text-[#d4d4d4] font-mono-code text-sm font-bold">VS</div>

                        {/* Player 2 / CPU Score */}
                        <div className="flex flex-col items-center">
                            <span className="text-xs font-medium text-[#eb367f] mb-1">
                                {mode === 'pvc' ? 'CPU' : 'Player 2'}
                            </span>
                            <span className="text-4xl font-bold font-mono-code text-[#171717]">
                                {scores[1]}
                            </span>
                            {!isDraw && winner === 1 && (
                                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#eb367f]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#eb367f]">
                                    WINNER
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* New Match Button */}
                <button
                    onClick={onNewGame}
                    className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-[#333] transition-all duration-200 active:scale-[0.97] shadow-lg"
                >
                    <RotateCcw className="h-4 w-4" />
                    Start New Match
                </button>

                <p className="mt-3 text-[11px] text-[#888888] font-mono-code">
                    or click outside to play again
                </p>
            </div>
        </div>
    );
};

