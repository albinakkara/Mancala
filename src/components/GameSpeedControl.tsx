import React from 'react';

interface GameSpeedControlProps {
    speed: number;
    onSpeedChange: (speed: number) => void;
}

export const GameSpeedControl: React.FC<GameSpeedControlProps> = ({ speed, onSpeedChange }) => {
    const speeds = [1, 1.5, 2];
    return (
        <div className="inline-flex flex-col items-center gap-0.5">
            <span className="font-mono-code text-[8px] sm:text-[9px] text-[#888888] uppercase tracking-widest">Game Speed</span>
            <div className="inline-flex items-center gap-0.5 rounded-lg border border-[#ebebeb] bg-white p-0.5 shadow-sm">
            {speeds.map((s) => (
                <button
                    key={s}
                    onClick={() => onSpeedChange(s)}
                    className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-md transition-all ${
                        speed === s
                            ? 'bg-black text-white shadow-sm'
                            : 'text-[#666] hover:text-[#171717] hover:bg-[#fafafa]'
                    }`}
                >
                    {s}X
                </button>
            ))}
            </div>
        </div>
    );
};
