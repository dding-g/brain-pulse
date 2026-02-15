import type { DifficultyLevel } from '@/games/types';
import { generateRounds, getConfig } from '../logic';
import { DIFFICULTY_CONFIG, GRID_CELLS } from '../types';

describe('N-back - generateRounds', () => {
  const difficulties: DifficultyLevel[] = [1, 2, 3, 4, 5];

  it('produces the configured number of rounds', () => {
    for (const d of difficulties) {
      const config = DIFFICULTY_CONFIG[d];
      const rounds = generateRounds(d);
      expect(rounds).toHaveLength(config.roundCount);
    }
  });

  it('respects countOverride parameter', () => {
    const rounds = generateRounds(1, 10);
    expect(rounds).toHaveLength(10);
  });

  it('first N rounds always have isMatch: false', () => {
    for (const d of difficulties) {
      const config = DIFFICULTY_CONFIG[d];
      const rounds = generateRounds(d);
      for (let i = 0; i < config.nValue; i++) {
        expect(rounds[i].isMatch).toBe(false);
      }
    }
  });

  it('all positions are within grid bounds (0 to GRID_CELLS-1)', () => {
    for (const d of difficulties) {
      const rounds = generateRounds(d);
      for (const round of rounds) {
        expect(round.position).toBeGreaterThanOrEqual(0);
        expect(round.position).toBeLessThan(GRID_CELLS);
      }
    }
  });

  it('isMatch correctly reflects position matching N steps back', () => {
    for (const d of difficulties) {
      const config = DIFFICULTY_CONFIG[d];
      const rounds = generateRounds(d);

      for (let i = config.nValue; i < rounds.length; i++) {
        const nBackRound = rounds[i - config.nValue];
        if (rounds[i].isMatch) {
          expect(rounds[i].position).toBe(nBackRound.position);
        } else {
          expect(rounds[i].position).not.toBe(nBackRound.position);
        }
      }
    }
  });

  it('match ratio roughly matches config over many rounds', () => {
    const difficulty: DifficultyLevel = 3;
    const config = DIFFICULTY_CONFIG[difficulty];
    const rounds = generateRounds(difficulty, 500);

    const scorable = rounds.slice(config.nValue);
    const matchCount = scorable.filter((r) => r.isMatch).length;
    const actualRatio = matchCount / scorable.length;

    expect(actualRatio).toBeGreaterThan(config.matchRatio - 0.1);
    expect(actualRatio).toBeLessThan(config.matchRatio + 0.1);
  });

  it('every round has a non-empty symbol and color', () => {
    const rounds = generateRounds(2);
    for (const round of rounds) {
      expect(typeof round.symbol).toBe('string');
      expect(round.symbol.length).toBeGreaterThan(0);
      expect(typeof round.color).toBe('string');
      expect(round.color.length).toBeGreaterThan(0);
    }
  });

  it('round indices are sequential starting from 0', () => {
    const rounds = generateRounds(1, 20);
    for (let i = 0; i < rounds.length; i++) {
      expect(rounds[i].index).toBe(i);
    }
  });
});

describe('N-back - getConfig', () => {
  it('returns config for each difficulty level', () => {
    for (const d of [1, 2, 3, 4, 5] as DifficultyLevel[]) {
      const config = getConfig(d);
      expect(config).toEqual(DIFFICULTY_CONFIG[d]);
      expect(config.nValue).toBeGreaterThan(0);
      expect(config.stimulusTimeMs).toBeGreaterThan(0);
      expect(config.roundCount).toBeGreaterThan(0);
      expect(config.matchRatio).toBeGreaterThan(0);
      expect(config.matchRatio).toBeLessThan(1);
    }
  });

  it('nValue increases with difficulty', () => {
    const nValues = ([1, 2, 3, 4, 5] as DifficultyLevel[]).map(
      (d) => getConfig(d).nValue,
    );
    for (let i = 1; i < nValues.length; i++) {
      expect(nValues[i]).toBeGreaterThanOrEqual(nValues[i - 1]);
    }
  });

  it('stimulusTimeMs decreases with difficulty', () => {
    const times = ([1, 2, 3, 4, 5] as DifficultyLevel[]).map(
      (d) => getConfig(d).stimulusTimeMs,
    );
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeLessThanOrEqual(times[i - 1]);
    }
  });

  it('roundCount increases with difficulty', () => {
    const counts = ([1, 2, 3, 4, 5] as DifficultyLevel[]).map(
      (d) => getConfig(d).roundCount,
    );
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1]);
    }
  });
});
