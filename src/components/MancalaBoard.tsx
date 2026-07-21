import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Cpu, Users, RotateCcw, Award, Play, AlertCircle, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import type { GameVariant, GameMode, Difficulty, BoardState, Player } from '../lib/types';
import { createInitialKalahState, makeKalahMove, KALAH_P0_STORE, KALAH_P1_STORE } from '../lib/kalah';
import { createInitialAvalancheState, makeAvalancheMove } from '../lib/avalanche';
import { createInitialOwareState, makeOwareMove } from '../lib/oware';
import { getBestCpuMove } from '../lib/ai';
import { soundFx } from '../lib/sound';

interface MancalaBoardProps {
  variant: GameVariant;
  onGameEnd?: (winner: Player | 'draw', variant: GameVariant, mode: GameMode, difficulty: Difficulty) => void;
}

interface SowFrame {
  pits: number[];
  currentPit: number;
  seedsInHand: number;
  actionText?: string;
  isDroppingSeed?: boolean;
}

export const MancalaBoard: React.FC<MancalaBoardProps> = ({ variant, onGameEnd }) => {
  const [mode, setMode] = useState<GameMode>('pvc');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [firstPlayer, setFirstPlayer] = useState<Player>(0);

  const [gameState, setGameState] = useState<BoardState>(() => getInitialState(variant));
  const [isCpuThinking, setIsCpuThinking] = useState(false);
  const [isSowing, setIsSowing] = useState(false);
  const [activeSowPit, setActiveSowPit] = useState<number | null>(null);
  const [handCount, setHandCount] = useState<number>(0);
  const [hoveredPit, setHoveredPit] = useState<number | null>(null);
  const [droppingPit, setDroppingPit] = useState<number | null>(null);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  function getInitialState(varType: GameVariant): BoardState {
    if (varType === 'kalah') return createInitialKalahState(4);
    if (varType === 'avalanche') return createInitialAvalancheState(4);
    return createInitialOwareState();
  }

  const startNewGame = useCallback(() => {
    const initialState = getInitialState(variant);
    initialState.turn = firstPlayer;
    if (firstPlayer === 1 && mode === 'pvc') {
      initialState.statusMessage = "CPU plays first! Thinking...";
    }
    setGameState(initialState);
    setIsCpuThinking(false);
    setIsSowing(false);
    setActiveSowPit(null);
    setHandCount(0);
    setDroppingPit(null);
  }, [variant, firstPlayer, mode]);

  useEffect(() => {
    startNewGame();
  }, [variant, mode, difficulty, firstPlayer, startNewGame]);

  const handleGameOver = useCallback(
    (finalState: BoardState) => {
      soundFx.playWin();
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
      });
      if (onGameEnd && finalState.winner !== null) {
        onGameEnd(finalState.winner, variant, mode, difficulty);
      }
    },
    [onGameEnd, variant, mode, difficulty]
  );

  // Generate step-by-step frames for sequential sowing animation
  const generateSowFrames = (startState: BoardState, chosenPit: number): SowFrame[] => {
    const frames: SowFrame[] = [];
    const tempPits = [...startState.pits];
    const currentTurn = startState.turn;

    if (variant === 'kalah' || variant === 'avalanche') {
      const oppStore = currentTurn === 0 ? KALAH_P1_STORE : KALAH_P0_STORE;
      const ownStore = currentTurn === 0 ? KALAH_P0_STORE : KALAH_P1_STORE;

      let seeds = tempPits[chosenPit];
      tempPits[chosenPit] = 0;
      let curr = chosenPit;

      while (seeds > 0) {
        curr = (curr + 1) % 14;
        if (curr === oppStore) continue; // Skip opponent store

        tempPits[curr] += 1;
        seeds -= 1;

        if (variant === 'avalanche' && seeds === 0 && curr !== ownStore && tempPits[curr] > 1) {
          // Avalanche continuous pickup frame
          frames.push({
            pits: [...tempPits],
            currentPit: curr,
            seedsInHand: seeds,
            isDroppingSeed: true,
            actionText: `Avalanche! Picked up ${tempPits[curr]} seeds from Pit ${curr + 1}!`,
          });
          seeds = tempPits[curr];
          tempPits[curr] = 0;
        }

        frames.push({
          pits: [...tempPits],
          currentPit: curr,
          seedsInHand: seeds,
          isDroppingSeed: true,
        });
      }
    } else {
      // Oware variant
      let seeds = tempPits[chosenPit];
      tempPits[chosenPit] = 0;
      let curr = chosenPit;

      while (seeds > 0) {
        curr = (curr + 1) % 12;
        if (curr === chosenPit) continue; // Skip origin pit on full round

        tempPits[curr] += 1;
        seeds -= 1;

        frames.push({
          pits: [...tempPits],
          currentPit: curr,
          seedsInHand: seeds,
          isDroppingSeed: true,
        });
      }
    }

    return frames;
  };

  // Step-by-step sowing animator (350ms speed per seed for readable pacing)
  const executeAnimatedMove = useCallback(
    (pitIndex: number, targetState: BoardState) => {
      if (isSowing) return;
      setIsSowing(true);
      setActiveSowPit(pitIndex);

      const frames = generateSowFrames(targetState, pitIndex);
      if (frames.length === 0) {
        setIsSowing(false);
        setActiveSowPit(null);
        setIsCpuThinking(false);
        return;
      }

      let frameIdx = 0;
      const initialHand = targetState.pits[pitIndex];
      setHandCount(initialHand);

      const interval = setInterval(() => {
        if (!isMounted.current) {
          clearInterval(interval);
          return;
        }

        const frame = frames[frameIdx];
        soundFx.playSow();
        setDroppingPit(frame.currentPit);

        setGameState((prev) => ({
          ...prev,
          pits: frame.pits,
          lastSownPit: frame.currentPit,
          statusMessage: frame.actionText || `${targetState.turn === 0 ? 'Player 1' : 'CPU / Player 2'} dropping seed into Pit ${frame.currentPit + 1}...`,
        }));
        setHandCount(frame.seedsInHand);

        frameIdx++;

        if (frameIdx >= frames.length) {
          clearInterval(interval);

          // Apply final state logic
          setTimeout(() => {
            if (!isMounted.current) return;

            let finalState: BoardState;
            if (variant === 'kalah') finalState = makeKalahMove(targetState, pitIndex);
            else if (variant === 'avalanche') finalState = makeAvalancheMove(targetState, pitIndex);
            else finalState = makeOwareMove(targetState, pitIndex);

            if (finalState.extraTurn) soundFx.playExtraTurn();
            else if (finalState.moveHistory[0]?.captured > 0) soundFx.playCapture();

            setGameState(finalState);
            setIsSowing(false);
            setActiveSowPit(null);
            setHandCount(0);
            setDroppingPit(null);
            setIsCpuThinking(false);

            if (finalState.isGameOver) {
              handleGameOver(finalState);
            }
          }, 350);
        }
      }, 380); // 380ms per seed step: comfortable pacing for hand movement + seed dropping
    },
    [variant, isSowing, handleGameOver]
  );

  // CPU turn trigger effect
  useEffect(() => {
    if (mode === 'pvc' && gameState.turn === 1 && !gameState.isGameOver && !isCpuThinking && !isSowing) {
      setIsCpuThinking(true);
      const timer = setTimeout(() => {
        if (!isMounted.current) return;
        const cpuMove = getBestCpuMove(gameState, variant, difficulty);
        if (cpuMove !== null) {
          executeAnimatedMove(cpuMove, gameState);
        } else {
          setIsCpuThinking(false);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [gameState, mode, variant, difficulty, isCpuThinking, isSowing, executeAnimatedMove]);

  const handlePitClick = (pitIndex: number) => {
    if (gameState.isGameOver || isCpuThinking || isSowing) return;
    if (mode === 'pvc' && gameState.turn === 1) return; // CPU turn

    executeAnimatedMove(pitIndex, gameState);
  };

  // Helper to render animated seed dots inside pit with falling seed animation
  const renderSeedDots = (pitIdx: number, count: number, isPitActive: boolean, isDropping: boolean) => {
    if (count === 0 && !isDropping) return null;
    const maxVisible = 16;
    const displayCount = Math.min(count, maxVisible);
    const seeds = Array.from({ length: displayCount });

    return (
      <div className="relative flex flex-wrap items-center justify-center gap-1 max-w-[80%] px-1">
        {/* Animated Dropping Seed indicator when seed lands in this pit */}
        {isDropping && (
          <span className="absolute -top-6 h-3.5 w-3.5 rounded-full bg-[#0070f3] border-2 border-white shadow-lg animate-seed-drop-fall z-20" />
        )}

        {seeds.map((_, i) => (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-full bg-[#171717] shadow-sm transition-all duration-300 ${
              isPitActive ? 'bg-[#0070f3] scale-110' : ''
            }`}
            style={{
              transform: `scale(${1 - Math.min(i, 8) * 0.03})`,
            }}
          />
        ))}
        {count > maxVisible && (
          <span className="font-mono-code text-[9px] font-bold text-[#666]">
            +{count - maxVisible}
          </span>
        )}
      </div>
    );
  };

  const isKalahType = variant === 'kalah' || variant === 'avalanche';

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {/* Game Config Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#ebebeb] bg-white p-4 shadow-sm">
        {/* Mode Selector */}
        <div className="flex items-center gap-2">
          <span className="font-mono-code text-xs text-[#888888]">MODE:</span>
          <div className="inline-flex rounded-lg border border-[#ebebeb] bg-[#fafafa] p-0.5">
            <button
              onClick={() => setMode('pvc')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                mode === 'pvc'
                  ? 'bg-black text-white shadow-sm scale-102'
                  : 'text-[#4d4d4d] hover:text-black'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              vs Computer
            </button>
            <button
              onClick={() => setMode('pvp')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                mode === 'pvp'
                  ? 'bg-black text-white shadow-sm scale-102'
                  : 'text-[#4d4d4d] hover:text-black'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              2 Players
            </button>
          </div>
        </div>

        {/* Difficulty Selector (if PVC) */}
        {mode === 'pvc' && (
          <div className="flex items-center gap-2">
            <span className="font-mono-code text-xs text-[#888888]">DIFFICULTY:</span>
            <div className="inline-flex rounded-lg border border-[#ebebeb] bg-[#fafafa] p-0.5">
              {(['easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`capitalize rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    difficulty === diff
                      ? 'bg-black text-white shadow-sm scale-102'
                      : 'text-[#4d4d4d] hover:text-black'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={startNewGame}
          className="flex items-center gap-1.5 rounded-lg border border-[#ebebeb] bg-[#fafafa] px-3 py-1.5 text-xs font-medium text-[#171717] hover:bg-[#f5f5f5] transition active:scale-95"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          New Match
        </button>
      </div>

      {/* Turn Banner & Game Status */}
      <div className={`relative overflow-hidden rounded-xl border border-[#ebebeb] bg-white p-4 shadow-sm text-center transition-all duration-300 ${
        gameState.extraTurn ? 'animate-extra-turn' : ''
      }`}>
        <div className="flex items-center justify-between px-2">
          {/* Player 1 Card */}
          <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all duration-300 ${
            gameState.turn === 0 && !gameState.isGameOver ? 'bg-black text-white font-semibold scale-102 shadow-md' : 'text-[#666]'
          }`}>
            <span className="h-2 w-2 rounded-full bg-[#0070f3] animate-pulse" />
            <span className="text-xs font-medium">Player 1 (Bottom)</span>
            <span className="font-mono-code text-xs ml-2 animate-score-bump">Score: {gameState.scores[0]}</span>
          </div>

          {/* Status Message & Floating Sowing Hand Indicator */}
          <div className="flex flex-col items-center">
            <span className="font-mono-code text-[11px] text-[#888888] tracking-wider uppercase">
              {variant} MANCALA
            </span>
            <p key={gameState.statusMessage} className="text-sm font-semibold text-[#171717] flex items-center gap-1.5 animate-fade-slide">
              {isCpuThinking && <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#7928ca] animate-ping" />}
              {gameState.statusMessage}
            </p>

            {/* COLLECTIVE SEED HAND WIDGET */}
            {isSowing && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#171717] px-3 py-1 text-white shadow-lg animate-float-hand">
                <span className="text-xs">🌱</span>
                <span className="font-mono-code text-xs font-bold">
                  SOWING HAND: {handCount} SEED{handCount !== 1 ? 'S' : ''} REMAINING
                </span>
                <div className="flex items-center gap-0.5 ml-1">
                  {Array.from({ length: Math.min(handCount, 6) }).map((_, i) => (
                    <span key={i} className="h-2 w-2 rounded-full bg-[#00dfd8] shadow-xs" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Player 2 / CPU Card */}
          <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all duration-300 ${
            gameState.turn === 1 && !gameState.isGameOver ? 'bg-black text-white font-semibold scale-102 shadow-md' : 'text-[#666]'
          }`}>
            <span className="h-2 w-2 rounded-full bg-[#eb367f] animate-pulse" />
            <span className="text-xs font-medium">{mode === 'pvc' ? `CPU (${difficulty})` : 'Player 2 (Top)'}</span>
            <span className="font-mono-code text-xs ml-2 animate-score-bump">Score: {gameState.scores[1]}</span>
          </div>
        </div>
      </div>

      {/* MAIN MANCALA BOARD CONTAINER */}
      <div className="relative rounded-2xl border border-[#ebebeb] bg-[#fafafa] p-6 shadow-lg">
        {isKalahType ? (
          /* KALAH & AVALANCHE BOARD LAYOUT (14 Pits + Stores) */
          <div className="grid grid-cols-8 gap-3 items-center">
            {/* Player 2 / CPU Store (Pit 13) */}
            <div className={`col-span-1 flex flex-col items-center justify-center h-56 rounded-2xl border-2 bg-white p-2 shadow-inner transition-all duration-300 ${
              gameState.lastSownPit === 13 ? 'border-[#eb367f] animate-pit-glow shadow-lg bg-[#fff0f5]' : 'border-[#ebebeb]'
            }`}>
              <span className="font-mono-code text-[10px] text-[#888888] mb-1">
                {mode === 'pvc' ? 'CPU STORE' : 'P2 STORE'}
              </span>
              <span className="text-2xl font-bold font-mono-code text-[#171717] animate-score-bump">
                {gameState.pits[13]}
              </span>
              <div className="mt-3 flex-1 flex items-center justify-center">
                {renderSeedDots(13, gameState.pits[13], gameState.lastSownPit === 13, droppingPit === 13)}
              </div>
            </div>

            {/* Pits Grid (Top: 12..7, Bottom: 0..5) */}
            <div className="col-span-6 flex flex-col gap-4">
              {/* TOP ROW: P2 / CPU Pits (12, 11, 10, 9, 8, 7) */}
              <div className="grid grid-cols-6 gap-2">
                {[12, 11, 10, 9, 8, 7].map((pitIdx) => {
                  const seedCount = gameState.pits[pitIdx];
                  const isTurn = gameState.turn === 1;
                  const canClick = isTurn && mode === 'pvp' && seedCount > 0 && !gameState.isGameOver && !isSowing;
                  const isPitActive = gameState.lastSownPit === pitIdx || activeSowPit === pitIdx;
                  const isDropping = droppingPit === pitIdx;

                  return (
                    <button
                      key={pitIdx}
                      disabled={!canClick}
                      onClick={() => handlePitClick(pitIdx)}
                      onMouseEnter={() => setHoveredPit(pitIdx)}
                      onMouseLeave={() => setHoveredPit(null)}
                      className={`relative flex flex-col items-center justify-between h-24 rounded-xl border bg-white p-2 transition-all duration-200 ${
                        canClick ? 'hover:border-black hover:-translate-y-1 hover:shadow-md active:scale-95 cursor-pointer' : 'cursor-default'
                      } ${isPitActive ? 'border-[#7928ca] animate-pit-glow bg-[#f8f5ff] scale-105 shadow-md' : ''}`}
                    >
                      <span className="font-mono-code text-[10px] text-[#888888]">Pit {pitIdx}</span>
                      <div className="my-auto flex items-center justify-center">
                        {renderSeedDots(pitIdx, seedCount, isPitActive, isDropping)}
                      </div>
                      <span className="font-mono-code text-xs font-bold text-[#171717]">
                        {seedCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* BOTTOM ROW: Player 1 Pits (0, 1, 2, 3, 4, 5) */}
              <div className="grid grid-cols-6 gap-2">
                {[0, 1, 2, 3, 4, 5].map((pitIdx) => {
                  const seedCount = gameState.pits[pitIdx];
                  const isTurn = gameState.turn === 0;
                  const canClick = isTurn && seedCount > 0 && !gameState.isGameOver && !isCpuThinking && !isSowing;
                  const isPitActive = gameState.lastSownPit === pitIdx || activeSowPit === pitIdx;
                  const isDropping = droppingPit === pitIdx;

                  return (
                    <button
                      key={pitIdx}
                      disabled={!canClick}
                      onClick={() => handlePitClick(pitIdx)}
                      onMouseEnter={() => setHoveredPit(pitIdx)}
                      onMouseLeave={() => setHoveredPit(null)}
                      className={`relative flex flex-col items-center justify-between h-24 rounded-xl border bg-white p-2 transition-all duration-200 ${
                        canClick ? 'hover:border-[#0070f3] hover:-translate-y-1 hover:shadow-md active:scale-95 cursor-pointer border-[#0070f3]/40' : 'cursor-default'
                      } ${isPitActive ? 'border-[#0070f3] animate-pit-glow bg-[#eef6ff] scale-105 shadow-md' : ''}`}
                    >
                      <span className="font-mono-code text-[10px] text-[#0070f3]">Pit {pitIdx + 1}</span>
                      <div className="my-auto flex items-center justify-center">
                        {renderSeedDots(pitIdx, seedCount, isPitActive, isDropping)}
                      </div>
                      <span className="font-mono-code text-xs font-bold text-[#171717]">
                        {seedCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Player 1 Store (Pit 6) */}
            <div className={`col-span-1 flex flex-col items-center justify-center h-56 rounded-2xl border-2 bg-white p-2 shadow-inner transition-all duration-300 ${
              gameState.lastSownPit === 6 ? 'border-[#0070f3] animate-pit-glow shadow-lg bg-[#eef6ff]' : 'border-[#0070f3]/30'
            }`}>
              <span className="font-mono-code text-[10px] text-[#0070f3] mb-1">P1 STORE</span>
              <span className="text-2xl font-bold font-mono-code text-[#171717] animate-score-bump">
                {gameState.pits[6]}
              </span>
              <div className="mt-3 flex-1 flex items-center justify-center">
                {renderSeedDots(6, gameState.pits[6], gameState.lastSownPit === 6, droppingPit === 6)}
              </div>
            </div>
          </div>
        ) : (
          /* OWARE / AWALE BOARD LAYOUT (12 Pits without side stores) */
          <div className="flex flex-col gap-4 max-w-4xl mx-auto">
            {/* Top Row: Opponent Pits 11..6 */}
            <div className="grid grid-cols-6 gap-3">
              {[11, 10, 9, 8, 7, 6].map((pitIdx) => {
                const seedCount = gameState.pits[pitIdx];
                const isTurn = gameState.turn === 1;
                const canClick = isTurn && mode === 'pvp' && seedCount > 0 && !gameState.isGameOver && !isSowing;
                const isPitActive = gameState.lastSownPit === pitIdx || activeSowPit === pitIdx;
                const isDropping = droppingPit === pitIdx;

                return (
                  <button
                    key={pitIdx}
                    disabled={!canClick}
                    onClick={() => handlePitClick(pitIdx)}
                    onMouseEnter={() => setHoveredPit(pitIdx)}
                    onMouseLeave={() => setHoveredPit(null)}
                    className={`relative flex flex-col items-center justify-between h-28 rounded-xl border bg-white p-2.5 transition-all duration-200 ${
                      canClick ? 'hover:border-black hover:-translate-y-1 hover:shadow-md active:scale-95 cursor-pointer' : 'cursor-default'
                    } ${isPitActive ? 'border-[#eb367f] animate-pit-glow bg-[#fff0f5] scale-105 shadow-md' : ''}`}
                  >
                    <span className="font-mono-code text-[10px] text-[#888888]">Pit {pitIdx + 1}</span>
                    <div className="my-auto flex items-center justify-center">
                      {renderSeedDots(pitIdx, seedCount, isPitActive, isDropping)}
                    </div>
                    <span className="font-mono-code text-xs font-bold text-[#171717]">
                      {seedCount}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Middle Score Divider */}
            <div className="flex items-center justify-between px-6 py-2.5 rounded-lg bg-white border border-[#ebebeb] shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#0070f3]">Player 1 Score:</span>
                <span className="font-mono-code font-bold text-base text-[#171717] animate-score-bump">
                  {gameState.scores[0]} / 25
                </span>
              </div>
              <div className="text-xs font-mono-code text-[#888888]">
                FIRST TO 25 SEEDS WINS
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#eb367f]">
                  {mode === 'pvc' ? 'CPU' : 'Player 2'} Score:
                </span>
                <span className="font-mono-code font-bold text-base text-[#171717] animate-score-bump">
                  {gameState.scores[1]} / 25
                </span>
              </div>
            </div>

            {/* Bottom Row: Player 1 Pits 0..5 */}
            <div className="grid grid-cols-6 gap-3">
              {[0, 1, 2, 3, 4, 5].map((pitIdx) => {
                const seedCount = gameState.pits[pitIdx];
                const isTurn = gameState.turn === 0;
                const canClick = isTurn && seedCount > 0 && !gameState.isGameOver && !isCpuThinking && !isSowing;
                const isPitActive = gameState.lastSownPit === pitIdx || activeSowPit === pitIdx;
                const isDropping = droppingPit === pitIdx;

                return (
                  <button
                    key={pitIdx}
                    disabled={!canClick}
                    onClick={() => handlePitClick(pitIdx)}
                    onMouseEnter={() => setHoveredPit(pitIdx)}
                    onMouseLeave={() => setHoveredPit(null)}
                    className={`relative flex flex-col items-center justify-between h-28 rounded-xl border bg-white p-2.5 transition-all duration-200 ${
                      canClick ? 'hover:border-[#0070f3] hover:-translate-y-1 hover:shadow-md active:scale-95 cursor-pointer border-[#0070f3]/40' : 'cursor-default'
                    } ${isPitActive ? 'border-[#0070f3] animate-pit-glow bg-[#eef6ff] scale-105 shadow-md' : ''}`}
                  >
                    <span className="font-mono-code text-[10px] text-[#0070f3]">Pit {pitIdx + 1}</span>
                    <div className="my-auto flex items-center justify-center">
                      {renderSeedDots(pitIdx, seedCount, isPitActive, isDropping)}
                    </div>
                    <span className="font-mono-code text-xs font-bold text-[#171717]">
                      {seedCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MOVE HISTORY LOG TRANSCRIPT */}
      <div className="rounded-xl border border-[#ebebeb] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-[#ebebeb] pb-2">
          <span className="font-mono-code text-xs font-semibold text-[#171717]">MOVE HISTORY LOG</span>
          <span className="font-mono-code text-[11px] text-[#888888]">
            {gameState.moveHistory.length} Moves Played
          </span>
        </div>

        {gameState.moveHistory.length === 0 ? (
          <p className="text-xs text-[#888888] font-mono-code py-2 text-center">
            No moves recorded yet. Make a move on the board to begin!
          </p>
        ) : (
          <div className="max-h-36 overflow-y-auto flex flex-col gap-1.5 pr-2">
            {gameState.moveHistory.slice(0, 10).map((record, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-1 px-2.5 rounded bg-[#fafafa] border border-[#ebebeb] animate-fade-slide"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono-code text-[10px] text-[#888888]">{record.timestamp}</span>
                  <span className="font-semibold text-[#171717]">
                    {record.player === 0 ? 'Player 1' : mode === 'pvc' ? 'CPU' : 'Player 2'}
                  </span>
                  <span className="text-[#666]">sowed Pit {record.pitIndex + 1}</span>
                </div>
                <div className="flex items-center gap-3 font-mono-code text-[11px]">
                  {record.captured > 0 && (
                    <span className="text-[#0070f3] font-semibold">
                      +{record.captured} Captured
                    </span>
                  )}
                  {record.extraTurn && (
                    <span className="text-[#7928ca] font-semibold">
                      Extra Turn!
                    </span>
                  )}
                  <span className="text-[#888888]">{record.seedsSown} seeds</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
