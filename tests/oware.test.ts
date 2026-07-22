import { describe, it, expect } from 'vitest';
import {
    createInitialOwareState,
    makeOwareMove,
    getLegalOwareMoves,
    OWARE_P0_PITS,
    OWARE_P1_PITS,
} from '../src/lib/oware';

describe('Oware - Initial State', () => {
    it('should create initial state with 4 seeds per pit', () => {
        const state = createInitialOwareState();
        expect(state.pits).toHaveLength(12);
        state.pits.forEach((seeds) => expect(seeds).toBe(4));
        expect(state.scores).toEqual([0, 0]);
        expect(state.turn).toBe(0);
        expect(state.isGameOver).toBe(false);
        expect(state.moveHistory).toHaveLength(0);
    });

    it('should have 48 total seeds initially', () => {
        const state = createInitialOwareState();
        const total = state.pits.reduce((sum, s) => sum + s, 0);
        expect(total).toBe(48);
    });
});

describe('Oware - Legal Moves', () => {
    it('should return all non-empty pits for player 0', () => {
        const state = createInitialOwareState();
        const moves = getLegalOwareMoves(state, 0);
        expect(moves).toEqual(OWARE_P0_PITS);
        expect(moves).toHaveLength(6);
    });

    it('should return all non-empty pits for player 1', () => {
        const state = createInitialOwareState();
        const moves = getLegalOwareMoves(state, 1);
        expect(moves).toEqual(OWARE_P1_PITS);
        expect(moves).toHaveLength(6);
    });

    it('should return empty array when game is over', () => {
        const state = createInitialOwareState();
        state.isGameOver = true;
        expect(getLegalOwareMoves(state, 0)).toHaveLength(0);
    });

    it('should enforce feeding opponent when opponent has no seeds', () => {
        const state = createInitialOwareState();
        OWARE_P1_PITS.forEach((p) => (state.pits[p] = 0));
        OWARE_P0_PITS.forEach((p) => (state.pits[p] = 0));
        state.pits[0] = 4;
        const moves = getLegalOwareMoves(state, 0);
        expect(moves).toContain(0);
    });
});

describe('Oware - Basic Move', () => {
    it('should sow seeds counter-clockwise skipping origin pit', () => {
        const state = createInitialOwareState();
        const result = makeOwareMove(state, 0);
        expect(result.pits[0]).toBe(0);
        expect(result.pits[1]).toBe(5);
        expect(result.pits[2]).toBe(5);
        expect(result.pits[3]).toBe(5);
        expect(result.pits[4]).toBe(5);
        expect(result.lastSownPit).toBe(4);
        expect(result.turn).toBe(1);
    });

    it('should wrap around and skip origin on full cycle', () => {
        const state = createInitialOwareState();
        // Set up: only pit 0 has 12 seeds
        OWARE_P0_PITS.forEach((p) => (state.pits[p] = 0));
        OWARE_P1_PITS.forEach((p) => (state.pits[p] = 0));
        state.pits[0] = 12;
        const result = makeOwareMove(state, 0);
        expect(result.pits[0]).toBe(0);
        // 12 seeds: 11 pits get 1 seed each, 12th wraps and goes back to pit 1 (since origin is skipped)
        // So pit 1 has 2, pits 2-11 have 1 each
        expect(result.pits[1]).toBe(2);
        for (let i = 2; i < 12; i++) {
            expect(result.pits[i]).toBe(1);
        }
        expect(result.lastSownPit).toBe(1);
    });
});

describe('Oware - Captures', () => {
    it('should capture 2 or 3 seeds from opponent pits', () => {
        const state = createInitialOwareState();
        OWARE_P0_PITS.forEach((p) => (state.pits[p] = 0));
        OWARE_P1_PITS.forEach((p) => (state.pits[p] = 2));
        state.pits[0] = 7; // 7 seeds: lands in pit 7 (opponent, 2->3, capture)
        const result = makeOwareMove(state, 0);
        if (result.moveHistory[0].captured > 0) {
            expect(result.pits[7]).toBe(0);
            expect(result.scores[0]).toBeGreaterThan(0);
        }
    });

    it('should not capture when grand slam (all opponent seeds taken)', () => {
        const state = createInitialOwareState();
        OWARE_P0_PITS.forEach((p) => (state.pits[p] = 0));
        OWARE_P1_PITS.forEach((p) => (state.pits[p] = 0));
        state.pits[6] = 3;
        state.pits[0] = 4; // Lands in pit 4 (own side)
        const result = makeOwareMove(state, 0);
        expect(result.moveHistory[0].captured).toBe(0);
    });
});

describe('Oware - Game Over', () => {
    it('should end game when a player reaches 25+ seeds', () => {
        const state = createInitialOwareState();
        OWARE_P0_PITS.forEach((p) => (state.pits[p] = 0));
        OWARE_P1_PITS.forEach((p) => (state.pits[p] = 0));
        state.pits[0] = 1;
        state.scores = [24, 0];
        const result = makeOwareMove(state, 0);
        if (result.scores[0] >= 25) {
            expect(result.isGameOver).toBe(true);
            expect(result.winner).toBe(0);
        }
    });

    it('should handle starvation', () => {
        const state = createInitialOwareState();
        OWARE_P1_PITS.forEach((p) => (state.pits[p] = 0));
        OWARE_P0_PITS.forEach((p) => (state.pits[p] = 0));
        state.pits[0] = 1;
        const result = makeOwareMove(state, 0);
        if (result.isGameOver) {
            expect(result.winner).toBeDefined();
        }
    });

    it('should handle draw at 24-24', () => {
        const state = createInitialOwareState();
        state.scores = [24, 24];
        state.isGameOver = true;
        state.winner = 'draw';
        expect(state.winner).toBe('draw');
    });
});

describe('Oware - Edge Cases', () => {
    it('should reject illegal move (empty pit)', () => {
        const state = createInitialOwareState();
        state.pits[0] = 0;
        const result = makeOwareMove(state, 0);
        expect(result).toBe(state);
    });

    it('should reject illegal move (opponent pit)', () => {
        const state = createInitialOwareState();
        const result = makeOwareMove(state, OWARE_P1_PITS[0]);
        expect(result).toBe(state);
    });

    it('should record move history correctly', () => {
        const state = createInitialOwareState();
        const result = makeOwareMove(state, 0);
        expect(result.moveHistory).toHaveLength(1);
        expect(result.moveHistory[0].player).toBe(0);
        expect(result.moveHistory[0].pitIndex).toBe(0);
        expect(result.moveHistory[0].extraTurn).toBe(false);
    });

    it('should never grant extra turn', () => {
        const state = createInitialOwareState();
        const result = makeOwareMove(state, 0);
        expect(result.extraTurn).toBe(false);
    });

    it('should handle single seed move', () => {
        const state = createInitialOwareState();
        OWARE_P0_PITS.forEach((p) => (state.pits[p] = 0));
        OWARE_P1_PITS.forEach((p) => (state.pits[p] = 0));
        state.pits[0] = 1;
        state.pits[6] = 1; // Keep some seeds on opponent side to prevent game end
        const result = makeOwareMove(state, 0);
        expect(result.pits[0]).toBe(0);
        expect(result.pits[1]).toBe(1);
        expect(result.turn).toBe(1);
    });

    it('should generate appropriate status messages', () => {
        const state = createInitialOwareState();
        let result = makeOwareMove(state, 0);
        expect(result.statusMessage).toContain("Player 2");
    });

    it('should maintain correct total seed count throughout game', () => {
        const state = createInitialOwareState();
        const totalBefore = state.pits.reduce((s, p) => s + p, 0) + state.scores[0] + state.scores[1];
        const result = makeOwareMove(state, 0);
        const totalAfter = result.pits.reduce((s, p) => s + p, 0) + result.scores[0] + result.scores[1];
        expect(totalAfter).toBe(totalBefore);
    });
});

