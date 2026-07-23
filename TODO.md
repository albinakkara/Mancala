# Implementation Plan: Pre-Game Setup Dialog

## Steps - ✅ COMPLETE

### Step 1: Create `GameSetupDialog.tsx` ✅
- New modal component for selecting mode (pvc/pvp) and difficulty (easy/medium/hard)
- Difficulty only visible when mode is "vs Computer"
- "Start Game" button to confirm choices
- Matching existing design system (white, border-[#ebebeb], etc.)

### Step 2: Edit `GameControls.tsx` ✅
- Remove mode toggle buttons (vs Computer / 2 Players)
- Remove difficulty toggle buttons (easy/medium/hard)
- Show mode and difficulty as **read-only badges** instead
- Keep Undo and New Match buttons
- Simplified props (removed onModeChange, onDifficultyChange)

### Step 3: Edit `MancalaBoard.tsx` ✅
- Added `gameStarted` and `showSetup` state to control setup dialog visibility
- Removed the `useEffect` that auto-restarted on mode/difficulty change
- Added `handleSetupStart(mode, difficulty)` — called when user clicks "Start Game"
- Added `handleNewGame` — sets `gameStarted = false` to show setup dialog again
- Mode/difficulty are set once and never change during gameplay
- Integrated `GameSetupDialog` component
- Game controls/board/history are hidden until game starts

### Step 4: Edit `WinnerPopup.tsx` ✅
- No changes needed (already accepts `onNewGame` prop)
- The handler passed from MancalaBoard now triggers setup dialog instead of direct restart

---

## Fix: CPU Extra Turn Undo ✅ (2024)

### Problem
When playing against the CPU, if the CPU gets extra turns (by landing in its store in Kalah/Avalanche), clicking Undo would step back only 2 states, potentially restoring to a state where it was still the CPU's turn — forcing the player to undo again.

### Fix Applied
Modified `handleUndo` in `MancalaBoard.tsx`:
- **Before**: Used fixed `stepsBack = 2` for PvC mode, assuming CPU always makes exactly 1 move per turn.
- **After**: For PvC mode, the undo stack is scanned backwards to find the **last state where it was Player 1's turn (`turn === 0`)**. This dynamically undoes ALL consecutive CPU moves (including extra turns) and restores the player's turn.
- Also updated `canUndo` to check if any state in the undo stack has `turn === 0` for PvC mode, ensuring the Undo button is properly grayed out when there's nothing to undo back to the player.

