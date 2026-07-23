import React from 'react';
import type { GameVariant, GameMode, MoveRecord } from '../lib/types';

interface MoveHistoryPanelProps {
    moveHistory: MoveRecord[];
    variant: GameVariant;
    mode: GameMode;
}

export const MoveHistoryPanel: React.FC<MoveHistoryPanelProps> = ({
    moveHistory,
    variant,
    mode,
}) => {
    return (
        <div className="rounded-xl border border-[#ebebeb] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-[#ebebeb] pb-2">
                <span className="font-mono-code text-xs font-semibold text-[#171717]">
                    MOVE HISTORY LOG
                </span>
                <span className="font-mono-code text-[11px] text-[#888888]">
                    {moveHistory.length} Moves
                </span>
            </div>

            {moveHistory.length === 0 ? (
                <p className="text-xs text-[#888888] font-mono-code py-2 text-center">
                    No moves recorded yet.
                </p>
            ) : (
                <div className="max-h-36 overflow-y-auto flex flex-col gap-1.5 pr-2">
                    {moveHistory.slice(0, 10).map((r, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between text-xs py-1 px-2.5 rounded bg-[#fafafa] border border-[#ebebeb] animate-fade-slide"
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-mono-code text-[10px] text-[#888888]">
                                    {r.timestamp}
                                </span>
                                <span className="font-semibold text-[#171717]">
                                    {r.player === 0
                                        ? 'Player 1'
                                        : mode === 'pvc'
                                            ? 'CPU'
                                            : 'Player 2'}
                                </span>
                                <span className="text-[#666]">Pit {r.pitIndex + 1}</span>
                            </div>
                            <div className="flex items-center gap-3 font-mono-code text-[11px]">
                                {r.captured > 0 && variant !== 'avalanche' && (
                                    <span className="text-[#ffd700] font-semibold flex items-center gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#ffd700] animate-pulse" />
                                        +{r.captured}
                                    </span>
                                )}
                                {r.extraTurn && (
                                    <span className="text-[#7928ca] font-semibold">Extra!</span>
                                )}
                                <span className="text-[#888888]">{r.seedsSown}s</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

