import React, { useCallback } from 'react';
import type { GameVariant, GameMode, BoardState, Player } from '../lib/types';
import { KALAH_P0_STORE, KALAH_P1_STORE } from '../lib/kalah';

interface BoardGridProps {
    variant: GameVariant;
    mode: GameMode;
    gameState: BoardState;
    isCpuThinking: boolean;
    isSowing: boolean;
    captureGlowPits: number[];
    captureStoreGlow: boolean;
    captureAnimPlayer: Player;
    catchingPit: number | null;
    activeSowPit: number | null;
    onPitClick: (pitIndex: number) => void;
}

const renderSeedDots = (count: number) => {
    if (count === 0) return null;
    const maxVisible = 16;
    const displayCount = Math.min(count, maxVisible);
    return (
        <div className="relative flex flex-wrap items-center justify-center gap-1 max-w-[80%] px-1">
            {Array.from({ length: displayCount }).map((_, i) => (
                <span
                    key={i}
                    className="h-3 w-3 rounded-full bg-[#171717]"
                    style={{ transform: `scale(${1 - Math.min(i, 8) * 0.03})` }}
                />
            ))}
            {count > maxVisible && (
                <span className="font-mono-code text-[9px] font-bold text-[#666]">
                    +{count - maxVisible}
                </span>
            )}
        </div>
    );
};

export const BoardGrid = React.forwardRef<HTMLDivElement, BoardGridProps>(
    (
        {
            variant,
            mode,
            gameState,
            isCpuThinking,
            isSowing,
            captureGlowPits,
            captureStoreGlow,
            captureAnimPlayer,
            catchingPit,
            activeSowPit,
            onPitClick,
        },
        ref
    ) => {
        const [hoveredPit, setHoveredPit] = React.useState<number | null>(null);

        const isKalahType = variant === 'kalah' || variant === 'avalanche';

        const renderPitBtn = useCallback(
            (
                pitIdx: number,
                seedCount: number,
                canClick: boolean,
                isPitActive: boolean,
                isCapturedPit: boolean,
                isCatching: boolean,
                label: string,
                topRow: boolean
            ) => {
                const canPitClick = canClick && seedCount > 0;
                return (
                    <button
                        key={pitIdx}
                        data-pit-index={pitIdx}
                        disabled={!canPitClick}
                        onClick={() => onPitClick(pitIdx)}
                        onMouseEnter={() => setHoveredPit(pitIdx)}
                        onMouseLeave={() => setHoveredPit(null)}
                        className={`relative flex flex-col items-center justify-between h-24 rounded-xl border bg-white p-2 transition-all duration-200 ${canPitClick
                                ? 'hover:border-black hover:-translate-y-1 hover:shadow-md active:scale-95 cursor-pointer'
                                : 'cursor-default'
                            } ${isCapturedPit
                                ? 'border-[#ffd700] animate-capture-glow bg-[#fffef0] scale-105 shadow-lg'
                                : ''
                            } ${isCatching
                                ? 'border-[#171717] animate-pit-catch bg-[#f5f5f5] scale-105 shadow-md'
                                : ''
                            } ${isPitActive && !isCapturedPit && !isCatching
                                ? `border-black/20 bg-[#f5f5f5] scale-105 shadow-md`
                                : ''
                            }`}
                    >
                        <span
                            className={`font-mono-code text-[10px] ${topRow ? 'text-[#888888]' : 'text-[#0070f3]'
                                }`}
                        >
                            {label}
                        </span>
                        <div className="my-auto flex items-center justify-center">
                            {renderSeedDots(seedCount)}
                        </div>
                        <span className="font-mono-code text-xs font-bold text-[#171717]">
                            {seedCount}
                        </span>
                    </button>
                );
            },
            [onPitClick]
        );

        const canClickP0 =
            gameState.turn === 0 && !gameState.isGameOver && !isCpuThinking && !isSowing;
        const canClickP1 =
            gameState.turn === 1 &&
            mode === 'pvp' &&
            !gameState.isGameOver &&
            !isSowing;
        const isPitActive = (idx: number) =>
            gameState.lastSownPit === idx || activeSowPit === idx;

        return (
            <div
                ref={ref}
                className="relative rounded-2xl border border-[#ebebeb] bg-[#fafafa] p-6 shadow-lg overflow-hidden"
            >
                {isKalahType ? (
                    <div className="grid grid-cols-8 gap-3 items-center">
                        {/* P2 / CPU Store (pit 13 - left side) */}
                        <div
                            data-pit-index={13}
                            className={`col-span-1 flex flex-col items-center justify-center h-56 rounded-2xl border-2 bg-white p-2 shadow-inner transition-all duration-300 ${captureStoreGlow && captureAnimPlayer === 1
                                    ? 'border-[#ffd700] bg-[#fffef0] shadow-lg animate-store-capture'
                                    : gameState.lastSownPit === 13
                                        ? 'border-[#eb367f] animate-pit-glow shadow-lg bg-[#fff0f5]'
                                        : 'border-[#ebebeb]'
                                }`}
                        >
                            <span className="font-mono-code text-[10px] text-[#888888] mb-1">
                                {mode === 'pvc' ? 'CPU STORE' : 'P2 STORE'}
                            </span>
                            <span
                                className={`text-2xl font-bold font-mono-code text-[#171717] transition-all duration-300 ${captureStoreGlow && captureAnimPlayer === 1
                                        ? 'scale-110 text-[#ffd700]'
                                        : 'animate-score-bump'
                                    }`}
                            >
                                {gameState.pits[13]}
                            </span>
                            <div className="mt-3 flex-1 flex items-center justify-center">
                                {renderSeedDots(gameState.pits[13])}
                            </div>
                        </div>

                        {/* Pits grid (center 6 columns) */}
                        <div className="col-span-6 flex flex-col gap-4">
                            {/* Top row: P2 pits (indices 12,11,10,9,8,7) */}
                            <div className="grid grid-cols-6 gap-2">
                                {[12, 11, 10, 9, 8, 7].map((idx) =>
                                    renderPitBtn(
                                        idx,
                                        gameState.pits[idx],
                                        canClickP1,
                                        isPitActive(idx),
                                        captureGlowPits.includes(idx),
                                        catchingPit === idx,
                                        `Pit ${idx}`,
                                        true
                                    )
                                )}
                            </div>
                            {/* Bottom row: P1 pits (indices 0,1,2,3,4,5) */}
                            <div className="grid grid-cols-6 gap-2">
                                {[0, 1, 2, 3, 4, 5].map((idx) =>
                                    renderPitBtn(
                                        idx,
                                        gameState.pits[idx],
                                        canClickP0,
                                        isPitActive(idx),
                                        captureGlowPits.includes(idx),
                                        catchingPit === idx,
                                        `Pit ${idx + 1}`,
                                        false
                                    )
                                )}
                            </div>
                        </div>

                        {/* P1 Store (pit 6 - right side) */}
                        <div
                            data-pit-index={6}
                            className={`col-span-1 flex flex-col items-center justify-center h-56 rounded-2xl border-2 bg-white p-2 shadow-inner transition-all duration-300 ${captureStoreGlow && captureAnimPlayer === 0
                                    ? 'border-[#ffd700] bg-[#fffef0] shadow-lg animate-store-capture'
                                    : gameState.lastSownPit === 6
                                        ? 'border-[#0070f3] animate-pit-glow shadow-lg bg-[#eef6ff]'
                                        : 'border-[#0070f3]/30'
                                }`}
                        >
                            <span className="font-mono-code text-[10px] text-[#0070f3] mb-1">
                                P1 STORE
                            </span>
                            <span
                                className={`text-2xl font-bold font-mono-code text-[#171717] transition-all duration-300 ${captureStoreGlow && captureAnimPlayer === 0
                                        ? 'scale-110 text-[#ffd700]'
                                        : 'animate-score-bump'
                                    }`}
                            >
                                {gameState.pits[6]}
                            </span>
                            <div className="mt-3 flex-1 flex items-center justify-center">
                                {renderSeedDots(gameState.pits[6])}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Oware board: no stores, 12 pits */
                    <div className="flex flex-col gap-4 max-w-4xl mx-auto">
                        {/* Top row: P2 pits (indices 11,10,9,8,7,6) */}
                        <div className="grid grid-cols-6 gap-3">
                            {[11, 10, 9, 8, 7, 6].map((idx) =>
                                renderPitBtn(
                                    idx,
                                    gameState.pits[idx],
                                    canClickP1,
                                    isPitActive(idx),
                                    captureGlowPits.includes(idx),
                                    catchingPit === idx,
                                    `Pit ${idx + 1}`,
                                    true
                                )
                            )}
                        </div>

                        {/* Score bar for Oware */}
                        <div className="flex items-center justify-between px-6 py-2.5 rounded-lg bg-white border border-[#ebebeb] shadow-xs">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-[#0070f3]">
                                    Player 1:
                                </span>
                                <span className="font-mono-code font-bold text-base text-[#171717] animate-score-bump">
                                    {gameState.scores[0]}/25
                                </span>
                            </div>
                            <div className="text-xs font-mono-code text-[#888888]">
                                FIRST TO 25 WINS
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-[#eb367f]">
                                    {mode === 'pvc' ? 'CPU:' : 'P2:'}
                                </span>
                                <span className="font-mono-code font-bold text-base text-[#171717] animate-score-bump">
                                    {gameState.scores[1]}/25
                                </span>
                            </div>
                        </div>

                        {/* Bottom row: P1 pits (indices 0,1,2,3,4,5) */}
                        <div className="grid grid-cols-6 gap-3">
                            {[0, 1, 2, 3, 4, 5].map((idx) =>
                                renderPitBtn(
                                    idx,
                                    gameState.pits[idx],
                                    canClickP0,
                                    isPitActive(idx),
                                    captureGlowPits.includes(idx),
                                    catchingPit === idx,
                                    `Pit ${idx + 1}`,
                                    false
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

BoardGrid.displayName = 'BoardGrid';

