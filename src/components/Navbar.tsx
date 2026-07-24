import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, HelpCircle, Trophy, RefreshCw } from 'lucide-react';
import { soundFx } from '../lib/sound';

interface NavbarProps {
  currentVariant?: string;
  onResetGame?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentVariant = 'kalah',
  onResetGame,
}) => {
  const [isMuted, setIsMuted] = useState(soundFx.getMuted());

  useEffect(() => {
    const handleStorage = () => {
      setIsMuted(soundFx.getMuted());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleToggleSound = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  const isPlayPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/play');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#ebebeb] bg-white/80 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand & Domain */}
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2.5 transition hover:opacity-80">
            <img src="/favicon.svg" alt="Online Mancala" className="h-8 w-8 rounded-lg shadow-sm" />
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight text-[#171717]">
                Online Mancala
              </span>
              <span className="font-mono-code text-[10px] text-[#888888] tracking-wide">
                onlinemancala.com
              </span>
            </div>
          </a>
        </div>

        {/* Middle: Variant Pills (only on play pages) */}
        {isPlayPage && (
          <nav className="hidden md:flex items-center gap-1 rounded-full border border-[#ebebeb] bg-[#fafafa] p-1">
            {(['kalah', 'avalanche', 'oware'] as const).map((variant) => {
              const isActive = currentVariant === variant;
              const labels = {
                kalah: 'Kalah',
                avalanche: 'Avalanche',
                oware: 'Oware / Awale',
              };
              return (
                <a
                  key={variant}
                  href={`/${variant}`}
                  className={`rounded-full px-3.5 py-1 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-black text-white shadow-sm'
                      : 'text-[#4d4d4d] hover:text-black hover:bg-black/5'
                  }`}
                >
                  {labels[variant]}
                </a>
              );
            })}
          </nav>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {onResetGame && (
            <button
              onClick={onResetGame}
              title="Reset Board"
              className="flex h-9 items-center gap-1.5 rounded-md border border-[#ebebeb] bg-white px-2.5 text-xs font-medium text-[#171717] hover:bg-[#f5f5f5] transition"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#666]" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          <a
            href="/rules"
            title="How to Play / Rules"
            className="flex h-9 items-center gap-1.5 rounded-md border border-[#ebebeb] bg-white px-2.5 text-xs font-medium text-[#171717] hover:bg-[#f5f5f5] transition"
          >
            <HelpCircle className="h-4 w-4 text-[#666]" />
            <span className="hidden sm:inline">Rules</span>
          </a>

          <a
            href="/stats"
            title="Statistics"
            className="flex h-9 items-center gap-1.5 rounded-md border border-[#ebebeb] bg-white px-2.5 text-xs font-medium text-[#171717] hover:bg-[#f5f5f5] transition"
          >
            <Trophy className="h-4 w-4 text-[#666]" />
            <span className="hidden sm:inline">Stats</span>
          </a>

          <button
            onClick={handleToggleSound}
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
            aria-label={isMuted ? "Unmute Sound" : "Mute Sound"}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[#ebebeb] bg-white text-[#171717] hover:bg-[#f5f5f5] transition"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-[#888888]" />
            ) : (
              <Volume2 className="h-4 w-4 text-[#0070f3]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
