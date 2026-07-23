import React from 'react';
import { Cpu, Users, RotateCcw, Undo2 } from 'lucide-react';
import type { GameMode, Difficulty } from '../lib/types';

interface GameControlsProps {
    mode: GameMode;
    difficulty: Difficulty;
    canUndo: boolean;
    onModeChange: (mode: GameMode) => void;
    onDifficultyChange: (difficulty: Difficulty) => void;
    onUndo: () => void;
    onNewGame: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
    mode,
    difficulty,
    canUndo,
    onModeChange,
    onDifficultyChange,
    onUndo,
    onNewGame,
}) => {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#ebebeb] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
                <span className="font-mono-code text-xs text-[#888888]">MODE:</span>
                <div className="inline-flex rounded-lg border border-[#ebebeb] bg-[#fafafa] p-0.5">
                    <button
                        onClick={() => onModeChange('pvc')}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${mode === 'pvc'
                                ? 'bg-black text-white shadow-sm scale-102'
                                : 'text-[#4d4d4d] hover:text-black'
                            }`}
                    >
                        <Cpu className="h-3.5 w-3.5" /> vs Computer
                    </button>
                    <button
                        onClick={() => onModeChange('pvp')}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${mode === 'pvp'
                                ? 'bg-black text-white shadow-sm scale-102'
                                : 'text-[#4d4d4d] hover:text-black'
                            }`}
                    >
                        <Users className="h-3.5 w-3.5" /> 2 Players
                    </button>
                </div>
            </div>

            {mode === 'pvc' && (
                <div className="flex items-center gap-2">
                    <span className="font-mono-code text-xs text-[#888888]">DIFFICULTY:</span>
                    <div className="inline-flex rounded-lg border border-[#ebebeb] bg-[#fafafa] p-0.5">
                        {(['easy', 'medium', 'hard'] as const).map((d) => (
                            <button
                                key={d}
                                onClick={() => onDifficultyChange(d)}
                                className={`capitalize rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${difficulty === d
                                        ? 'bg-black text-white shadow-sm scale-102'
                                        : 'text-[#4d4d4d] hover:text-black'
                                    }`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2">
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="flex items-center gap-1.5 rounded-lg border border-[#ebebeb] bg-[#fafafa] px-3 py-1.5 text-xs font-medium text-[#171717] hover:bg-[#f5f5f5] transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <Undo2 className="h-3.5 w-3.5" /> Undo
                </button>
                <button
                    onClick={onNewGame}
                    className="flex items-center gap-1.5 rounded-lg border border-[#ebebeb] bg-[#fafafa] px-3 py-1.5 text-xs font-medium text-[#171717] hover:bg-[#f5f5f5] transition active:scale-95"
                >
                    <RotateCcw className="h-3.5 w-3.5" /> New Match
                </button>
            </div>
        </div>
    );
};

