import React, { useCallback } from 'react';
import type { GameVariant, GameMode, BoardState, Player } from '../lib/types';

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
    const maxVisible = 12;
    const displayCount = Math.min(count, maxVisible);
    return (
        <div className="relative flex flex-wrap items-center justify-center gap-px sm:gap-0.5 max-w-full overflow-hidden px-px">
            {Array.from({ length: displayCount }).map((_, i) => (
                <span
                    key={i}
                    className="h-1.5 w-1.5 sm:h-2 sm:w-2 md:h-2.5 md:w-2.5 rounded-full bg-[#171717] flex-shrink-0"
                    style={{ transform: `scale(${1 - Math.min(i, 6) * 0.03})` }}
                />
            ))}
            {count > maxVisible && (
                <span className="font-mono-code text-[6px] sm:text-[8px] font-bold text-[#666] flex-shrink-0">
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
                const ariaLabel = `${label}, ${seedCount} seed${seedCount !== 1 ? 's' : ''}${canPitClick ? ', clickable' : ', not clickable'}`;
                const rowPits = topRow ? [12, 11, 10, 9, 8, 7] : [0, 1, 2, 3, 4, 5];
                return (
                    <button
                        key={pitIdx}
                        data-pit-index={pitIdx}
                        disabled={!canPitClick}
                        onClick={() => onPitClick(pitIdx)}
                        aria-label={ariaLabel}
                        role="gridcell"
                        tabIndex={canPitClick ? 0 : -1}
                        onKeyDown={(e) => {
                          if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
                          const idx = rowPits.indexOf(pitIdx);
                          const oppositeRow = topRow ? [0, 1, 2, 3, 4, 5] : [12, 11, 10, 9, 8, 7];
                          let targetPit: number | null = null;
                          if (e.key === 'ArrowLeft' && idx > 0) targetPit = rowPits[idx - 1];
                          if (e.key === 'ArrowRight' && idx < rowPits.length - 1) targetPit = rowPits[idx + 1];
                          if (e.key === 'ArrowUp' && !topRow) targetPit = oppositeRow[idx];
                          if (e.key === 'ArrowDown' && topRow) targetPit = oppositeRow[idx];
                          if (targetPit === null) return;
                          e.preventDefault();
                          const el = document.querySelector(`[data-pit-index="${targetPit}"]`) as HTMLElement | null;
                          el?.focus();
                        }}
                        className={`relative flex flex-col items-center justify-between h-20 sm:h-24 md:h-28 lg:h-32 rounded-lg sm:rounded-xl border bg-white p-0.5 sm:p-1 md:p-2 transition-all duration-200 min-w-0 ${canPitClick
                            ? 'hover:border-black hover:-translate-y-1 hover:shadow-md active:scale-95 cursor-pointer'
                            : 'cursor-default'
                            } ${isCapturedPit
                                ? 'border-[#ffd700] animate-capture-glow bg-[#fffef0] scale-105 shadow-lg'
                                : ''
                            } ${isCatching
                                ? 'border-[#171717] animate-pit-catch bg-[#f5f5f5] scale-105 shadow-md'
                                : ''
                            } ${isPitActive && !isCapturedPit && !isCatching
                                ? 'border-black/20 bg-[#f5f5f5] scale-105 shadow-md'
                                : ''
                            }`}
                        style={{ minHeight: '3rem' }}
                    >
                        <span
                            className={`font-mono-code text-[6px] sm:text-[8px] md:text-[10px] truncate max-w-full ${topRow ? 'text-[#888888]' : 'text-[#0070f3]'
                                }`}
                        >
                            {label}
                        </span>
                        <div className="my-auto flex items-center justify-center min-w-0 w-full">
                            {renderSeedDots(seedCount)}
                        </div>
                        <span className="font-mono-code text-[8px] sm:text-[10px] md:text-xs font-bold text-[#171717] truncate max-w-full">
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
            gameState.turn === 1 && mode === 'pvp' && !gameState.isGameOver && !isSowing;
        const isPitActive = (idx: number) =>
            gameState.lastSownPit === idx || activeSowPit === idx;

        return (
            <div
                ref={ref}
                role="grid"
                aria-label="Mancala board"
                className="relative rounded-2xl border border-[#ebebeb] bg-[#fafafa] p-1 sm:p-2 md:p-4 lg:p-6 shadow-lg overflow-hidden"
            >
                {isKalahType ? (
                    /* ───── Kalah / Avalanche Board: 8-column grid ───── */
                    <div className="grid grid-cols-8 gap-0.5 sm:gap-1 md:gap-2 items-center min-w-0">
                        {/* P2 / CPU Store (pit 13 - left side, col 1) */}
                        <div
                            data-pit-index={13}
                            role="gridcell"
                            aria-label={`${mode === 'pvc' ? 'CPU' : 'Player 2'} store, ${gameState.pits[13]} seeds`}
                            className={`col-span-1 flex flex-col items-center justify-center h-32 sm:h-36 md:h-44 lg:h-52 xl:h-60 rounded-xl sm:rounded-2xl border-2 bg-white p-0.5 sm:p-1 md:p-2 shadow-inner transition-all duration-300 min-w-0 overflow-hidden ${captureStoreGlow && captureAnimPlayer === 1
                                ? 'border-[#ffd700] bg-[#fffef0] shadow-lg animate-store-capture'
                                : gameState.lastSownPit === 13
                                    ? 'border-[#eb367f] animate-pit-glow shadow-lg bg-[#fff0f5]'
                                    : 'border-[#ebebeb]'
                                }`}
                        >
                            <span className="font-mono-code text-[6px] sm:text-[8px] md:text-[10px] text-[#888888] mb-0.5 truncate max-w-full">
                                {mode === 'pvc' ? 'CPU STORE' : 'P2 STORE'}
                            </span>
                            <span
                                className={`text-sm sm:text-lg md:text-xl lg:text-2xl font-bold font-mono-code text-[#171717] transition-all duration-300 ${captureStoreGlow && captureAnimPlayer === 1
                                    ? 'scale-110 text-[#ffd700]'
                                    : 'animate-score-bump'
                                    }`}
                            >
                                {gameState.pits[13]}
                            </span>
                            <div className="mt-1 sm:mt-2 md:mt-3 flex-1 flex items-center justify-center min-w-0 w-full overflow-hidden">
                                {renderSeedDots(gameState.pits[13])}
                            </div>
                        </div>

                        {/* Center pits (cols 2-7) */}
                        <div className="col-span-6 flex flex-col gap-1 sm:gap-2 md:gap-3 min-w-0">
                            {/* Top row: P2 pits (indices 12,11,10,9,8,7) */}
                            <div role="row" className="grid grid-cols-6 gap-0.5 sm:gap-1 md:gap-2 min-w-0">
                                {[12, 11, 10, 9, 8, 7].map((idx) =>
                                    renderPitBtn(
                                        idx,
                                        gameState.pits[idx],
                                        canClickP1,
                                        isPitActive(idx),
                                        captureGlowPits.includes(idx),
                                        catchingPit === idx,
                                        `P${idx}`,
                                        true
                                    )
                                )}
                            </div>
                            {/* Bottom row: P1 pits (indices 0,1,2,3,4,5) */}
                            <div role="row" className="grid grid-cols-6 gap-0.5 sm:gap-1 md:gap-2 min-w-0">
                                {[0, 1, 2, 3, 4, 5].map((idx) =>
                                    renderPitBtn(
                                        idx,
                                        gameState.pits[idx],
                                        canClickP0,
                                        isPitActive(idx),
                                        captureGlowPits.includes(idx),
                                        catchingPit === idx,
                                        `P${idx + 1}`,
                                        false
                                    )
                                )}
                            </div>
                        </div>

                        {/* P1 Store (pit 6 - right side, col 8) */}
                        <div
                            data-pit-index={6}
                            role="gridcell"
                            aria-label={`Player 1 store, ${gameState.pits[6]} seeds`}
                            className={`col-span-1 flex flex-col items-center justify-center h-32 sm:h-36 md:h-44 lg:h-52 xl:h-60 rounded-xl sm:rounded-2xl border-2 bg-white p-0.5 sm:p-1 md:p-2 shadow-inner transition-all duration-300 min-w-0 overflow-hidden ${captureStoreGlow && captureAnimPlayer === 0
                                ? 'border-[#ffd700] bg-[#fffef0] shadow-lg animate-store-capture'
                                : gameState.lastSownPit === 6
                                    ? 'border-[#0070f3] animate-pit-glow shadow-lg bg-[#eef6ff]'
                                    : 'border-[#0070f3]/30'
                                }`}
                        >
                            <span className="font-mono-code text-[6px] sm:text-[8px] md:text-[10px] text-[#0070f3] mb-0.5 truncate max-w-full">
                                P1 STORE
                            </span>
                            <span
                                className={`text-sm sm:text-lg md:text-xl lg:text-2xl font-bold font-mono-code text-[#171717] transition-all duration-300 ${captureStoreGlow && captureAnimPlayer === 0
                                    ? 'scale-110 text-[#ffd700]'
                                    : 'animate-score-bump'
                                    }`}
                            >
                                {gameState.pits[6]}
                            </span>
                            <div className="mt-1 sm:mt-2 md:mt-3 flex-1 flex items-center justify-center min-w-0 w-full overflow-hidden">
                                {renderSeedDots(gameState.pits[6])}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ───── Oware Board: no stores, 12 pits ───── */
                    <div className="flex flex-col gap-1 sm:gap-2 md:gap-3 max-w-4xl mx-auto min-w-0">
                        {/* Top row: P2 pits (indices 11,10,9,8,7,6) */}
                        <div role="row" className="grid grid-cols-6 gap-0.5 sm:gap-1 md:gap-2 min-w-0">
                            {[11, 10, 9, 8, 7, 6].map((idx) =>
                                renderPitBtn(
                                    idx,
                                    gameState.pits[idx],
                                    canClickP1,
                                    isPitActive(idx),
                                    captureGlowPits.includes(idx),
                                    catchingPit === idx,
                                    `P${idx + 1}`,
                                    true
                                )
                            )}
                        </div>
                        {/* Score bar for Oware */}
                        <div className="flex flex-row items-center justify-between gap-1 px-1 sm:px-3 md:px-6 py-1 sm:py-2 md:py-2.5 rounded-lg bg-white border border-[#ebebeb] shadow-xs">
                            <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2">
                                <span className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-[#0070f3]">P1:</span>
                                <span className="font-mono-code font-bold text-[10px] sm:text-xs md:text-base text-[#171717] animate-score-bump">{gameState.scores[0]}/25</span>
                            </div>
                            <div className="text-[7px] sm:text-[9px] md:text-xs font-mono-code text-[#888888] truncate px-0.5">TO 25</div>
                            <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2">
                                <span className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-[#eb367f]">{mode === 'pvc' ? 'CPU:' : 'P2:'}</span>
                                <span className="font-mono-code font-bold text-[10px] sm:text-xs md:text-base text-[#171717] animate-score-bump">{gameState.scores[1]}/25</span>
                            </div>
                        </div>
                        {/* Bottom row: P1 pits (indices 0,1,2,3,4,5) */}
                        <div role="row" className="grid grid-cols-6 gap-0.5 sm:gap-1 md:gap-2 min-w-0">
                            {[0, 1, 2, 3, 4, 5].map((idx) =>
                                renderPitBtn(
                                    idx,
                                    gameState.pits[idx],
                                    canClickP0,
                                    isPitActive(idx),
                                    captureGlowPits.includes(idx),
                                    catchingPit === idx,
                                    `P${idx + 1}`,
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

