import React from 'react';
import { Cpu, Users, RotateCcw, Undo2 } from 'lucide-react';
import type { GameMode, Difficulty, GameVariant } from '../lib/types';

interface GameControlsProps {
    mode: GameMode;
    difficulty: Difficulty;
    variant: GameVariant;
    canUndo: boolean;
    onUndo: () => void;
    onNewGame: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
    mode,
    difficulty,
    variant,
    canUndo,
    onUndo,
    onNewGame,
}) => {
    const variantLabel =
        variant === 'kalah' ? 'Kalah' : variant === 'avalanche' ? 'Avalanche' : 'Oware / Awale';

    return (
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 rounded-xl border border-[#ebebeb] bg-white p-2 sm:p-4 shadow-sm">
            {/* Read-only game info badges */}
            <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
                <div className="flex items-center gap-1 sm:gap-1.5 rounded-lg border border-[#ebebeb] bg-[#fafafa] px-2 sm:px-3 py-1 sm:py-1.5">
                    <span className="font-mono-code text-[8px] sm:text-[10px] text-[#888888] uppercase tracking-wider">Variant</span>
                    <span className="text-[10px] sm:text-xs font-semibold text-[#171717] capitalize">{variantLabel}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 rounded-lg border border-[#ebebeb] bg-[#fafafa] px-2 sm:px-3 py-1 sm:py-1.5">
                    <span className="font-mono-code text-[8px] sm:text-[10px] text-[#888888] uppercase tracking-wider">Mode</span>
                    {mode === 'pvc' ? (
                        <span className="text-[10px] sm:text-xs font-semibold text-[#171717] flex items-center gap-1">
                            <Cpu className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> vs Computer
                        </span>
                    ) : (
                        <span className="text-[10px] sm:text-xs font-semibold text-[#171717] flex items-center gap-1">
                            <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> 2 Players
                        </span>
                    )}
                </div>
                {mode === 'pvc' && (
                    <div className="flex items-center gap-1 sm:gap-1.5 rounded-lg border border-[#ebebeb] bg-[#fafafa] px-2 sm:px-3 py-1 sm:py-1.5">
                        <span className="font-mono-code text-[8px] sm:text-[10px] text-[#888888] uppercase tracking-wider">Difficulty</span>
                        <span className="text-[10px] sm:text-xs font-semibold text-[#171717] capitalize">{difficulty}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="flex items-center gap-1 sm:gap-1.5 rounded-lg border border-[#ebebeb] bg-[#fafafa] px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-[#171717] hover:bg-[#f5f5f5] transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <Undo2 className="h-3 sm:h-3.5 w-3 sm:w-3.5" /> Undo
                </button>
                <button
                    onClick={onNewGame}
                    className="flex items-center gap-1 sm:gap-1.5 rounded-lg border border-[#ebebeb] bg-[#fafafa] px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-[#171717] hover:bg-[#f5f5f5] transition active:scale-95"
                >
                    <RotateCcw className="h-3 sm:h-3.5 w-3 sm:w-3.5" /> New Match
                </button>
            </div>
        </div>
    );
};

