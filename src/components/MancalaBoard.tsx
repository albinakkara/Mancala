import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Cpu, Users, RotateCcw, Undo2 } from 'lucide-react';
import type { GameVariant, GameMode, Difficulty, BoardState, Player } from '../lib/types';
import { createInitialKalahState, makeKalahMove, KALAH_P0_STORE, KALAH_P1_STORE } from '../lib/kalah';
import { createInitialAvalancheState, makeAvalancheMove } from '../lib/avalanche';
import { createInitialOwareState, makeOwareMove } from '../lib/oware';
import { getBestCpuMove } from '../lib/ai';
import { soundFx } from '../lib/sound';
import { WinnerPopup } from './WinnerPopup';

interface MancalaBoardProps {
  variant: GameVariant;
  onGameEnd?: (winner: Player | 'draw', variant: GameVariant, mode: GameMode, difficulty: Difficulty) => void;
}

interface CaptureSeed {
  id: number; fromPit: number; toStore: number;
  startX: number; startY: number; deltaX: number; deltaY: number;
  delay: number; player: Player;
}

interface CaptureAnimState {
  active: boolean; seeds: CaptureSeed[]; fromPits: number[]; toStore: number; player: Player;
}

export const MancalaBoard: React.FC<MancalaBoardProps> = ({ variant, onGameEnd }) => {
  const [mode, setMode] = useState<GameMode>('pvc');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [firstPlayer, setFirstPlayer] = useState<Player>(0);
  const [gameState, setGameState] = useState<BoardState>(() => getInitialState(variant));
  const [isCpuThinking, setIsCpuThinking] = useState(false);
  const [isSowing, setIsSowing] = useState(false);
  const [activeSowPit, setActiveSowPit] = useState<number | null>(null);
  const [handCount, setHandCount] = useState(0);
  const [hoveredPit, setHoveredPit] = useState<number | null>(null);
  const [droppingPit, setDroppingPit] = useState<number | null>(null);
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const [captureAnim, setCaptureAnim] = useState<CaptureAnimState>({ active: false, seeds: [], fromPits: [], toStore: -1, player: 0 });
  const [captureGlowPits, setCaptureGlowPits] = useState<number[]>([]);
  const [captureStoreGlow, setCaptureStoreGlow] = useState(false);
  const [clusterSeedCount, setClusterSeedCount] = useState(0);
  const [clusterPos, setClusterPos] = useState({ x: 0, y: 0 });
  const [clusterAnimClass, setClusterAnimClass] = useState('');
  const [clusterVisible, setClusterVisible] = useState(false);
  const [catchingPit, setCatchingPit] = useState<number | null>(null);
  const [undoStack, setUndoStack] = useState<BoardState[]>([]);

  const isMounted = useRef(true);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => { isMounted.current = true; return () => { isMounted.current = false; }; }, []);

  function getInitialState(varType: GameVariant): BoardState {
    if (varType === 'kalah') return createInitialKalahState(4);
    if (varType === 'avalanche') return createInitialAvalancheState(4);
    return createInitialOwareState();
  }

  const startNewGame = useCallback(() => {
    const s = getInitialState(variant);
    s.turn = firstPlayer;
    if (firstPlayer === 1 && mode === 'pvc') s.statusMessage = "CPU plays first! Thinking...";
    setGameState(s);
    setIsCpuThinking(false); setIsSowing(false); setActiveSowPit(null);
    setHandCount(0); setDroppingPit(null); setShowWinnerPopup(false);
    setCaptureAnim({ active: false, seeds: [], fromPits: [], toStore: -1, player: 0 });
    setCaptureGlowPits([]); setCaptureStoreGlow(false);
    setClusterVisible(false); setClusterSeedCount(0); setClusterAnimClass('');
    setCatchingPit(null);
    setUndoStack([]);
  }, [variant, firstPlayer, mode]);

  useEffect(() => { startNewGame(); }, [variant, mode, difficulty, firstPlayer, startNewGame]);

  const handleGameOver = useCallback((finalState: BoardState) => {
    soundFx.playWin();
    confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    setShowWinnerPopup(true);
    if (onGameEnd && finalState.winner !== null) onGameEnd(finalState.winner, variant, mode, difficulty);
  }, [onGameEnd, variant, mode, difficulty]);

  const handleUndo = useCallback(() => {
    if (isCpuThinking || isSowing || undoStack.length === 0) return;
    // In PvC mode, undo 2 states (player move + CPU response) so it's back to the player's turn
    // In PvP mode, undo 1 state (last move)
    const stepsBack = mode === 'pvc' ? 2 : 1;
    if (stepsBack === 2 && undoStack.length < 2) return;
    const restoredState = undoStack[stepsBack - 1];
    setUndoStack(undoStack.slice(stepsBack));
    setGameState({
      ...restoredState,
      pits: [...restoredState.pits],
      scores: [...restoredState.scores],
      moveHistory: [...restoredState.moveHistory],
    });
    // Reset all animation states
    setIsSowing(false);
    setActiveSowPit(null);
    setHandCount(0);
    setDroppingPit(null);
    setClusterVisible(false);
    setClusterSeedCount(0);
    setClusterAnimClass('');
    setCatchingPit(null);
    setCaptureAnim({ active: false, seeds: [], fromPits: [], toStore: -1, player: 0 });
    setCaptureGlowPits([]);
    setCaptureStoreGlow(false);
  }, [mode, undoStack, isCpuThinking, isSowing]);

  const canUndo = undoStack.length > 0 && !isCpuThinking && !isSowing && !gameState.isGameOver;

  const getPitCenter = useCallback((pitIndex: number): { x: number; y: number } | null => {
    if (!boardRef.current) return null;
    const boardRect = boardRef.current.getBoundingClientRect();
    const pitEl = boardRef.current.querySelector(`[data-pit-index="${pitIndex}"]`);
    if (!pitEl) return null;
    const pitRect = pitEl.getBoundingClientRect();
    return { x: pitRect.left + pitRect.width / 2 - boardRect.left, y: pitRect.top + pitRect.height / 2 - boardRect.top };
  }, []);

  const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

  const buildSowSequence = useCallback((startState: BoardState, chosenPit: number) => {
    const seq: { pit: number; seedsLeft: number; isAvalanchePickup: boolean }[] = [];
    const t = startState.turn;
    if (variant === 'kalah' || variant === 'avalanche') {
      const oppStore = t === 0 ? KALAH_P1_STORE : KALAH_P0_STORE;
      const ownStore = t === 0 ? KALAH_P0_STORE : KALAH_P1_STORE;
      // Use mutable copy of pits so avalanche cascades use dynamically updated counts
      const mutablePits = [...startState.pits];
      let seeds = mutablePits[chosenPit];
      mutablePits[chosenPit] = 0;
      let curr = chosenPit;
      while (seeds > 0) {
        curr = (curr + 1) % 14;
        if (curr === oppStore) continue;
        seeds -= 1;
        mutablePits[curr] += 1;
        let isAP = false;
        if (variant === 'avalanche' && seeds === 0 && curr !== ownStore && mutablePits[curr] > 1) {
          // Landing in non-empty pit: pick up ALL seeds and keep sowing
          isAP = true;
          seeds = mutablePits[curr];
          mutablePits[curr] = 0;
        }
        seq.push({ pit: curr, seedsLeft: seeds, isAvalanchePickup: isAP });
      }
    } else {
      let seeds = startState.pits[chosenPit];
      let curr = chosenPit;
      while (seeds > 0) { curr = (curr + 1) % 12; if (curr === chosenPit) continue; seeds -= 1; seq.push({ pit: curr, seedsLeft: seeds, isAvalanchePickup: false }); }
    }
    return seq;
  }, [variant]);

  const clusterColor = variant === 'kalah' ? '#0070f3' : variant === 'avalanche' ? '#7928ca' : '#eb367f';

  const executeAnimatedMove = useCallback(async (pitIndex: number, targetState: BoardState) => {
    if (isSowing || !isMounted.current) return;
    setIsSowing(true); setActiveSowPit(pitIndex);

    // Push current state to undo stack before executing move
    setUndoStack(prev => [...prev, targetState]);

    let finalState: BoardState;
    if (variant === 'kalah') finalState = makeKalahMove(targetState, pitIndex);
    else if (variant === 'avalanche') finalState = makeAvalancheMove(targetState, pitIndex);
    else finalState = makeOwareMove(targetState, pitIndex);

    const capturedPits = finalState.moveHistory[0]?.capturedPits;
    const capturedCount = finalState.moveHistory[0]?.captured || 0;
    const currentPlayer = targetState.turn;
    const seq = buildSowSequence(targetState, pitIndex);
    if (seq.length === 0) { setIsSowing(false); setActiveSowPit(null); setIsCpuThinking(false); return; }

    const srcPos = getPitCenter(pitIndex);
    if (!srcPos) { setIsSowing(false); setActiveSowPit(null); setIsCpuThinking(false); return; }

    const totalSeeds = targetState.pits[pitIndex];
    const basePits = [...targetState.pits];
    basePits[pitIndex] = 0;

    // Pre-position cluster BEFORE making visible
    setClusterPos({ x: srcPos.x, y: srcPos.y });
    await delay(16);
    if (!isMounted.current) return;

    setGameState(prev => ({ ...prev, pits: basePits, statusMessage: `Player ${targetState.turn === 0 ? '1' : '2 (CPU)'} scoops seeds from Pit ${pitIndex + 1}...` }));
    setClusterSeedCount(totalSeeds);
    setClusterAnimClass('animate-cluster-scoop');
    setClusterVisible(true);
    await delay(300);
    if (!isMounted.current) return;

    setClusterAnimClass('');
    const updatedPits = [...basePits];

    for (let i = 0; i < seq.length; i++) {
      if (!isMounted.current) return;
      const step = seq[i];
      const { pit: targetPit, seedsLeft: remaining, isAvalanchePickup } = step;

      const toPos = getPitCenter(targetPit);
      if (toPos) { setClusterPos({ x: toPos.x, y: toPos.y }); setClusterAnimClass('animate-cluster-glide'); soundFx.playSow(); }
      await delay(120);
      if (!isMounted.current) return;

      if (isAvalanchePickup) {
        updatedPits[targetPit] = 0;
        setGameState(prev => ({ ...prev, pits: [...updatedPits], lastSownPit: targetPit, statusMessage: `Avalanche! Hand collects ${remaining + 1} seeds from Pit ${targetPit + 1}!` }));
        setClusterSeedCount(remaining);
        setClusterAnimClass('animate-avalanche-popup');
        await delay(300);
        if (!isMounted.current) return;
        setClusterAnimClass('');
      } else {
        // Drop one seed: pit +1 AND cluster -1 in same batch
        updatedPits[targetPit] += 1;
        setGameState(prev => ({ ...prev, pits: [...updatedPits], lastSownPit: targetPit, statusMessage: `Dropping seed into Pit ${targetPit + 1}...` }));
        setClusterSeedCount(remaining);
        setClusterAnimClass('');
        setCatchingPit(targetPit);
        setTimeout(() => { if (isMounted.current) setCatchingPit(null); }, 350);
        await delay(350);
        if (!isMounted.current) return;
      }
    }

    if (!isMounted.current) return;
    setClusterAnimClass('animate-hand-empty');
    await delay(300);
    if (!isMounted.current) return;
    setClusterVisible(false); setClusterSeedCount(0); setClusterAnimClass('');

    // Capture animation
    if (capturedCount > 0 && capturedPits && capturedPits.length > 0 && variant !== 'avalanche') {
      soundFx.playCapture();
      let targetStore = variant === 'kalah' ? (currentPlayer === 0 ? KALAH_P0_STORE : KALAH_P1_STORE) : (currentPlayer === 0 ? 0 : 6);
      const toPos = getPitCenter(targetStore);
      if (toPos) {
        const seeds: CaptureSeed[] = [];
        const spp = Math.max(1, Math.ceil(capturedCount / capturedPits.length));
        let si = 0;
        for (let p = 0; p < capturedPits.length && si < capturedCount; p++) {
          const fp = capturedPits[p];
          const fromPos = getPitCenter(fp);
          if (!fromPos) continue;
          const dx = toPos.x - fromPos.x, dy = toPos.y - fromPos.y;
          for (let s = 0; s < spp && si < capturedCount; s++) {
            const ox = (Math.random() - 0.5) * 30, oy = (Math.random() - 0.5) * 30;
            seeds.push({ id: si, fromPit: fp, toStore: targetStore, startX: fromPos.x + ox, startY: fromPos.y + oy, deltaX: dx + ox, deltaY: dy + oy, delay: p * 180 + s * 120 + Math.random() * 60, player: currentPlayer });
            si++;
          }
        }
        if (seeds.length > 0) {
          setCaptureGlowPits(capturedPits); setCaptureStoreGlow(true);
          setCaptureAnim({ active: true, seeds, fromPits: capturedPits, toStore: targetStore, player: currentPlayer });
          seeds.forEach(s => {
            setTimeout(() => {
              if (!isMounted.current) return;
              const el = boardRef.current?.querySelector(`[data-capture-seed="${s.id}"]`) as HTMLElement | null;
              if (!el) return;
              el.style.transition = 'transform 0.9s cubic-bezier(0.1, 0.7, 0.2, 1), opacity 0.3s ease-in';
              el.style.transform = `translate(${s.deltaX}px, ${s.deltaY}px) scale(0.3)`;
              el.style.opacity = '0';
            }, s.delay);
          });
          const lastDelay = seeds.reduce((max, s) => Math.max(max, s.delay), 0);
          await delay(lastDelay + 1100);
        }
      }
    }

    if (!isMounted.current) return;
    if (finalState.extraTurn) soundFx.playExtraTurn();
    setCaptureAnim({ active: false, seeds: [], fromPits: [], toStore: -1, player: 0 });
    setCaptureGlowPits([]); setCaptureStoreGlow(false);
    setGameState(finalState);
    setIsSowing(false); setActiveSowPit(null); setHandCount(0); setDroppingPit(null); setIsCpuThinking(false);
    if (finalState.isGameOver) handleGameOver(finalState);
  }, [variant, isSowing, handleGameOver, buildSowSequence, getPitCenter, clusterColor]);

  const thinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (thinkingTimerRef.current) { clearTimeout(thinkingTimerRef.current); thinkingTimerRef.current = null; }
    setIsCpuThinking(false);
    if (mode === 'pvc' && gameState.turn === 1 && !gameState.isGameOver && !isSowing) {
      thinkingTimerRef.current = setTimeout(() => {
        if (!isMounted.current || gameState.isGameOver || isSowing) return;
        setIsCpuThinking(true);
        requestAnimationFrame(() => {
          if (!isMounted.current) return;
          const cpuMove = getBestCpuMove(gameState, variant, difficulty);
          if (cpuMove !== null) executeAnimatedMove(cpuMove, gameState); else setIsCpuThinking(false);
        });
      }, 500);
    }
    return () => { if (thinkingTimerRef.current) { clearTimeout(thinkingTimerRef.current); thinkingTimerRef.current = null; } };
  }, [gameState, mode, variant, difficulty, isSowing, executeAnimatedMove]);

  const handlePitClick = (pitIndex: number) => {
    if (gameState.isGameOver || isCpuThinking || isSowing) return;
    if (mode === 'pvc' && gameState.turn === 1) return;
    executeAnimatedMove(pitIndex, gameState);
  };

  const renderSeedDots = (count: number) => {
    if (count === 0) return null;
    const maxVisible = 16;
    const displayCount = Math.min(count, maxVisible);
    return (
      <div className="relative flex flex-wrap items-center justify-center gap-1 max-w-[80%] px-1">
        {Array.from({ length: displayCount }).map((_, i) => (
          <span key={i} className="h-3 w-3 rounded-full bg-[#171717]"
            style={{ transform: `scale(${1 - Math.min(i, 8) * 0.03})` }} />
        ))}
        {count > maxVisible && <span className="font-mono-code text-[9px] font-bold text-[#666]">+{count - maxVisible}</span>}
      </div>
    );
  };

  const renderSeedCluster = () => {
    if (!clusterVisible) return null;
    return (
      <div className={`absolute pointer-events-none z-40 ${clusterAnimClass}`}
        style={{ left: clusterPos.x, top: clusterPos.y, width: 44, height: 44, transform: 'translate(-50%,-50%)', transition: 'left 0.3s cubic-bezier(0.2,0,0,1), top 0.3s cubic-bezier(0.2,0,0,1)' }}>
        <div className="absolute inset-1 flex items-center justify-center flex-wrap gap-px p-0.5">
          {Array.from({ length: Math.min(clusterSeedCount, 12) }).map((_, i) => (
            <span key={i} className="rounded-full" style={{ width: 10, height: 10, backgroundColor: '#171717' }} />
          ))}
          {clusterSeedCount > 12 && <span className="absolute -top-0.5 -right-0.5 text-[7px] font-bold text-white font-mono-code bg-black rounded-full px-0.5 leading-none">+{clusterSeedCount - 12}</span>}
        </div>
      </div>
    );
  };

  const renderCaptureFlyingSeeds = () => {
    if (!captureAnim.active || captureAnim.seeds.length === 0) return null;
    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
        {captureAnim.seeds.map(seed => (
          <span key={seed.id} data-capture-seed={seed.id} className="absolute rounded-full"
            style={{ width: 10, height: 10, backgroundColor: '#171717', left: seed.startX, top: seed.startY, transform: 'translate(-50%,-50%)', opacity: 1, zIndex: 40 }} />
        ))}
      </div>
    );
  };

  const isKalahType = variant === 'kalah' || variant === 'avalanche';
  const renderPitBtn = (pitIdx: number, seedCount: number, canClick: boolean, isPitActive: boolean, isCapturedPit: boolean, isCatching: boolean, label: string, topRow: boolean) => (
    <button key={pitIdx} data-pit-index={pitIdx} disabled={!canClick} onClick={() => handlePitClick(pitIdx)}
      onMouseEnter={() => setHoveredPit(pitIdx)} onMouseLeave={() => setHoveredPit(null)}
      className={`relative flex flex-col items-center justify-between h-24 rounded-xl border bg-white p-2 transition-all duration-200 ${canClick ? 'hover:border-black hover:-translate-y-1 hover:shadow-md active:scale-95 cursor-pointer' : 'cursor-default'} ${isCapturedPit ? 'border-[#ffd700] animate-capture-glow bg-[#fffef0] scale-105 shadow-lg' : ''} ${isCatching ? 'border-[#171717] animate-pit-catch bg-[#f5f5f5] scale-105 shadow-md' : ''} ${isPitActive && !isCapturedPit && !isCatching ? `border-[${topRow ? '#7928ca' : '#0070f3'}] animate-pit-glow bg-[${topRow ? '#f8f5ff' : '#eef6ff'}] scale-105 shadow-md` : ''}`}>
      <span className={`font-mono-code text-[10px] ${topRow ? 'text-[#888888]' : 'text-[#0070f3]'}`}>{label}</span>
      <div className="my-auto flex items-center justify-center">{renderSeedDots(seedCount)}</div>
      <span className="font-mono-code text-xs font-bold text-[#171717]">{seedCount}</span>
    </button>
  );

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#ebebeb] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-mono-code text-xs text-[#888888]">MODE:</span>
          <div className="inline-flex rounded-lg border border-[#ebebeb] bg-[#fafafa] p-0.5">
            <button onClick={() => setMode('pvc')} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${mode === 'pvc' ? 'bg-black text-white shadow-sm scale-102' : 'text-[#4d4d4d] hover:text-black'}`}><Cpu className="h-3.5 w-3.5" /> vs Computer</button>
            <button onClick={() => setMode('pvp')} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${mode === 'pvp' ? 'bg-black text-white shadow-sm scale-102' : 'text-[#4d4d4d] hover:text-black'}`}><Users className="h-3.5 w-3.5" /> 2 Players</button>
          </div>
        </div>
        {mode === 'pvc' && (
          <div className="flex items-center gap-2">
            <span className="font-mono-code text-xs text-[#888888]">DIFFICULTY:</span>
            <div className="inline-flex rounded-lg border border-[#ebebeb] bg-[#fafafa] p-0.5">
              {(['easy', 'medium', 'hard'] as const).map(d => (
                <button key={d} onClick={() => setDifficulty(d)} className={`capitalize rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${difficulty === d ? 'bg-black text-white shadow-sm scale-102' : 'text-[#4d4d4d] hover:text-black'}`}>{d}</button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button onClick={handleUndo} disabled={!canUndo} className="flex items-center gap-1.5 rounded-lg border border-[#ebebeb] bg-[#fafafa] px-3 py-1.5 text-xs font-medium text-[#171717] hover:bg-[#f5f5f5] transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"><Undo2 className="h-3.5 w-3.5" /> Undo</button>
          <button onClick={startNewGame} className="flex items-center gap-1.5 rounded-lg border border-[#ebebeb] bg-[#fafafa] px-3 py-1.5 text-xs font-medium text-[#171717] hover:bg-[#f5f5f5] transition active:scale-95"><RotateCcw className="h-3.5 w-3.5" /> New Match</button>
        </div>
      </div>

      <div className={`relative overflow-hidden rounded-xl border border-[#ebebeb] bg-white p-4 shadow-sm text-center transition-all duration-300 ${gameState.extraTurn ? 'animate-extra-turn' : ''}`}>
        <div className="flex items-center justify-between px-2">
          <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all duration-300 ${gameState.turn === 0 && !gameState.isGameOver ? 'bg-black text-white font-semibold scale-102 shadow-md' : 'text-[#666]'}`}>
            <span className="h-2 w-2 rounded-full bg-[#0070f3] animate-pulse" /><span className="text-xs font-medium">Player 1 (Bottom)</span>
            <span className="font-mono-code text-xs ml-2 animate-score-bump">Score: {gameState.scores[0]}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-mono-code text-[11px] text-[#888888] tracking-wider uppercase">{variant} MANCALA</span>
            <p key={gameState.statusMessage} className="text-sm font-semibold text-[#171717] flex items-center gap-1.5 animate-fade-slide">
              {isCpuThinking && <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#7928ca] animate-ping" />}{gameState.statusMessage}
            </p>
            {isSowing && <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#171717] px-3 py-1 text-white shadow-lg animate-float-hand">
              <span className="text-xs">🌱</span><span className="font-mono-code text-xs font-bold">HAND: {clusterSeedCount} SEED{clusterSeedCount !== 1 ? 'S' : ''} REMAINING</span>
            </div>}
          </div>
          <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all duration-300 ${gameState.turn === 1 && !gameState.isGameOver ? 'bg-black text-white font-semibold scale-102 shadow-md' : 'text-[#666]'}`}>
            <span className="h-2 w-2 rounded-full bg-[#eb367f] animate-pulse" /><span className="text-xs font-medium">{mode === 'pvc' ? `CPU (${difficulty})` : 'Player 2 (Top)'}</span>
            <span className="font-mono-code text-xs ml-2 animate-score-bump">Score: {gameState.scores[1]}</span>
          </div>
        </div>
      </div>

      <div ref={boardRef} className="relative rounded-2xl border border-[#ebebeb] bg-[#fafafa] p-6 shadow-lg overflow-hidden">
        {renderCaptureFlyingSeeds()}{renderSeedCluster()}

        {isKalahType ? (
          <div className="grid grid-cols-8 gap-3 items-center">
            <div data-pit-index={13} className={`col-span-1 flex flex-col items-center justify-center h-56 rounded-2xl border-2 bg-white p-2 shadow-inner transition-all duration-300 ${captureStoreGlow && captureAnim.player === 1 ? 'border-[#ffd700] bg-[#fffef0] shadow-lg animate-store-capture' : gameState.lastSownPit === 13 ? 'border-[#eb367f] animate-pit-glow shadow-lg bg-[#fff0f5]' : 'border-[#ebebeb]'}`}>
              <span className="font-mono-code text-[10px] text-[#888888] mb-1">{mode === 'pvc' ? 'CPU STORE' : 'P2 STORE'}</span>
              <span className={`text-2xl font-bold font-mono-code text-[#171717] transition-all duration-300 ${captureStoreGlow && captureAnim.player === 1 ? 'scale-110 text-[#ffd700]' : 'animate-score-bump'}`}>{gameState.pits[13]}</span>
              <div className="mt-3 flex-1 flex items-center justify-center">{renderSeedDots(gameState.pits[13])}</div>
            </div>
            <div className="col-span-6 flex flex-col gap-4">
              <div className="grid grid-cols-6 gap-2">{[12, 11, 10, 9, 8, 7].map(idx => renderPitBtn(idx, gameState.pits[idx], gameState.turn === 1 && mode === 'pvp' && gameState.pits[idx] > 0 && !gameState.isGameOver && !isSowing, gameState.lastSownPit === idx || activeSowPit === idx, captureGlowPits.includes(idx), catchingPit === idx, `Pit ${idx}`, true))}</div>
              <div className="grid grid-cols-6 gap-2">{[0, 1, 2, 3, 4, 5].map(idx => renderPitBtn(idx, gameState.pits[idx], gameState.turn === 0 && gameState.pits[idx] > 0 && !gameState.isGameOver && !isCpuThinking && !isSowing, gameState.lastSownPit === idx || activeSowPit === idx, captureGlowPits.includes(idx), catchingPit === idx, `Pit ${idx + 1}`, false))}</div>
            </div>
            <div data-pit-index={6} className={`col-span-1 flex flex-col items-center justify-center h-56 rounded-2xl border-2 bg-white p-2 shadow-inner transition-all duration-300 ${captureStoreGlow && captureAnim.player === 0 ? 'border-[#ffd700] bg-[#fffef0] shadow-lg animate-store-capture' : gameState.lastSownPit === 6 ? 'border-[#0070f3] animate-pit-glow shadow-lg bg-[#eef6ff]' : 'border-[#0070f3]/30'}`}>
              <span className="font-mono-code text-[10px] text-[#0070f3] mb-1">P1 STORE</span>
              <span className={`text-2xl font-bold font-mono-code text-[#171717] transition-all duration-300 ${captureStoreGlow && captureAnim.player === 0 ? 'scale-110 text-[#ffd700]' : 'animate-score-bump'}`}>{gameState.pits[6]}</span>
              <div className="mt-3 flex-1 flex items-center justify-center">{renderSeedDots(gameState.pits[6])}</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-w-4xl mx-auto">
            <div className="grid grid-cols-6 gap-3">{[11, 10, 9, 8, 7, 6].map(idx => renderPitBtn(idx, gameState.pits[idx], gameState.turn === 1 && mode === 'pvp' && gameState.pits[idx] > 0 && !gameState.isGameOver && !isSowing, gameState.lastSownPit === idx || activeSowPit === idx, captureGlowPits.includes(idx), catchingPit === idx, `Pit ${idx + 1}`, true))}</div>
            <div className="flex items-center justify-between px-6 py-2.5 rounded-lg bg-white border border-[#ebebeb] shadow-xs">
              <div className="flex items-center gap-2"><span className="text-xs font-semibold text-[#0070f3]">Player 1:</span><span className="font-mono-code font-bold text-base text-[#171717] animate-score-bump">{gameState.scores[0]}/25</span></div>
              <div className="text-xs font-mono-code text-[#888888]">FIRST TO 25 WINS</div>
              <div className="flex items-center gap-2"><span className="text-xs font-semibold text-[#eb367f]">{mode === 'pvc' ? 'CPU:' : 'P2:'}</span><span className="font-mono-code font-bold text-base text-[#171717] animate-score-bump">{gameState.scores[1]}/25</span></div>
            </div>
            <div className="grid grid-cols-6 gap-3">{[0, 1, 2, 3, 4, 5].map(idx => renderPitBtn(idx, gameState.pits[idx], gameState.turn === 0 && gameState.pits[idx] > 0 && !gameState.isGameOver && !isCpuThinking && !isSowing, gameState.lastSownPit === idx || activeSowPit === idx, captureGlowPits.includes(idx), catchingPit === idx, `Pit ${idx + 1}`, false))}</div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[#ebebeb] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-[#ebebeb] pb-2">
          <span className="font-mono-code text-xs font-semibold text-[#171717]">MOVE HISTORY LOG</span>
          <span className="font-mono-code text-[11px] text-[#888888]">{gameState.moveHistory.length} Moves</span>
        </div>
        {gameState.moveHistory.length === 0 ? <p className="text-xs text-[#888888] font-mono-code py-2 text-center">No moves recorded yet.</p> : (
          <div className="max-h-36 overflow-y-auto flex flex-col gap-1.5 pr-2">
            {gameState.moveHistory.slice(0, 10).map((r, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1 px-2.5 rounded bg-[#fafafa] border border-[#ebebeb] animate-fade-slide">
                <div className="flex items-center gap-2">
                  <span className="font-mono-code text-[10px] text-[#888888]">{r.timestamp}</span>
                  <span className="font-semibold text-[#171717]">{r.player === 0 ? 'Player 1' : mode === 'pvc' ? 'CPU' : 'Player 2'}</span>
                  <span className="text-[#666]">Pit {r.pitIndex + 1}</span>
                </div>
                <div className="flex items-center gap-3 font-mono-code text-[11px]">
                  {r.captured > 0 && variant !== 'avalanche' && <span className="text-[#ffd700] font-semibold flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#ffd700] animate-pulse" />+{r.captured}</span>}
                  {r.extraTurn && <span className="text-[#7928ca] font-semibold">Extra!</span>}
                  <span className="text-[#888888]">{r.seedsSown}s</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <WinnerPopup isOpen={showWinnerPopup} winner={gameState.winner} scores={gameState.scores} variant={variant} mode={mode} onNewGame={startNewGame} />
    </div>
  );
};

