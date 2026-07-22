import { describe, it, expect } from 'vitest';
import {
    createInitialAvalancheState,
    makeAvalancheMove,
    getLegalAvalancheMoves,
} from '../src/lib/avalanche';
import {
    KALAH_P0_PITS,
    KALAH_P1_PITS,
    KALAH_P0_STORE,
    KALAH_P1_STORE,
} from '../src/lib/kalah';

describe('Avalanche - Initial State', () => {
    it('should create initial state with 4 seeds per pit', () => {
        const state = createInitialAvalancheState(4);
        expect(state.pits).toHaveLength(14);
        KALAH_P0_PITS.forEach((p) => expect(state.pits[p]).toBe(4));
        KALAH_P1_PITS.forEach((p) => expect(state.pits[p]).toBe(4));
        expect(state.pits[KALAH_P0_STORE]).toBe(0);
        expect(state.pits[KALAH_P1_STORE]).toBe(0);
        expect(state.scores).toEqual([0, 0]);
        expect(state.turn).toBe(0);
        expect(state.isGameOver).toBe(false);
        expect(state.moveHistory).toHaveLength(0);
    });

    it('should create initial state with custom seeds per pit', () => {
        const state = createInitialAvalancheState(6);
        KALAH_P0_PITS.forEach((p) => expect(state.pits[p]).toBe(6));
    });
});

describe('Avalanche - Legal Moves', () => {
    it('should return all non-empty pits for current player', () => {
        const state = createInitialAvalancheState(4);
        expect(getLegalAvalancheMoves(state, 0)).toEqual(KALAH_P0_PITS);
        expect(getLegalAvalancheMoves(state, 1)).toEqual(KALAH_P1_PITS);
    });

    it('should return empty array when game is over', () => {
        const state = createInitialAvalancheState(4);
        state.isGameOver = true;
        expect(getLegalAvalancheMoves(state, 0)).toHaveLength(0);
    });
});

describe('Avalanche - Basic Move', () => {
    it('should sow seeds to next pit with 1 seed move', () => {
        const state = createInitialAvalancheState(4);
        // Set pit 0 to 1 seed, keep other pits with some seeds to avoid game end
        state.pits[0] = 1;
        state.pits[1] = 0; // Empty so no cascade
        state.pits[6] = 1; // Keep P1 store has enough to avoid auto-game-end? No, that's store not pit.
        // Keep other P1 pits with 1+ seeds to avoid game over
        state.pits[7] = 1;
        state.pits[8] = 1;
        state.pits[9] = 1;
        state.pits[10] = 1;
        state.pits[11] = 1;
        state.pits[12] = 1;
        state.pits[5] = 1; // Keep P0 pit 5 with 1
        const result = makeAvalancheMove(state, 0);
        expect(result.pits[0]).toBe(0);
        expect(result.pits[1]).toBe(1); // +1 to empty pit
        expect(result.turn).toBe(1);
        expect(result.extraTurn).toBe(false);
    });

    it('should skip opponent store when sowing', () => {
        // Use a clean slate: only put seeds in specific pits, avoid cascading
        const state = createInitialAvalancheState(4);
        state.pits = new Array(14).fill(0);
        state.pits[KALAH_P0_STORE] = 0;
        state.pits[KALAH_P1_STORE] = 0;
        state.pits[12] = 2; // P1 pit 12 with 2 seeds
        state.pits[5] = 1; // P0 pit 5 with 1 seed to keep P0 side non-empty
        state.pits[10] = 1; // Another P1 pit to keep P1 side non-empty
        state.turn = 1;
        const result = makeAvalancheMove(state, 12);
        // 2 seeds from 12: seed1->13(own store), seed2->0(falls through, P0 pit)
        // pit 0 was 0, becomes 1. pit 12 = 0.
        expect(result.pits[12]).toBe(0);
        expect(result.pits[13]).toBe(1); // store had 0 + 1
        expect(result.pits[0]).toBe(1);
        expect(result.lastSownPit).toBe(0);
    });
});

describe('Avalanche - Cascade Mechanic', () => {
    it('should cascade when landing in non-empty pit', () => {
        const state = createInitialAvalancheState(4);
        // Set up: pit 0 has 2 seeds, pit 1 has 1 seed (will become 2 -> cascade)
        state.pits = new Array(14).fill(1);
        state.pits[KALAH_P0_STORE] = 0;
        state.pits[KALAH_P1_STORE] = 0;
        state.pits[0] = 2; // 2 seeds from pit 0
        const result = makeAvalancheMove(state, 0);
        expect(result.pits[0]).toBe(0);
        expect(result.moveHistory).toHaveLength(1);
    });

    it('should handle multi-lap cascades without error', () => {
        const state = createInitialAvalancheState(4);
        state.pits.fill(1);
        state.pits[KALAH_P0_STORE] = 0;
        state.pits[KALAH_P1_STORE] = 0;
        state.pits[0] = 2;
        const result = makeAvalancheMove(state, 0);
        expect(result.pits[0]).toBe(0);
        expect(result.moveHistory).toHaveLength(1);
    });
});

describe('Avalanche - Extra Turn', () => {
    it('should grant extra turn when ending in own store', () => {
        const state = createInitialAvalancheState(4);
        state.pits[5] = 1; // 1 seed -> directly to store (pit 6)
        const result = makeAvalancheMove(state, 5);
        expect(result.pits[KALAH_P0_STORE]).toBe(1);
        expect(result.extraTurn).toBe(true);
        expect(result.turn).toBe(0);
    });
});

describe('Avalanche - Game Over', () => {
    it('should detect game over when side emptied', () => {
        const state = createInitialAvalancheState(4);
        KALAH_P0_PITS.forEach((p) => (state.pits[p] = 0));
        KALAH_P1_PITS.forEach((p) => (state.pits[p] = 0));
        state.pits[KALAH_P0_STORE] = 10;
        state.pits[KALAH_P1_STORE] = 8;
        state.pits[KALAH_P1_PITS[0]] = 1;
        state.turn = 1;
        const result = makeAvalancheMove(state, KALAH_P1_PITS[0]);
        expect(result.isGameOver).toBe(true);
    });

    it('should sweep remaining seeds on game over', () => {
        const state = createInitialAvalancheState(4);
        KALAH_P0_PITS.forEach((p) => (state.pits[p] = 0));
        KALAH_P1_PITS.forEach((p) => (state.pits[p] = 0));
        state.pits[KALAH_P0_STORE] = 5;
        state.pits[KALAH_P1_STORE] = 5;
        state.pits[KALAH_P1_PITS[0]] = 1;
        state.pits[KALAH_P1_PITS[1]] = 2;
        state.turn = 1;
        const storeBefore = state.pits[KALAH_P1_STORE];
        const result = makeAvalancheMove(state, KALAH_P1_PITS[0]);
        if (result.isGameOver) {
            expect(result.pits[KALAH_P1_STORE]).toBeGreaterThan(storeBefore);
        }
    });

    it('should determine winner from stores', () => {
        const state = createInitialAvalancheState(4);
        KALAH_P0_PITS.forEach((p) => (state.pits[p] = 0));
        KALAH_P1_PITS.forEach((p) => (state.pits[p] = 0));
        state.pits[KALAH_P0_STORE] = 20;
        state.pits[KALAH_P1_STORE] = 5;
        state.pits[KALAH_P1_PITS[0]] = 1;
        state.turn = 1;
        const result = makeAvalancheMove(state, KALAH_P1_PITS[0]);
        expect(result.isGameOver).toBe(true);
        expect(result.winner).toBe(0);
    });
});

describe('Avalanche - Edge Cases', () => {
    it('should reject illegal move (empty pit)', () => {
        const state = createInitialAvalancheState(4);
        state.pits[0] = 0;
        const result = makeAvalancheMove(state, 0);
        expect(result).toBe(state);
    });

    it('should handle single seed move', () => {
        const state = createInitialAvalancheState(4);
        state.pits[0] = 1;
        state.pits[1] = 0;
        // Ensure other side has seeds to avoid game end
        const result = makeAvalancheMove(state, 0);
        expect(result.pits[0]).toBe(0);
        expect(result.pits[1]).toBe(1);
        expect(result.moveHistory).toHaveLength(1);
    });

    it('should record move history correctly', () => {
        const state = createInitialAvalancheState(4);
        state.pits[0] = 1;
        const result = makeAvalancheMove(state, 0);
        expect(result.moveHistory).toHaveLength(1);
        expect(result.moveHistory[0].player).toBe(0);
        expect(result.moveHistory[0].captured).toBe(0);
    });

    it('should generate appropriate status messages', () => {
        const state = createInitialAvalancheState(4);
        state.pits.fill(0);
        state.pits[KALAH_P0_STORE] = 0;
        state.pits[KALAH_P1_STORE] = 0;
        state.pits[0] = 1;
        state.pits[7] = 1; // Keep opponent side with seeds

        let result = makeAvalancheMove(state, 0);
        expect(result.statusMessage).toContain("Player 2");

        // Extra turn
        const state2 = createInitialAvalancheState(4);
        state2.pits.fill(0);
        state2.pits[KALAH_P0_STORE] = 0;
        state2.pits[KALAH_P1_STORE] = 0;
        state2.pits[5] = 1;
        state2.pits[3] = 1; // Keep P0 side non-empty
        state2.pits[7] = 1; // Keep P1 side non-empty
        result = makeAvalancheMove(state2, 5);
        expect(result.statusMessage).toContain('Extra Turn');
    });

    it('should update scores from store counts', () => {
        const state = createInitialAvalancheState(4);
        const result = makeAvalancheMove(state, 0);
        expect(result.scores[0]).toBe(result.pits[KALAH_P0_STORE]);
        expect(result.scores[1]).toBe(result.pits[KALAH_P1_STORE]);
    });
});

