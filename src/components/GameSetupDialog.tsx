import React, { useState, useEffect } from 'react';
import { Cpu, Users, Play } from 'lucide-react';
import type { GameMode, Difficulty, GameVariant } from '../lib/types';

interface GameSetupDialogProps {
    isOpen: boolean;
    variant: GameVariant;
    onStart: (mode: GameMode, difficulty: Difficulty) => void;
}

export const GameSetupDialog: React.FC<GameSetupDialogProps> = ({
    isOpen,
    variant,
    onStart,
}) => {
    const [mode, setMode] = useState<GameMode>('pvc');
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [visible, setVisible] = useState(false);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setVisible(true);
            setTimeout(() => setShowContent(true), 80);
        } else {
            setShowContent(false);
            const timer = setTimeout(() => setVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!visible) return null;

    const variantLabel =
        variant === 'kalah' ? 'Kalah' : variant === 'avalanche' ? 'Avalanche' : 'Oware / Awale';

    const handleStart = () => {
        onStart(mode, difficulty);
    };

    return (
        <div
            className={"fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 " + (showContent ? 'bg-black/40 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none')}
        >
            <div
                className={"relative w-full max-w-md rounded-2xl border border-[#ebebeb] bg-white p-8 shadow-2xl text-center transition-all duration-300 " + (showContent ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-4')}
            >
                <div className="mb-6">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#fafafa] border border-[#ebebeb]">
                        <Play className="h-8 w-8 text-[#0070f3]" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-[#171717]">
                        New Match Setup
                    </h2>
                    <p className="mt-1 text-sm text-[#888888]">
                        Configure your {variantLabel} Mancala match
                    </p>
                </div>

                <div className="border-t border-[#ebebeb] pt-6 space-y-6">
                    <div className="text-left">
                        <span className="font-mono-code text-[11px] text-[#888888] uppercase tracking-wider font-semibold block mb-3">
                            Game Mode
                        </span>
                        <div className="inline-flex rounded-lg border border-[#ebebeb] bg-[#fafafa] p-0.5 w-full">
                            <button
                                onClick={() => setMode('pvc')}
                                className={"flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2.5 text-xs font-medium transition-all duration-200 " + (mode === 'pvc' ? 'bg-black text-white shadow-sm' : 'text-[#4d4d4d] hover:text-black')}
                            >
                                <Cpu className="h-3.5 w-3.5" /> vs Computer
                            </button>
                            <button
                                onClick={() => setMode('pvp')}
                                className={"flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2.5 text-xs font-medium transition-all duration-200 " + (mode === 'pvp' ? 'bg-black text-white shadow-sm' : 'text-[#4d4d4d] hover:text-black')}
                            >
                                <Users className="h-3.5 w-3.5" /> 2 Players
                            </button>
                        </div>
                    </div>

                    {mode === 'pvc' && (
                        <div className="text-left">
                            <span className="font-mono-code text-[11px] text-[#888888] uppercase tracking-wider font-semibold block mb-3">
                                CPU Difficulty
                            </span>
                            <div className="inline-flex rounded-lg border border-[#ebebeb] bg-[#fafafa] p-0.5 w-full">
                                {(['easy', 'medium', 'hard'] as const).map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => setDifficulty(d)}
                                        className={"flex-1 capitalize rounded-md px-3 py-2.5 text-xs font-medium transition-all duration-200 " + (difficulty === d ? 'bg-black text-white shadow-sm' : 'text-[#4d4d4d] hover:text-black')}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleStart}
                        className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-[#333] transition-all duration-200 active:scale-[0.97] shadow-lg mt-4"
                    >
                        <Play className="h-4 w-4" />
                        Start Game
                    </button>

                    <a
                        href="/"
                        className="inline-block mt-4 text-xs text-[#888888] hover:text-[#171717] transition-colors duration-200 underline underline-offset-2"
                    >
                        ← Back to Home
                    </a>
                </div>
            </div>
        </div>
    );
};
