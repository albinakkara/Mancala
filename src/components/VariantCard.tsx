import React from 'react';
import { Play, Shield, Repeat, Sparkles, ArrowRight } from 'lucide-react';
import type { GameVariant } from '../lib/types';

interface VariantCardProps {
  id: GameVariant;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  keyRule: string;
  isActive: boolean;
  onSelect: (variant: GameVariant) => void;
}

export const VariantCard: React.FC<VariantCardProps> = ({
  id,
  title,
  subtitle,
  description,
  badge,
  keyRule,
  isActive,
  onSelect,
}) => {
  const getIcon = () => {
    switch (id) {
      case 'kalah':
        return <Shield className="h-4 w-4 text-[#0070f3]" />;
      case 'avalanche':
        return <Repeat className="h-4 w-4 text-[#7928ca]" />;
      case 'oware':
        return <Sparkles className="h-4 w-4 text-[#eb367f]" />;
    }
  };

  const getGradientBorder = () => {
    switch (id) {
      case 'kalah':
        return 'hover:border-[#0070f3] hover:shadow-[#0070f3]/10';
      case 'avalanche':
        return 'hover:border-[#7928ca] hover:shadow-[#7928ca]/10';
      case 'oware':
        return 'hover:border-[#eb367f] hover:shadow-[#eb367f]/10';
    }
  };

  return (
    <div
      onClick={() => onSelect(id)}
      className={`group relative flex flex-col justify-between rounded-xl border bg-white p-6 transition-all duration-300 hover:-translate-y-1 cursor-pointer ${getGradientBorder()} ${
        isActive
          ? 'border-black ring-2 ring-black shadow-lg scale-102'
          : 'border-[#ebebeb] hover:shadow-xl'
      }`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f5] px-2.5 py-0.5 font-mono-code text-[11px] font-medium text-[#171717] group-hover:bg-[#eef6ff] transition-colors">
            {getIcon()}
            {badge}
          </span>
          <span className="font-mono-code text-[11px] text-[#888888]">
            {id === 'oware' ? '12 Pits' : '14 Pits + Stores'}
          </span>
        </div>

        <h3 className="text-xl font-semibold tracking-tight text-[#171717] group-hover:text-black transition-colors">
          {title}
        </h3>
        <p className="text-xs font-medium text-[#888888] mb-2">{subtitle}</p>
        <p className="text-sm text-[#4d4d4d] leading-relaxed mb-4">{description}</p>

        {/* Visual Mini Pit Board Preview */}
        <div className="my-4 rounded-lg border border-[#ebebeb] bg-[#fafafa] p-3 transition-colors group-hover:bg-white group-hover:border-[#d4d4d4]">
          <div className="text-[10px] font-mono-code text-[#888888] mb-1.5 flex justify-between">
            <span>BOARD PREVIEW</span>
            <span>{id === 'oware' ? 'Harvest Rules' : 'Store Rules'}</span>
          </div>
          <div className="flex items-center justify-between gap-1">
            {id !== 'oware' && (
              <div className="h-7 w-5 rounded bg-[#e5e5e5] border border-[#d4d4d4] flex items-center justify-center font-mono-code text-[10px] text-[#666]">
                S
              </div>
            )}
            <div className="flex flex-1 flex-col gap-1">
              <div className="grid grid-cols-6 gap-1">
                {[4, 4, 4, 4, 4, 4].map((n, i) => (
                  <div
                    key={i}
                    className="h-5 rounded bg-white border border-[#e5e5e5] flex items-center justify-center font-mono-code text-[9px] text-[#171717] transition-transform duration-200 group-hover:scale-105"
                  >
                    {n}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-6 gap-1">
                {[4, 4, 4, 4, 4, 4].map((n, i) => (
                  <div
                    key={i}
                    className="h-5 rounded bg-white border border-[#e5e5e5] flex items-center justify-center font-mono-code text-[9px] text-[#171717] transition-transform duration-200 group-hover:scale-105"
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
            {id !== 'oware' && (
              <div className="h-7 w-5 rounded bg-[#e5e5e5] border border-[#d4d4d4] flex items-center justify-center font-mono-code text-[10px] text-[#666]">
                S
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Rule & Action */}
      <div className="mt-4 pt-4 border-t border-[#ebebeb]">
        <p className="text-xs font-mono-code text-[#666666] mb-4 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#171717] group-hover:scale-125 transition-transform" />
          {keyRule}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(id);
          }}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#171717] py-2.5 text-xs font-medium text-white hover:bg-black transition-all shadow-sm active:scale-98"
        >
          <span>Play {title}</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
