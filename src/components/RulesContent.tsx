import React from 'react';
import { BookOpen, Shield, CheckCircle2, Lightbulb, AlertTriangle, Info } from 'lucide-react';
import type { GameVariant } from '../lib/types';
import { variantData } from '../lib/rulesData';

export const RulesContent: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<GameVariant>('kalah');

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <BookOpen className="h-7 w-7 text-[#0070f3]" />
          <h1 className="text-4xl font-bold tracking-tight text-[#171717]">
            Mancala Rules & Strategies
          </h1>
        </div>
        <p className="text-base text-[#888888] max-w-2xl mx-auto">
          Master all three variants. Select a game below to view detailed rules, setup instructions, and expert strategies.
        </p>
      </div>

      {/* Variant Tabs */}
      <div className="flex border-b border-[#ebebeb] mb-10">
        {(['kalah', 'avalanche', 'oware'] as const).map((variant) => {
          const data = variantData[variant];
          return (
            <button
              key={variant}
              onClick={() => setActiveTab(variant)}
              className={`flex items-center gap-2 py-3.5 px-6 text-sm font-semibold border-b-2 transition-all ${
                activeTab === variant
                  ? 'border-black text-black'
                  : 'border-transparent text-[#888888] hover:text-black'
              }`}
            >
              {data.icon}
              {data.title}
            </button>
          );
        })}
      </div>

      {/* Content Body */}
      <div className="space-y-8">
        {(['kalah', 'avalanche', 'oware'] as const).map((variant) => {
          if (activeTab !== variant) return null;
          const data = variantData[variant];

          return (
            <div key={variant} className="space-y-6">
              {/* Header Card */}
              <div className={`rounded-xl border ${data.accentBorder} ${data.accentBg} p-6`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-mono-code text-xs font-bold text-[#171717] block mb-1">
                      {data.badge}
                    </span>
                    <h2 className="text-2xl font-bold text-[#171717]">{data.title}</h2>
                    <p className="text-sm text-[#666] mt-1">{data.subtitle}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${data.accentBg} border ${data.accentBorder}`}>
                    {data.icon}
                  </div>
                </div>
                <p className="text-sm text-[#4d4d4d] leading-relaxed">{data.description}</p>
              </div>

              {/* Key Rule Banner */}
              <div className="flex items-center gap-3 rounded-lg border border-[#ebebeb] bg-white p-4 shadow-sm">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${data.accentBg} flex items-center justify-center`}>
                  <Lightbulb className={`h-4 w-4 ${data.accentText}`} />
                </div>
                <div>
                  <span className="font-mono-code text-xs text-[#888888] block">KEY RULE</span>
                  <span className="text-sm font-semibold text-[#171717]">{data.keyRule}</span>
                </div>
              </div>

              {/* Objective + Board Setup */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#ebebeb] bg-white p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-6 h-6 rounded-full ${data.accentBg} flex items-center justify-center`}>
                      <CheckCircle2 className={`h-3.5 w-3.5 ${data.accentText}`} />
                    </div>
                    <span className="font-mono-code text-xs font-bold text-[#171717]">OBJECTIVE</span>
                  </div>
                  <p className="text-sm text-[#4d4d4d] leading-relaxed">{data.objective}</p>
                </div>

                <div className="rounded-xl border border-[#ebebeb] bg-white p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-6 h-6 rounded-full ${data.accentBg} flex items-center justify-center`}>
                      <Info className={`h-3.5 w-3.5 ${data.accentText}`} />
                    </div>
                    <span className="font-mono-code text-xs font-bold text-[#171717]">BOARD SETUP</span>
                  </div>
                  <p className="text-sm text-[#4d4d4d] leading-relaxed">{data.boardSetup}</p>
                </div>
              </div>

              {/* Key Gameplay Rules */}
              <div className="rounded-xl border border-[#ebebeb] bg-white p-6">
                <div className="flex items-center gap-2 mb-5">
                  <CheckCircle2 className={`h-5 w-5 ${data.rulesHeaderColor}`} />
                  <h3 className="font-semibold text-[#171717] text-lg">Key Gameplay Rules</h3>
                </div>
                <div className="space-y-4">
                  {data.rules.map((rule, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full ${data.accentBg} flex items-center justify-center mt-0.5`}>
                        <span className={`text-xs font-bold ${data.accentText}`}>{idx + 1}</span>
                      </div>
                      <div>
                        <strong className="text-[#171717] font-medium text-sm block mb-1">{rule.label}</strong>
                        <p className="text-sm text-[#4d4d4d] leading-relaxed">{rule.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scoring */}
              <div className="rounded-xl border border-[#ebebeb] bg-[#fafafa] p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-6 h-6 rounded-full ${data.accentBg} flex items-center justify-center`}>
                    <Shield className={`h-3.5 w-3.5 ${data.accentText}`} />
                  </div>
                  <span className="font-mono-code text-xs font-bold text-[#171717]">SCORING</span>
                </div>
                <p className="text-sm text-[#4d4d4d] leading-relaxed">{data.scoring}</p>
              </div>

              {/* Strategy Tips */}
              <div className="rounded-xl border border-[#ebebeb] bg-white p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Shield className="h-5 w-5 text-[#7928ca]" />
                  <h3 className="font-semibold text-[#171717] text-lg">Strategy Tips</h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {data.strategy.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className={`flex-shrink-0 h-1.5 w-1.5 rounded-full bg-[#0070f3] mt-1.5`} />
                      <span className="text-sm text-[#4d4d4d] leading-relaxed">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro Tips */}
              <div className={`rounded-xl border ${data.accentBorder} ${data.accentBg} p-6`}>
                <div className="flex items-center gap-2 mb-5">
                  <Lightbulb className={`h-5 w-5 ${data.accentText}`} />
                  <h3 className="font-semibold text-[#171717] text-lg">Pro Tips</h3>
                </div>
                <div className="space-y-3">
                  {data.proTips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <AlertTriangle className={`flex-shrink-0 h-4 w-4 ${data.accentText} mt-0.5`} />
                      <span className="text-sm text-[#4d4d4d] leading-relaxed">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Play Button & Home */}
              <div className="pt-4 border-t border-[#ebebeb] flex items-center justify-between">
                <a
                  href="/"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#ebebeb] px-4 py-2.5 text-xs font-medium text-[#171717] hover:bg-[#f5f5f5] transition"
                >
                  Back to Home
                </a>
                <a
                  href={`/${variant}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#171717] px-5 py-2.5 text-xs font-medium text-white hover:bg-black transition-all shadow-sm active:scale-98"
                >
                  Play {data.title}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
