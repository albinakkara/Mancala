import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import type { GameVariant, GameMode, Difficulty, BoardState, Player } from '../lib/types';
import { createInitialKalahState, makeKalahMove, KALAH_P0_STORE, KALAH_P1_STORE } from '../lib/kalah';
import { createInitialAvalancheState, makeAvalancheMove } from '../lib/avalanche';
import { createInitialOwareState, makeOwareMove } from '../lib/oware';
import { soundFx } from '../lib/sound';
import { WinnerPopup } from './WinnerPopup';
import { GameControls } from './GameControls';
import { GameSetupDialog } from './GameSetupDialog';
import { BoardGrid } from './BoardGrid';
import { AnimatedSeedCluster, type CaptureSeed, type CaptureAnimState } from './AnimatedSeedCluster';
import { GameSpeedControl } from './GameSpeedControl';
import { MoveHistoryPanel } from './MoveHistoryPanel';

interface MancalaBoardProps {
  variant: GameVariant;
  onGameEnd?: (winner: Player | 'draw', variant: GameVariant, mode: GameMode, difficulty: Difficulty) => void;
}

function getInitialState(varType: GameVariant): BoardState {
  if (varType === 'kalah') return createInitialKalahState(4);
  if (varType === 'avalanche') return createInitialAvalancheState(4);
  return createInitialOwareState();
}

export const MancalaBoard: React.FC<MancalaBoardProps> = ({ variant, onGameEnd }) => {
  // ---- Game config state (locked once game starts) ----
  const [mode, setMode] = useState<GameMode>('pvc');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [gameStarted, setGameStarted] = useState(false);
  const [showSetup, setShowSetup] = useState(true);

  // ---- Core game state ----
  const [gameState, setGameState] = useState<BoardState>(() => getInitialState(variant));
  const [undoStack, setUndoStack] = useState<BoardState[]>([]);
  const [isCpuThinking, setIsCpuThinking] = useState(false);
  const [isSowing, setIsSowing] = useState(false);
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const [activeSowPit, setActiveSowPit] = useState<number | null>(null);

  // ---- Animation state ----
  const [catchingPit, setCatchingPit] = useState<number | null>(null);
  const [captureGlowPits, setCaptureGlowPits] = useState<number[]>([]);
  const [captureStoreGlow, setCaptureStoreGlow] = useState(false);
  const [captureAnim, setCaptureAnim] = useState<CaptureAnimState>({
    active: false, seeds: [], fromPits: [], toStore: -1, player: 0,
  });
  const [clusterSeedCount, setClusterSeedCount] = useState(0);
  const [clusterPos, setClusterPos] = useState({ x: 0, y: 0 });
  const [clusterAnimClass, setClusterAnimClass] = useState('');
  const [clusterVisible, setClusterVisible] = useState(false);

  const [gameSpeed, setGameSpeed] = useState(1);
  const gameSpeedRef = useRef(gameSpeed);
  useEffect(() => {
    gameSpeedRef.current = gameSpeed;
  }, [gameSpeed]);

  const isMounted = useRef(true);
  const boardRef = useRef<HTMLDivElement>(null);
  const thinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cpuWorkerRef = useRef<Worker | null>(null);
  const cpuRequestIdRef = useRef<number>(0);
  const gameGeneration = useRef(0);

  useEffect(() => {
    isMounted.current = true;
    // Initialize CPU worker
    cpuWorkerRef.current = new Worker(new URL('../workers/ai.worker.ts', import.meta.url), { type: 'module' });
    return () => { 
      isMounted.current = false; 
      cpuWorkerRef.current?.terminate();
    };
  }, []);

  // ---- Helpers ----
  const getSpeed = () => gameSpeedRef.current;
  const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms / getSpeed()));

  const getPitCenter = useCallback((pitIndex: number): { x: number; y: number } | null => {
    if (!boardRef.current) return null;
    const boardRect = boardRef.current.getBoundingClientRect();
    const pitEl = boardRef.current.querySelector(`[data-pit-index="${pitIndex}"]`);
    if (!pitEl) return null;
    const pitRect = pitEl.getBoundingClientRect();
    return {
      x: pitRect.left + pitRect.width / 2 - boardRect.left,
      y: pitRect.top + pitRect.height / 2 - boardRect.top,
    };
  }, []);

  // Handle setup dialog confirmation — starts the game with locked settings
  const handleSetupStart = useCallback((chosenMode: GameMode, chosenDifficulty: Difficulty) => {
    gameGeneration.current++;
    // Reset to defaults
    setMode(chosenMode);
    setDifficulty(chosenDifficulty);
    setGameStarted(true);
    setShowSetup(false);
    setUndoStack([]);
    setIsCpuThinking(false);
    setIsSowing(false);
    setActiveSowPit(null);
    setShowWinnerPopup(false);
    setCaptureAnim({ active: false, seeds: [], fromPits: [], toStore: -1, player: 0 });
    setCaptureGlowPits([]);
    setCaptureStoreGlow(false);
    setClusterVisible(false);
    setClusterSeedCount(0);
    setClusterAnimClass('');
    setCatchingPit(null);

    // Initialize game state with fresh board
    const s = getInitialState(variant);
    s.turn = 0;
    s.statusMessage = chosenMode === 'pvc' ? 'Player 1 goes first. Take your turn!' : 'Player 1 goes first. Take your turn!';
    setGameState(s);
  }, [variant]);

  // Handle "New Match" — shows setup dialog again
  const handleNewGame = useCallback(() => {
    gameGeneration.current++;
    setGameStarted(false);
    setShowSetup(true);
    setShowWinnerPopup(false);
    setIsCpuThinking(false);
    setIsSowing(false);
    setActiveSowPit(null);
    setCaptureAnim({ active: false, seeds: [], fromPits: [], toStore: -1, player: 0 });
    setCaptureGlowPits([]);
    setCaptureStoreGlow(false);
    setClusterVisible(false);
    setClusterSeedCount(0);
    setClusterAnimClass('');
    setCatchingPit(null);
    setUndoStack([]);
  }, []);

  // No longer auto-restart on variant/mode/difficulty change

  // ---- Game over ----
  const handleGameOver = useCallback(
    (finalState: BoardState) => {
      soundFx.playWin();
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      setShowWinnerPopup(true);
      if (onGameEnd && finalState.winner !== null) {
        onGameEnd(finalState.winner, variant, mode, difficulty);
      }
    },
    [onGameEnd, variant, mode, difficulty]
  );

  // ---- Undo ----
  const handleUndo = useCallback(() => {
    if (isCpuThinking || isSowing || undoStack.length === 0) return;

    let stepsBack = 1;
    if (mode === 'pvc') {
      // For CPU games, scan backwards through the undo stack to find the last state
      // where it was Player 1's turn (turn === 0). This properly handles cases where
      // the CPU got extra turns — we undo ALL CPU moves back to the player's turn.
      let foundIndex = -1;
      for (let i = undoStack.length - 1; i >= 0; i--) {
        if (undoStack[i].turn === 0) {
          foundIndex = i;
          break;
        }
      }
      if (foundIndex === -1) return; // No player-turn state found
      stepsBack = undoStack.length - foundIndex;
    }

    if (undoStack.length < stepsBack) return;
    const restoredState = undoStack[undoStack.length - stepsBack];
    setUndoStack(undoStack.slice(0, undoStack.length - stepsBack));
    setGameState({
      ...restoredState,
      pits: [...restoredState.pits],
      scores: [...restoredState.scores],
      moveHistory: [...restoredState.moveHistory],
    });
    setIsSowing(false);
    setActiveSowPit(null);
    setClusterVisible(false);
    setClusterSeedCount(0);
    setClusterAnimClass('');
    setCatchingPit(null);
    setCaptureAnim({ active: false, seeds: [], fromPits: [], toStore: -1, player: 0 });
    setCaptureGlowPits([]);
    setCaptureStoreGlow(false);
  }, [mode, undoStack, isCpuThinking, isSowing]);

  const canUndo = !isCpuThinking && !isSowing && !gameState.isGameOver && (
    mode === 'pvp'
      ? undoStack.length > 0
      : undoStack.some(s => s.turn === 0)
  );

  // ---- Build sowing sequence for animation ----
  const buildSowSequence = useCallback(
    (startState: BoardState, chosenPit: number) => {
      const seq: { pit: number; seedsLeft: number; isAvalanchePickup: boolean }[] = [];
      const t = startState.turn;

      if (variant === 'kalah' || variant === 'avalanche') {
        const oppStore = t === 0 ? KALAH_P1_STORE : KALAH_P0_STORE;
        const ownStore = t === 0 ? KALAH_P0_STORE : KALAH_P1_STORE;
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
            isAP = true;
            seeds = mutablePits[curr];
            mutablePits[curr] = 0;
          }
          seq.push({ pit: curr, seedsLeft: seeds, isAvalanchePickup: isAP });
        }
      } else {
        let seeds = startState.pits[chosenPit];
        let curr = chosenPit;
        while (seeds > 0) {
          curr = (curr + 1) % 12;
          if (curr === chosenPit) continue;
          seeds -= 1;
          seq.push({ pit: curr, seedsLeft: seeds, isAvalanchePickup: false });
        }
      }
      return seq;
    },
    [variant]
  );

  // ---- Execute animated move ----
  const executeAnimatedMove = useCallback(
    async (pitIndex: number, targetState: BoardState) => {
      if (isSowing || !isMounted.current) return;
      const gen = gameGeneration.current;
      if (gen !== gameGeneration.current) return;
      setIsSowing(true);
      setActiveSowPit(pitIndex);

      try {
        if (gen !== gameGeneration.current) return;
        // Save to undo stack
        setUndoStack((prev) => [...prev, targetState]);

        // Compute final state
        let finalState: BoardState;
        if (variant === 'kalah') finalState = makeKalahMove(targetState, pitIndex);
        else if (variant === 'avalanche') finalState = makeAvalancheMove(targetState, pitIndex);
        else finalState = makeOwareMove(targetState, pitIndex);

        const capturedPits = finalState.moveHistory[0]?.capturedPits;
        const capturedCount = finalState.moveHistory[0]?.captured || 0;
        const currentPlayer = targetState.turn;

        // Build animation sequence
        const seq = buildSowSequence(targetState, pitIndex);
        if (seq.length === 0) {
        setIsSowing(false);
        setActiveSowPit(null);
        setIsCpuThinking(false);
        return;
      }

      const srcPos = getPitCenter(pitIndex);
      if (!srcPos) {
        setIsSowing(false);
        setActiveSowPit(null);
        setIsCpuThinking(false);
        return;
      }

      const totalSeeds = targetState.pits[pitIndex];
      const basePits = [...targetState.pits];
      basePits[pitIndex] = 0;

      // Pre-position cluster
      setClusterPos({ x: srcPos.x, y: srcPos.y });
      await delay(16);
      if (!isMounted.current || gen !== gameGeneration.current) return;

      setGameState((prev) => ({
        ...prev,
        pits: basePits,
        statusMessage: `Player ${targetState.turn === 0 ? '1' : '2 (CPU)'} scoops seeds from Pit ${pitIndex + 1}...`,
      }));
      setClusterSeedCount(totalSeeds);
      setClusterAnimClass('animate-cluster-scoop');
      setClusterVisible(true);
      await delay(300);
      if (!isMounted.current || gen !== gameGeneration.current) return;
      setClusterAnimClass('');

        // Sow each seed with animation
        const updatedPits = [...basePits];
        for (let i = 0; i < seq.length; i++) {
            if (!isMounted.current || gen !== gameGeneration.current) return;
            const step = seq[i];
            const { pit: targetPit, seedsLeft: remaining, isAvalanchePickup } = step;

            const toPos = getPitCenter(targetPit);
            if (toPos) {
                setClusterPos({ x: toPos.x, y: toPos.y });
                setClusterAnimClass('animate-cluster-glide');
                soundFx.playSow();
            }
            await delay(350);
            if (!isMounted.current || gen !== gameGeneration.current) return;

            if (isAvalanchePickup) {
                updatedPits[targetPit] = 0;
                setGameState((prev) => ({
                    ...prev,
                    pits: [...updatedPits],
                    lastSownPit: targetPit,
                    statusMessage: `Avalanche! Hand collects ${remaining + 1} seeds from Pit ${targetPit + 1}!`,
                }));
                setClusterSeedCount(remaining);
                setClusterAnimClass('animate-avalanche-popup');
                await delay(300);
                if (!isMounted.current || gen !== gameGeneration.current) return;
                setClusterAnimClass('');
            } else {
                updatedPits[targetPit] += 1;
                setGameState((prev) => ({
                    ...prev,
                    pits: [...updatedPits],
                    lastSownPit: targetPit,
                    statusMessage: `Dropping seed into Pit ${targetPit + 1}...`,
                }));
                setClusterSeedCount(remaining);
                setClusterAnimClass('');
                setCatchingPit(targetPit);
                    const timeout = 350 / getSpeed();
                    setTimeout(() => {
                        if (isMounted.current) setCatchingPit(null);
                    }, timeout);
                await delay(350);
                if (!isMounted.current || gen !== gameGeneration.current) return;
            }
        }

      // Hand empty animation
      if (!isMounted.current || gen !== gameGeneration.current) return;
      setClusterAnimClass('animate-hand-empty');
      await delay(300);
      if (!isMounted.current || gen !== gameGeneration.current) return;
      setClusterVisible(false);
      setClusterSeedCount(0);
      setClusterAnimClass('');

      // Capture animation
      if (capturedCount > 0 && capturedPits && capturedPits.length > 0 && variant !== 'avalanche') {
        soundFx.playCapture();
        const targetStore =
          variant === 'kalah'
            ? currentPlayer === 0
              ? KALAH_P0_STORE
              : KALAH_P1_STORE
            : currentPlayer === 0
              ? 0
              : 6;
        const toPos = getPitCenter(targetStore);
        if (toPos) {
          const seeds: CaptureSeed[] = [];
          const seedsPerPit = Math.max(1, Math.ceil(capturedCount / capturedPits.length));
          let seedIdx = 0;
          for (let p = 0; p < capturedPits.length && seedIdx < capturedCount; p++) {
            const fromPos = getPitCenter(capturedPits[p]);
            if (!fromPos) continue;
            const dx = toPos.x - fromPos.x;
            const dy = toPos.y - fromPos.y;
            for (let s = 0; s < seedsPerPit && seedIdx < capturedCount; s++) {
              const ox = (Math.random() - 0.5) * 30;
              const oy = (Math.random() - 0.5) * 30;
              seeds.push({
                id: seedIdx,
                fromPit: capturedPits[p],
                toStore: targetStore,
                startX: fromPos.x + ox,
                startY: fromPos.y + oy,
                deltaX: dx + ox,
                deltaY: dy + oy,
                                delay: (p * 180 + s * 120 + Math.random() * 60) / getSpeed(),
                player: currentPlayer,
              });
              seedIdx++;
            }
          }
          if (seeds.length > 0) {
            setCaptureGlowPits(capturedPits);
            setCaptureStoreGlow(true);
            setCaptureAnim({
              active: true,
              seeds,
              fromPits: capturedPits,
              toStore: targetStore,
              player: currentPlayer,
            });
             seeds.forEach((s) => {
               setTimeout(() => {
                 if (gen !== gameGeneration.current) return;
                 if (!isMounted.current) return;
                const el = boardRef.current?.querySelector(
                  `[data-capture-seed="${s.id}"]`
                ) as HTMLElement | null;
                if (!el) return;
                el.style.transition = `transform ${0.9 / getSpeed()}s cubic-bezier(0.1, 0.7, 0.2, 1), opacity ${0.3 / getSpeed()}s ease-in`;
                el.style.transform = `translate(${s.deltaX}px, ${s.deltaY}px) scale(0.3)`;
                el.style.opacity = '0';
              }, s.delay / getSpeed());
            });
            const lastDelay = seeds.reduce((max, s) => Math.max(max, s.delay), 0);
            await delay(lastDelay + 1100);
          }
        }
      }

      // Finalize
      if (!isMounted.current) return;
      if (gen !== gameGeneration.current) return;
      if (finalState.extraTurn) soundFx.playExtraTurn();
      setCaptureAnim({ active: false, seeds: [], fromPits: [], toStore: -1, player: 0 });
      setCaptureGlowPits([]);
      setCaptureStoreGlow(false);
      setGameState(finalState);
      setIsSowing(false);
      setActiveSowPit(null);
      setIsCpuThinking(false);
      if (finalState.isGameOver) handleGameOver(finalState);
            } catch {
      setIsSowing(false);
      setActiveSowPit(null);
      setIsCpuThinking(false);
    }
    },
    [variant, isSowing, handleGameOver, buildSowSequence, getPitCenter]
  );

  // ---- CPU thinking effect ----
  useEffect(() => {
    if (thinkingTimerRef.current) {
      clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }
    setIsCpuThinking(false);

    const worker = cpuWorkerRef.current;

    if (mode === 'pvc' && gameState.turn === 1 && !gameState.isGameOver && !isSowing && worker) {
      thinkingTimerRef.current = setTimeout(() => {
        if (!isMounted.current || gameState.isGameOver || isSowing) return;
        setIsCpuThinking(true);
        const requestId = ++cpuRequestIdRef.current;
        worker.postMessage({
          type: 'GET_BEST_MOVE',
          state: gameState,
          variant,
          difficulty,
          id: requestId,
        });

        const handleMessage = (event: MessageEvent) => {
          const response = event.data;
          if (response.type === 'BEST_MOVE' && response.id === requestId) {
            worker.removeEventListener('message', handleMessage);
            if (!isMounted.current) return;
            try {
              if (response.move !== null) {
                executeAnimatedMove(response.move, gameState);
              } else {
                setIsCpuThinking(false);
              }
    } catch {
              setIsCpuThinking(false);
            }
          }
        };
        worker.addEventListener('message', handleMessage);
      }, 500 / getSpeed());
    }

    return () => {
      if (thinkingTimerRef.current) {
        clearTimeout(thinkingTimerRef.current);
        thinkingTimerRef.current = null;
      }
    };
  }, [gameState, mode, variant, difficulty, isSowing, executeAnimatedMove]);

  // ---- Pit click handler ----
  const handlePitClick = (pitIndex: number) => {
    if (gameState.isGameOver || isCpuThinking || isSowing) return;
    if (mode === 'pvc' && gameState.turn === 1) return;
    executeAnimatedMove(pitIndex, gameState);
  };

  return (
    <div className="w-full mx-auto flex flex-col gap-3 sm:gap-4 md:gap-6 max-w-4xl">
      {/* Pre-game Setup Dialog */}
      <GameSetupDialog
        isOpen={showSetup}
        variant={variant}
        onStart={handleSetupStart}
      />

      {/* Game Controls: Read-only badges, Undo, New Match */}
      {gameStarted && (
        <GameControls
          mode={mode}
          difficulty={difficulty}
          variant={variant}
          canUndo={canUndo}
          onUndo={handleUndo}
          onNewGame={handleNewGame}
        />
      )}

      {/* Status Bar */}
      {gameStarted && (
        <div
          className={`relative overflow-hidden rounded-xl border border-[#ebebeb] bg-white p-2 sm:p-4 shadow-sm text-center transition-all duration-300 ${gameState.extraTurn ? 'animate-extra-turn' : ''
            }`}
        >
          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2 sm:gap-0 px-1 sm:px-2">
            {/* Player 1 */}
            <div
              className={`flex items-center gap-1.5 sm:gap-2 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 transition-all duration-300 ${gameState.turn === 0 && !gameState.isGameOver
                ? 'bg-black text-white font-semibold scale-102 shadow-md'
                : 'text-[#666]'
                }`}
            >
              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#0070f3] animate-pulse" />
              <span className="text-[10px] sm:text-xs font-medium">
                Player 1 <span className="hidden sm:inline">(Bottom)</span>
              </span>
              <span className="font-mono-code text-[10px] sm:text-xs ml-1 sm:ml-2 animate-score-bump">
                Score: {gameState.scores[0]}
              </span>
            </div>

            {/* Center status */}
            <div className="flex flex-col items-center order-first sm:order-none w-full sm:w-auto">
              <span className="font-mono-code text-[10px] sm:text-[11px] text-[#888888] tracking-wider uppercase" aria-live="polite">
                {variant} MANCALA
              </span>
              <p
                 key={gameState.statusMessage}
                 className="text-[11px] sm:text-sm font-semibold text-[#171717] flex items-center gap-1.5 animate-fade-slide"
                 aria-live="polite"
               >
                {isCpuThinking && (
                  <span className="inline-block h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#7928ca] animate-ping" />
                )}
                <span className="truncate max-w-[180px] sm:max-w-none">{gameState.statusMessage}</span>
              </p>
              {isSowing && (
                <div className="mt-1 sm:mt-2 inline-flex items-center gap-1 sm:gap-2 rounded-full bg-[#171717] px-2 sm:px-3 py-0.5 sm:py-1 text-white shadow-lg animate-float-hand">
                  <span className="text-[10px] sm:text-xs">🌱</span>
                  <span className="font-mono-code text-[10px] sm:text-xs font-bold">
                    HAND: {clusterSeedCount} SEED{clusterSeedCount !== 1 ? 'S' : ''} REMAINING
                  </span>
                </div>
              )}
            </div>

            {/* Player 2 / CPU */}
            <div
              className={`flex items-center gap-1.5 sm:gap-2 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 transition-all duration-300 ${gameState.turn === 1 && !gameState.isGameOver
                ? 'bg-black text-white font-semibold scale-102 shadow-md'
                : 'text-[#666]'
                }`}
            >
              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#eb367f] animate-pulse" />
              <span className="text-[10px] sm:text-xs font-medium">
                {mode === 'pvc' ? `CPU (${difficulty})` : <>Player 2 <span className="hidden sm:inline">(Top)</span></>}
              </span>
              <span className="font-mono-code text-[10px] sm:text-xs ml-1 sm:ml-2 animate-score-bump">
                Score: {gameState.scores[1]}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Board Grid with Animation Overlays */}
      {gameStarted && (
        <div className="relative" ref={boardRef} style={{ '--game-speed': gameSpeed } as React.CSSProperties}>
          <AnimatedSeedCluster
            clusterVisible={clusterVisible}
            clusterPos={clusterPos}
            clusterSeedCount={clusterSeedCount}
            clusterAnimClass={clusterAnimClass}
            captureAnim={captureAnim}
            gameSpeed={gameSpeed}
          />
          <BoardGrid
            variant={variant}
            mode={mode}
            gameState={gameState}
            isCpuThinking={isCpuThinking}
            isSowing={isSowing}
            captureGlowPits={captureGlowPits}
            captureStoreGlow={captureStoreGlow}
            captureAnimPlayer={captureAnim.player}
            catchingPit={catchingPit}
            activeSowPit={activeSowPit}
            onPitClick={handlePitClick}
          />
        </div>
      )}

      {/* Game Speed Control */}
      {gameStarted && (
        <div className="flex justify-center">
          <GameSpeedControl
            speed={gameSpeed}
            onSpeedChange={setGameSpeed}
          />
        </div>
      )}

      {/* Move History */}
      {gameStarted && (
        <MoveHistoryPanel
          moveHistory={gameState.moveHistory}
          variant={variant}
          mode={mode}
        />
      )}

      {/* Winner Popup */}
      <WinnerPopup
        isOpen={showWinnerPopup}
        winner={gameState.winner}
        scores={gameState.scores}
        variant={variant}
        mode={mode}
        onNewGame={handleNewGame}
      />
    </div>
  );
};

