# MancalaBoard Refactoring Plan

## Goal
Split MancalaBoard.tsx (~520 lines) into 4 focused components:
1. **GameControls.tsx** — Mode/difficulty toggles, Undo/New Match buttons
2. **BoardGrid.tsx** — Board rendering (Kalah/Avalanche with stores, Oware 12-pit)
3. **AnimatedSeedCluster.tsx** — Floating seed cluster + capture flying seeds overlay
4. **MoveHistoryPanel.tsx** — Move history log at bottom

## Steps
- [x] Step 1: Create TODO.md
- [x] Step 2: Create GameControls.tsx
- [x] Step 3: Create AnimatedSeedCluster.tsx
- [x] Step 4: Create MoveHistoryPanel.tsx
- [x] Step 5: Create BoardGrid.tsx
- [x] Step 6: Rewrite MancalaBoard.tsx to use all 4 components
- [x] Step 7: Run tests — all 79 tests pass ✅
- [x] Step 8: Build project — 7 pages built successfully ✅

