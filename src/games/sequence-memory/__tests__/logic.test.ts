import type { DifficultyLevel } from '@/games/types';
import { generateRound, checkSequence, getConfig } from '../logic';
import { DIFFICULTY_CONFIG } from '../types';

describe('Sequence Memory - generateRound', () => {
  it('produces a sequence of the requested length', () => {
    const round = generateRound(4, 6);
    expect(round.sequence).toHaveLength(6);
  });

  it('stores the correct gridSize', () => {
    const round = generateRound(5, 4);
    expect(round.gridSize).toBe(5);
  });

  it('all indices are within valid grid range [0, gridSize^2)', () => {
    const gridSizes = [3, 4, 5];
    for (const gridSize of gridSizes) {
      const totalTiles = gridSize * gridSize;
      const round = generateRound(gridSize, 20);
      for (const idx of round.sequence) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(totalTiles);
      }
    }
  });

  it('no two consecutive indices are the same', () => {
    // Run multiple times due to randomness
    for (let trial = 0; trial < 20; trial++) {
      const round = generateRound(4, 15);
      for (let i = 1; i < round.sequence.length; i++) {
        expect(round.sequence[i]).not.toBe(round.sequence[i - 1]);
      }
    }
  });

  it('works with sequence length of 1', () => {
    const round = generateRound(3, 1);
    expect(round.sequence).toHaveLength(1);
    expect(round.sequence[0]).toBeGreaterThanOrEqual(0);
    expect(round.sequence[0]).toBeLessThan(9);
  });

  it('all indices are integers', () => {
    const round = generateRound(5, 10);
    for (const idx of round.sequence) {
      expect(Number.isInteger(idx)).toBe(true);
    }
  });

  it.each([1, 2, 3, 4, 5] as DifficultyLevel[])(
    'generates valid round for difficulty %d config',
    (difficulty) => {
      const config = DIFFICULTY_CONFIG[difficulty];
      const round = generateRound(config.gridSize, config.startLength);
      expect(round.sequence).toHaveLength(config.startLength);
      expect(round.gridSize).toBe(config.gridSize);

      const totalTiles = config.gridSize * config.gridSize;
      for (const idx of round.sequence) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(totalTiles);
      }
    },
  );
});

describe('Sequence Memory - checkSequence', () => {
  it('returns correct:true when sequences match', () => {
    const target = [0, 5, 3, 7, 1];
    const result = checkSequence(target, [0, 5, 3, 7, 1]);
    expect(result.correct).toBe(true);
    expect(result.failedAt).toBe(-1);
  });

  it('returns correct:true for partial correct input (prefix match)', () => {
    const target = [0, 5, 3, 7, 1];
    const result = checkSequence(target, [0, 5, 3]);
    expect(result.correct).toBe(true);
    expect(result.failedAt).toBe(-1);
  });

  it('returns correct:false with failedAt index on first mismatch', () => {
    const target = [0, 5, 3, 7, 1];
    const result = checkSequence(target, [0, 5, 9]);
    expect(result.correct).toBe(false);
    expect(result.failedAt).toBe(2);
  });

  it('returns correct:false when first element is wrong', () => {
    const target = [0, 5, 3];
    const result = checkSequence(target, [9]);
    expect(result.correct).toBe(false);
    expect(result.failedAt).toBe(0);
  });

  it('handles empty user input as correct', () => {
    const target = [0, 5, 3];
    const result = checkSequence(target, []);
    expect(result.correct).toBe(true);
    expect(result.failedAt).toBe(-1);
  });
});

describe('Sequence Memory - getConfig', () => {
  it('returns correct config for each difficulty level', () => {
    for (const d of [1, 2, 3, 4, 5] as DifficultyLevel[]) {
      const config = getConfig(d);
      expect(config).toEqual(DIFFICULTY_CONFIG[d]);
    }
  });

  it('gridSize increases with difficulty', () => {
    const sizes = ([1, 2, 3, 4, 5] as DifficultyLevel[]).map(
      (d) => getConfig(d).gridSize,
    );
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]).toBeGreaterThanOrEqual(sizes[i - 1]);
    }
  });

  it('startLength increases with difficulty', () => {
    const lengths = ([1, 2, 3, 4, 5] as DifficultyLevel[]).map(
      (d) => getConfig(d).startLength,
    );
    for (let i = 1; i < lengths.length; i++) {
      expect(lengths[i]).toBeGreaterThanOrEqual(lengths[i - 1]);
    }
  });

  it('flashDurationMs decreases with difficulty', () => {
    const durations = ([1, 2, 3, 4, 5] as DifficultyLevel[]).map(
      (d) => getConfig(d).flashDurationMs,
    );
    for (let i = 1; i < durations.length; i++) {
      expect(durations[i]).toBeLessThanOrEqual(durations[i - 1]);
    }
  });
});
