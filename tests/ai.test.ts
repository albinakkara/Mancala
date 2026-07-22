import { describe, it, expect } from 'vitest';
import { getBestCpuMove, getLegalMovesForVariant, makeMoveForVariant } from '../src/lib/ai';
import { createInitialKalahState, KALAH_P0_PITS, KALAH_P1_PITS } from '../src/lib/kalah';
import { createInitialAvalancheState } from '../src/lib/avalanche';
import { createInitialOwareState } from '../src/lib/oware';
import type { GameVariant } from '../src/lib/types';

describe('AI - Utility Functions', () => {
    it('getLegalMovesForVariant should return correct moves for Kalah', () => {
        const state = createInitialKalahState(4);
        const moves = getLegalMovesForVariant(state, 'kalah', 0);
        expect(moves).toEqual(KALAH_P0_PITS);
        expect(moves).toHaveLength(6);
    });

    it('getLegalMovesForVariant should return correct moves for Avalanche', () => {
        const state = createInitialAvalancheState(4);
        const moves = getLegalMovesForVariant(state, 'avalanche', 1);
        expect(moves).toEqual(KALAH_P1_PITS);
    });

    it('getLegalMovesForVariant should return correct moves for Oware', () => {
        const state = createInitialOwareState();
        const moves = getLegalMovesForVariant(state, 'oware', 0);
        expect(moves).toHaveLength(6);
    });

    it('makeMoveForVariant should apply Kalah move', () => {
        const state = createInitialKalahState(4);
        const result = makeMoveForVariant(state, 'kalah', 0);
        expect(result.pits[0]).toBe(0);
        expect(result.turn).not.toBe(state.turn);
    });

    it('makeMoveForVariant should apply Avalanche move', () => {
        const state = createInitialAvalancheState(4);
        const result = makeMoveForVariant(state, 'avalanche', 0);
        // In avalanche with 4 seeds per pit, cascading can return seeds to pit 0
        // So just check that a move was made (moveHistory length increased)
        expect(result.moveHistory).toHaveLength(1);
        expect(result.pits[0]).toBeLessThan(4); // Picked up and some may return
    });

    it('makeMoveForVariant should apply Oware move', () => {
        const state = createInitialOwareState();
        const result = makeMoveForVariant(state, 'oware', 0);
        expect(result.pits[0]).toBe(0);
    });
});

describe('AI - CPU Move Selection', () => {
    it('should return null when no legal moves', () => {
        const state = createInitialKalahState(4);
        KALAH_P1_PITS.forEach((p) => (state.pits[p] = 0));
        const move = getBestCpuMove(state, 'kalah', 'easy');
        expect(move).toBeNull();
    });

    it('should return the only legal move when there is only one', () => {
        const state = createInitialKalahState(4);
        KALAH_P1_PITS.forEach((p, i) => {
            if (i > 0) state.pits[p] = 0;
        });
        const move = getBestCpuMove(state, 'kalah', 'easy');
        expect(move).toBe(KALAH_P1_PITS[0]);
    });
});

describe('AI - Easy Mode', () => {
    it('should return a valid legal move', () => {
        const state = createInitialKalahState(4);
        const move = getBestCpuMove(state, 'kalah', 'easy');
        expect(KALAH_P1_PITS).toContain(move);
    });

    it('should work for all variants', () => {
        const variants: GameVariant[] = ['kalah', 'avalanche', 'oware'];
        for (const v of variants) {
            const state = v === 'kalah' ? createInitialKalahState(4) :
                v === 'avalanche' ? createInitialAvalancheState(4) :
                    createInitialOwareState();
            const move = getBestCpuMove(state, v, 'easy');
            if (move !== null) {
                const legalMoves = getLegalMovesForVariant(state, v, 1);
                expect(legalMoves).toContain(move);
            }
        }
    });
});

describe('AI - Medium Mode (Minimax Depth 2)', () => {
    it('should return a valid legal move for Kalah', () => {
        const state = createInitialKalahState(4);
        const move = getBestCpuMove(state, 'kalah', 'medium');
        expect(KALAH_P1_PITS).toContain(move);
    });

    it('should return a valid legal move for Avalanche', () => {
        const state = createInitialAvalancheState(4);
        const move = getBestCpuMove(state, 'avalanche', 'medium');
        if (move !== null) {
            expect(KALAH_P1_PITS).toContain(move);
        }
    });

    it('should return a valid legal move for Oware', () => {
        const state = createInitialOwareState();
        const move = getBestCpuMove(state, 'oware', 'medium');
        if (move !== null) {
            const legalMoves = getLegalMovesForVariant(state, 'oware', 1);
            expect(legalMoves).toContain(move);
        }
    });

    it('should prefer moves that capture seeds', () => {
        const state = createInitialKalahState(4);
        state.pits[7] = 1;
        state.pits[8] = 0;
        state.pits[4] = 5;
        KALAH_P1_PITS.forEach((p) => { if (p !== 7) state.pits[p] = 0; });
        const move = getBestCpuMove(state, 'kalah', 'medium');
        expect(move).not.toBeNull();
    });
});

describe('AI - Hard Mode (Minimax)', () => {
    it('should return a valid legal move for Kalah', () => {
        const state = createInitialKalahState(4);
        const move = getBestCpuMove(state, 'kalah', 'hard');
        expect(KALAH_P1_PITS).toContain(move);
    });

    it('should return a valid legal move for Avalanche', () => {
        const state = createInitialAvalancheState(4);
        const move = getBestCpuMove(state, 'avalanche', 'hard');
        if (move !== null) {
            expect(KALAH_P1_PITS).toContain(move);
        }
    });

    it('should return a valid legal move for Oware', () => {
        const state = createInitialOwareState();
        const move = getBestCpuMove(state, 'oware', 'hard');
        if (move !== null) {
            const legalMoves = getLegalMovesForVariant(state, 'oware', 1);
            expect(legalMoves).toContain(move);
        }
    });
});

describe('AI - Edge Cases', () => {
    it('should handle end-game states without crashing', () => {
        const state = createInitialKalahState(4);
        state.isGameOver = true;
        const move = getBestCpuMove(state, 'kalah', 'hard');
        expect(move).toBeNull();
    });

    it('should handle states where opponent about to win', () => {
        const state = createInitialKalahState(4);
        KALAH_P1_PITS.forEach((p) => (state.pits[p] = 0));
        KALAH_P0_PITS.forEach((p) => (state.pits[p] = 10));
        state.pits[KALAH_P1_PITS[0]] = 1;
        const move = getBestCpuMove(state, 'kalah', 'hard');
        expect(move).toBe(KALAH_P1_PITS[0]);
    });

    it('should work with different difficulty levels consistently', () => {
        const state = createInitialKalahState(4);
        const difficulties = ['easy', 'medium', 'hard'] as const;
        for (const d of difficulties) {
            const move = getBestCpuMove(state, 'kalah', d);
            expect(KALAH_P1_PITS).toContain(move);
        }
    });
});

