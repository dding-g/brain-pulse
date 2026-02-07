import type { DifficultyLevel, GameResult } from '@/games/types';
import {
  calculateGameScore,
  calculateCompositeScore,
  getDifficultyLabel,
  generateSessionId,
} from '../scoring';

function makeResult(overrides: Partial<GameResult> = {}): GameResult {
  return {
    gameId: 'test-game',
    score: 70,
    durationMs: 15000,
    accuracy: 0.8,
    difficulty: 3,
    correctCount: 16,
    totalCount: 20,
    ...overrides,
  };
}

describe('Scoring - calculateGameScore', () => {
  it('returns a number between 0 and 100', () => {
    const variations: Partial<GameResult>[] = [
      { accuracy: 1.0, durationMs: 0, difficulty: 5, correctCount: 20, totalCount: 20 },
      { accuracy: 0, durationMs: 30000, difficulty: 1, correctCount: 0, totalCount: 20 },
      { accuracy: 0.5, durationMs: 15000, difficulty: 3, correctCount: 10, totalCount: 20 },
    ];

    for (const v of variations) {
      const score = calculateGameScore(makeResult(v));
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it('returns 0 for zero accuracy, max duration, and minimum difficulty', () => {
    const result = makeResult({
      correctCount: 0,
      totalCount: 20,
      durationMs: 30000, // MAX_GAME_DURATION_MS
      difficulty: 1,
    });
    const score = calculateGameScore(result);
    expect(score).toBe(0);
  });

  it('returns maximum score for perfect accuracy, instant completion, max difficulty', () => {
    const result = makeResult({
      correctCount: 20,
      totalCount: 20,
      durationMs: 0,
      difficulty: 5,
    });
    const score = calculateGameScore(result);
    // accuracy * 60 + speed * 25 + difficulty * 15
    // 1.0 * 60 + 1.0 * 25 + (5-1)/4 * 15 = 60 + 25 + 15 = 100
    expect(score).toBe(100);
  });

  it('correctly weights accuracy at 60%', () => {
    // Isolate accuracy: durationMs = MAX so speedBonus = 0, difficulty = 1 so difficultyBonus = 0
    const result = makeResult({
      correctCount: 10,
      totalCount: 20,
      durationMs: 30000,
      difficulty: 1,
    });
    const score = calculateGameScore(result);
    // 0.5 * 60 + 0 * 25 + 0 * 15 = 30
    expect(score).toBe(30);
  });

  it('correctly weights speed at 25%', () => {
    // Isolate speed: accuracy = 0 (totalCount = 0 trick won't work, use 0 correct out of many)
    const result = makeResult({
      correctCount: 0,
      totalCount: 20,
      durationMs: 0, // instant = speedBonus 1.0
      difficulty: 1,
    });
    const score = calculateGameScore(result);
    // 0 * 60 + 1.0 * 25 + 0 * 15 = 25
    expect(score).toBe(25);
  });

  it('correctly weights difficulty at 15%', () => {
    // Isolate difficulty: accuracy = 0, durationMs = MAX
    const result = makeResult({
      correctCount: 0,
      totalCount: 20,
      durationMs: 30000,
      difficulty: 5,
    });
    const score = calculateGameScore(result);
    // 0 * 60 + 0 * 25 + (5-1)/4 * 15 = 0 + 0 + 15 = 15
    expect(score).toBe(15);
  });

  it('handles totalCount of 0 without crashing', () => {
    const result = makeResult({
      correctCount: 0,
      totalCount: 0,
      durationMs: 15000,
      difficulty: 3,
    });
    const score = calculateGameScore(result);
    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('speed bonus clamps to 0 when duration exceeds max', () => {
    const result = makeResult({
      correctCount: 20,
      totalCount: 20,
      durationMs: 60000, // way over MAX
      difficulty: 1,
    });
    const score = calculateGameScore(result);
    // 1.0 * 60 + 0 * 25 + 0 * 15 = 60
    expect(score).toBe(60);
  });

  it('returns an integer (rounded)', () => {
    // Use values that produce a fractional score
    const result = makeResult({
      correctCount: 7,
      totalCount: 11,
      durationMs: 12345,
      difficulty: 2,
    });
    const score = calculateGameScore(result);
    expect(Number.isInteger(score)).toBe(true);
  });
});

describe('Scoring - calculateCompositeScore', () => {
  it('returns 0 for empty results array', () => {
    const score = calculateCompositeScore([]);
    expect(score).toBe(0);
  });

  it('returns score equal to single game score for single result (no completion bonus)', () => {
    const result = makeResult({
      correctCount: 20,
      totalCount: 20,
      durationMs: 0,
      difficulty: 5,
    });
    const gameScore = calculateGameScore(result);
    const composite = calculateCompositeScore([result]);
    // completionBonus = min(5, 1-1) = 0, so composite = gameScore
    expect(composite).toBe(gameScore);
  });

  it('averages scores correctly for multiple results', () => {
    const r1 = makeResult({
      correctCount: 20, totalCount: 20, durationMs: 30000, difficulty: 1,
    }); // accuracy=1.0*60 + speed=0 + diff=0 = 60
    const r2 = makeResult({
      correctCount: 0, totalCount: 20, durationMs: 30000, difficulty: 1,
    }); // 0

    // avg = (60 + 0) / 2 = 30, completionBonus = min(5, 2-1) = 1
    const composite = calculateCompositeScore([r1, r2]);
    expect(composite).toBe(31); // 30 + 1
  });

  it('applies completion bonus that increases with more games (up to 5)', () => {
    const results = Array.from({ length: 6 }, () =>
      makeResult({
        correctCount: 0,
        totalCount: 20,
        durationMs: 30000,
        difficulty: 1,
      }),
    );

    const composite = calculateCompositeScore(results);
    // Each game scores 0, avg = 0, completionBonus = min(5, 6-1) = 5
    expect(composite).toBe(5);
  });

  it('completion bonus caps at 5', () => {
    const results = Array.from({ length: 20 }, () =>
      makeResult({
        correctCount: 0,
        totalCount: 20,
        durationMs: 30000,
        difficulty: 1,
      }),
    );

    const composite = calculateCompositeScore(results);
    // avg = 0, completionBonus = min(5, 20-1) = 5
    expect(composite).toBe(5);
  });

  it('caps at 100 even with high scores and completion bonus', () => {
    const results = Array.from({ length: 6 }, () =>
      makeResult({
        correctCount: 20,
        totalCount: 20,
        durationMs: 0,
        difficulty: 5,
      }),
    );

    // Each game scores 100, avg = 100, bonus = 5 => capped at 100
    const composite = calculateCompositeScore(results);
    expect(composite).toBe(100);
  });

  it('returns a number between 0 and 100', () => {
    const variations = [
      [makeResult({ correctCount: 5, totalCount: 10, durationMs: 10000, difficulty: 2 })],
      Array.from({ length: 4 }, () => makeResult()),
      [makeResult({ correctCount: 20, totalCount: 20, durationMs: 0, difficulty: 5 })],
    ];

    for (const results of variations) {
      const composite = calculateCompositeScore(results);
      expect(composite).toBeGreaterThanOrEqual(0);
      expect(composite).toBeLessThanOrEqual(100);
    }
  });

  it('returns an integer', () => {
    const results = [
      makeResult({ correctCount: 7, totalCount: 11, durationMs: 12345, difficulty: 2 }),
      makeResult({ correctCount: 13, totalCount: 17, durationMs: 8765, difficulty: 4 }),
    ];
    const composite = calculateCompositeScore(results);
    expect(Number.isInteger(composite)).toBe(true);
  });
});

describe('Scoring - getDifficultyLabel', () => {
  it('returns correct labels for each difficulty level', () => {
    const expected: Record<DifficultyLevel, { ko: string; en: string }> = {
      1: { ko: '매우 쉬움', en: 'Very Easy' },
      2: { ko: '쉬움', en: 'Easy' },
      3: { ko: '보통', en: 'Normal' },
      4: { ko: '어려움', en: 'Hard' },
      5: { ko: '매우 어려움', en: 'Very Hard' },
    };

    for (const d of [1, 2, 3, 4, 5] as DifficultyLevel[]) {
      const label = getDifficultyLabel(d);
      expect(label).toEqual(expected[d]);
    }
  });
});

describe('Scoring - generateSessionId', () => {
  it('starts with "bp_" prefix', () => {
    const id = generateSessionId();
    expect(id.startsWith('bp_')).toBe(true);
  });

  it('contains two underscore-separated parts after prefix', () => {
    const id = generateSessionId();
    const parts = id.split('_');
    // bp, timestamp, random
    expect(parts).toHaveLength(3);
  });

  it('generates unique IDs across multiple calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateSessionId());
    }
    expect(ids.size).toBe(100);
  });

  it('returns a string', () => {
    expect(typeof generateSessionId()).toBe('string');
  });
});
