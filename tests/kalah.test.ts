import { describe, it, expect } from 'vitest';
import {
    createInitialKalahState,
    makeKalahMove,
    getLegalKalahMoves,
    KALAH_P0_PITS,
    KALAH_P1_PITS,
    KALAH_P0_STORE,
    KALAH_P1_STORE,
} from '../src/lib/kalah';

describe('Kalah - Initial State', () => {
    it('should create initial state with 4 seeds per pit', () => {
        const state = createInitialKalahState(4);
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
        const state = createInitialKalahState(6);
        KALAH_P0_PITS.forEach((p) => expect(state.pits[p]).toBe(6));
    });
});

describe('Kalah - Legal Moves', () => {
    it('should return all non-empty pits for player 0', () => {
        const state = createInitialKalahState(4);
        const moves = getLegalKalahMoves(state, 0);
        expect(moves).toEqual(KALAH_P0_PITS);
        expect(moves).toHaveLength(6);
    });

    it('should return all non-empty pits for player 1', () => {
        const state = createInitialKalahState(4);
        const moves = getLegalKalahMoves(state, 1);
        expect(moves).toEqual(KALAH_P1_PITS);
        expect(moves).toHaveLength(6);
    });

    it('should return empty array when game is over', () => {
        const state = createInitialKalahState(4);
        state.isGameOver = true;
        const moves = getLegalKalahMoves(state, 0);
        expect(moves).toHaveLength(0);
    });

    it('should exclude empty pits', () => {
        const state = createInitialKalahState(4);
        state.pits[0] = 0;
        state.pits[1] = 0;
        const moves = getLegalKalahMoves(state, 0);
        expect(moves).not.toContain(0);
        expect(moves).not.toContain(1);
        expect(moves).toHaveLength(4);
    });
});

describe('Kalah - Basic Move', () => {
    it('should sow seeds counter-clockwise skipping opponent store', () => {
        const state = createInitialKalahState(4);
        const result = makeKalahMove(state, 0);
        expect(result.pits[0]).toBe(0);
        expect(result.pits[1]).toBe(5);
        expect(result.pits[2]).toBe(5);
        expect(result.pits[3]).toBe(5);
        expect(result.pits[4]).toBe(5);
        expect(result.pits[5]).toBe(4);
        expect(result.pits[KALAH_P0_STORE]).toBe(0);
        expect(result.turn).toBe(1);
    });

    it('should set lastSownPit correctly', () => {
        const state = createInitialKalahState(4);
        const result = makeKalahMove(state, 0);
        expect(result.lastSownPit).toBe(4);
    });

    it('should record move in history', () => {
        const state = createInitialKalahState(4);
        const result = makeKalahMove(state, 3);
        expect(result.moveHistory).toHaveLength(1);
        expect(result.moveHistory[0].player).toBe(0);
        expect(result.moveHistory[0].pitIndex).toBe(3);
        expect(result.moveHistory[0].seedsSown).toBe(4);
        expect(result.moveHistory[0].extraTurn).toBe(false);
        expect(result.moveHistory[0].captured).toBe(0);
        expect(result.moveHistory[0].timestamp).toBeDefined();
    });

    it('should handle scoring from pit landing in own store', () => {
        const state = createInitialKalahState(4);
        const result = makeKalahMove(state, 5);
        expect(result.pits[5]).toBe(0);
        expect(result.pits[KALAH_P0_STORE]).toBe(1);
        expect(result.pits[7]).toBe(5);
        expect(result.pits[8]).toBe(5);
        expect(result.pits[9]).toBe(5);
        expect(result.turn).toBe(1);
    });
});

describe('Kalah - Extra Turn', () => {
    it('should grant extra turn when last seed lands in own store', () => {
        const state = createInitialKalahState(4);
        const result = makeKalahMove(state, 2);
        expect(result.pits[KALAH_P0_STORE]).toBe(1);
        expect(result.extraTurn).toBe(true);
        expect(result.turn).toBe(0);
        expect(result.moveHistory[0].extraTurn).toBe(true);
    });
});

describe('Kalah - Captures', () => {
    it('should capture seeds from opposite pit when landing in empty own pit', () => {
        const state = createInitialKalahState(4);
        // Set pit 1 to 1 seed, pit 2 to 0 (empty), pit 10 (opposite of 2) to 3 seeds
        // Keep other pits with 1+ to avoid game end
        state.pits[1] = 1;
        state.pits[2] = 0;
        state.pits[10] = 3;
        const result = makeKalahMove(state, 1);
        expect(result.pits[1]).toBe(0);
        expect(result.pits[2]).toBe(0); // Captured
        expect(result.pits[10]).toBe(0); // Captured
        expect(result.pits[KALAH_P0_STORE]).toBe(4); // 1 (own) + 3 (opposite)
        expect(result.moveHistory[0].captured).toBe(4);
    });

    it('should not capture when opposite pit is empty', () => {
        const state = createInitialKalahState(4);
        state.pits[1] = 2; // 2 seeds from pit 1 -> lands in pit 2,3
        state.pits[2] = 0;
        state.pits[10] = 0; // Opposite empty
        const result = makeKalahMove(state, 1);
        expect(result.pits[1]).toBe(0);
        expect(result.pits[2]).toBe(1); // Just sits there
        expect(result.pits[10]).toBe(0);
        expect(result.pits[KALAH_P0_STORE]).toBe(0);
        expect(result.moveHistory[0].captured).toBe(0);
    });
});

describe('Kalah - Game Over', () => {
    it('should detect game over when a side is empty after move', () => {
        const state = createInitialKalahState(4);
        KALAH_P0_PITS.forEach((p) => (state.pits[p] = 0));
        KALAH_P1_PITS.forEach((p) => (state.pits[p] = 0));
        state.pits[KALAH_P0_STORE] = 10;
        state.pits[KALAH_P1_STORE] = 8;
        state.pits[KALAH_P1_PITS[0]] = 1;
        state.turn = 1;
        const result = makeKalahMove(state, KALAH_P1_PITS[0]);
        expect(result.isGameOver).toBe(true);
    });

    it('should sweep remaining seeds to store on game over', () => {
        const state = createInitialKalahState(4);
        KALAH_P0_PITS.forEach((p) => (state.pits[p] = 0));
        KALAH_P1_PITS.forEach((p) => (state.pits[p] = 0));
        state.pits[KALAH_P0_STORE] = 5;
        state.pits[KALAH_P1_STORE] = 5;
        state.pits[KALAH_P1_PITS[0]] = 1;
        state.pits[KALAH_P1_PITS[1]] = 2;
        state.turn = 1;
        const storeBefore = state.pits[KALAH_P1_STORE];
        const result = makeKalahMove(state, KALAH_P1_PITS[0]);
        if (result.isGameOver) {
            expect(result.pits[KALAH_P1_STORE]).toBeGreaterThan(storeBefore);
        }
    });

    it('should determine correct winner', () => {
        const state = createInitialKalahState(4);
        KALAH_P0_PITS.forEach((p) => (state.pits[p] = 0));
        KALAH_P1_PITS.forEach((p) => (state.pits[p] = 0));
        state.pits[KALAH_P0_STORE] = 20;
        state.pits[KALAH_P1_STORE] = 5;
        state.pits[KALAH_P1_PITS[0]] = 1;
        state.turn = 1;
        const result = makeKalahMove(state, KALAH_P1_PITS[0]);
        expect(result.isGameOver).toBe(true);
        expect(result.winner).toBe(0);
    });
});

describe('Kalah - Edge Cases', () => {
    it('should reject illegal move (empty pit)', () => {
        const state = createInitialKalahState(4);
        state.pits[0] = 0;
        const result = makeKalahMove(state, 0);
        expect(result).toBe(state);
    });

    it('should reject illegal move (opponent pit)', () => {
        const state = createInitialKalahState(4);
        const result = makeKalahMove(state, KALAH_P1_PITS[0]);
        expect(result).toBe(state);
    });

    it('should handle move from each player pit', () => {
        const state = createInitialKalahState(4);
        for (const pit of KALAH_P0_PITS) {
            const result = makeKalahMove(state, pit);
            expect(result.pits[pit]).toBe(0);
        }
    });

    it('should handle wrap-around sowing correctly', () => {
        const state = createInitialKalahState(4);
        state.turn = 1;
        state.pits[12] = 10; // P1 pit 12 with 10 seeds
        // Trace: 12->13,+1, 13->0,+1, 0->1,+1, 1->2,+1, 2->3,+1, 3->4,+1, 4->5,+1, 5->6(skip,opp store), 6->7,+1, 7->8,+1
        // That's 10 seeds: 13,0,1,2,3,4,5,7,8 -> wait that's only 9 seeds with skip
        // 12: 10 seeds. Skip opp store (6). 
        // seed1->13, seed2->0, seed3->1, seed4->2, seed5->3, seed6->4, seed7->5, seed8->7, seed9->8, seed10->9
        // lastSownPit = 9
        const result = makeKalahMove(state, 12);
        expect(result.pits[12]).toBe(0);
        expect(result.pits[13]).toBe(1); // store had 0 + 1
        expect(result.lastSownPit).toBe(9);
    });

    it('should generate correct status messages', () => {
        const state = createInitialKalahState(4);
        // Normal move
        let result = makeKalahMove(state, 0);
        expect(result.statusMessage).toContain("Player 2");

        // Extra turn
        const state2 = createInitialKalahState(4);
        result = makeKalahMove(state2, 2);
        expect(result.statusMessage).toContain('Extra Turn');
    });

    it('should update scores array from store counts', () => {
        const state = createInitialKalahState(4);
        const result = makeKalahMove(state, 0);
        expect(result.scores[0]).toBe(result.pits[KALAH_P0_STORE]);
        expect(result.scores[1]).toBe(result.pits[KALAH_P1_STORE]);
    });
});

