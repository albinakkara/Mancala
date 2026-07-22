# Implementation Plan

## Part 1: Undo System ✅
- [x] Install vitest as dev dependency
- [x] Update package.json with test scripts
- [x] Edit `src/components/MancalaBoard.tsx`:
  - [x] Add `undoStack` state for undo stack
  - [x] Push current state to history before each move in `executeAnimatedMove`
  - [x] Add `handleUndo` function that pops 1 (PvP) or 2 (PvC) states from history
  - [x] Reset all animation states on undo
  - [x] Add "Undo" button to toolbar with proper disabled logic
  - [x] Reset history on new game

## Part 2: Test Suite ✅
- [x] Create `tests/kalah.test.ts` (22 tests)
- [x] Create `tests/avalanche.test.ts` (17 tests)
- [x] Create `tests/oware.test.ts` (20 tests)
- [x] Create `tests/ai.test.ts` (20 tests)
- [x] **Total: 79 tests — all passing!** 🎉



