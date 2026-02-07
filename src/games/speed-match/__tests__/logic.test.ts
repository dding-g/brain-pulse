import type { DifficultyLevel } from '@/games/types';
import { generateRounds, getConfig } from '../logic';
import { DIFFICULTY_CONFIG } from '../types';
import type { Shape } from '../types';

const ALL_SHAPES: Shape[] = [
  'circle', 'square', 'triangle', 'star', 'diamond', 'hexagon',
  'cross', 'heart', 'pentagon', 'octagon', 'arrow', 'moon',
];

describe('Speed Match - generateRounds', () => {
  const difficulties: DifficultyLevel[] = [1, 2, 3, 4, 5];

  it('produces the requested number of rounds', () => {
    for (const d of difficulties) {
      const rounds = generateRounds(d, 20);
      expect(rounds).toHaveLength(20);
    }
  });

  it('produces correct count for edge case of 1 round', () => {
    const rounds = generateRounds(3, 1);
    expect(rounds).toHaveLength(1);
    expect(rounds[0].isFirst).toBe(true);
  });

  it('first round always has isFirst:true and isMatch:false', () => {
    // Run multiple times to account for randomness
    for (let i = 0; i < 20; i++) {
      const rounds = generateRounds(3, 15);
      expect(rounds[0].isFirst).toBe(true);
      expect(rounds[0].isMatch).toBe(false);
    }
  });

  it('subsequent rounds always have isFirst:false', () => {
    const rounds = generateRounds(3, 20);
    for (let i = 1; i < rounds.length; i++) {
      expect(rounds[i].isFirst).toBe(false);
    }
  });

  it('isMatch correctly reflects whether shape matches previous round', () => {
    const rounds = generateRounds(3, 30);
    for (let i = 1; i < rounds.length; i++) {
      if (rounds[i].isMatch) {
        expect(rounds[i].shape).toBe(rounds[i - 1].shape);
      } else {
        expect(rounds[i].shape).not.toBe(rounds[i - 1].shape);
      }
    }
  });

  it.each(difficulties)(
    'shapes come from the correct pool for difficulty %d',
    (difficulty) => {
      const config = DIFFICULTY_CONFIG[difficulty];
      const validShapes = ALL_SHAPES.slice(0, config.numShapes);
      const rounds = generateRounds(difficulty, 50);

      for (const round of rounds) {
        expect(validShapes).toContain(round.shape);
      }
    },
  );

  it('match ratio roughly matches config over many rounds', () => {
    // Use enough rounds to get statistical significance
    const difficulty: DifficultyLevel = 3;
    const config = DIFFICULTY_CONFIG[difficulty];
    const count = 500;
    const rounds = generateRounds(difficulty, count);

    // Only rounds after the first can be matches
    const matchableRounds = rounds.slice(1);
    const matchCount = matchableRounds.filter((r) => r.isMatch).length;
    const actualRatio = matchCount / matchableRounds.length;

    // Allow generous tolerance for randomness (+/- 0.1)
    expect(actualRatio).toBeGreaterThan(config.matchRatio - 0.1);
    expect(actualRatio).toBeLessThan(config.matchRatio + 0.1);
  });

  it('every round has a color string', () => {
    const rounds = generateRounds(2, 20);
    for (const round of rounds) {
      expect(typeof round.color).toBe('string');
      expect(round.color.length).toBeGreaterThan(0);
    }
  });
});

describe('Speed Match - getConfig', () => {
  it('returns config for each difficulty level', () => {
    for (const d of [1, 2, 3, 4, 5] as DifficultyLevel[]) {
      const config = getConfig(d);
      expect(config).toEqual(DIFFICULTY_CONFIG[d]);
      expect(config.displayTimeMs).toBeGreaterThan(0);
      expect(config.numShapes).toBeGreaterThan(0);
      expect(config.matchRatio).toBeGreaterThan(0);
      expect(config.matchRatio).toBeLessThan(1);
    }
  });

  it('displayTimeMs decreases as difficulty increases', () => {
    const times = ([1, 2, 3, 4, 5] as DifficultyLevel[]).map(
      (d) => getConfig(d).displayTimeMs,
    );
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeLessThanOrEqual(times[i - 1]);
    }
  });

  it('numShapes increases as difficulty increases', () => {
    const shapes = ([1, 2, 3, 4, 5] as DifficultyLevel[]).map(
      (d) => getConfig(d).numShapes,
    );
    for (let i = 1; i < shapes.length; i++) {
      expect(shapes[i]).toBeGreaterThanOrEqual(shapes[i - 1]);
    }
  });
});
