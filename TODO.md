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

