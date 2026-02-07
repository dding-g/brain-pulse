import type { DifficultyLevel, GameResult } from '@/games/types';

// Mock the MMKV storage module before importing the module under test
jest.mock('@/features/storage/mmkv', () => {
  let store: Record<string, unknown> = {};

  return {
    getDifficultyProfile: jest.fn(() => {
      return (store['difficultyProfile'] as { gameLevels: Record<string, DifficultyLevel>; updatedAt: string }) ?? {
        gameLevels: {},
        updatedAt: new Date().toISOString(),
      };
    }),
    setDifficultyProfile: jest.fn((profile: { gameLevels: Record<string, DifficultyLevel>; updatedAt: string }) => {
      store['difficultyProfile'] = profile;
    }),
    __resetStore: () => {
      store = {};
    },
  };
});

import {
  getDifficultyForGame,
  updateDifficulty,
  resetDifficulty,
} from '../difficulty';
import { getDifficultyProfile, setDifficultyProfile } from '@/features/storage/mmkv';

// Access the test helper
const mockModule = jest.requireMock('@/features/storage/mmkv') as {
  __resetStore: () => void;
};

function makeResult(overrides: Partial<GameResult> = {}): GameResult {
  return {
    gameId: 'speed-match',
    score: 70,
    durationMs: 15000,
    accuracy: 0.8,
    difficulty: 3,
    correctCount: 16,
    totalCount: 20,
    ...overrides,
  };
}

describe('Adaptive Difficulty - getDifficultyForGame', () => {
  beforeEach(() => {
    mockModule.__resetStore();
    jest.clearAllMocks();
  });

  it('returns default difficulty (2) when no profile exists for the game', () => {
    const level = getDifficultyForGame('speed-match');
    expect(level).toBe(2);
  });

  it('returns the stored difficulty for a known game', () => {
    (getDifficultyProfile as jest.Mock).mockReturnValueOnce({
      gameLevels: { 'speed-match': 4 },
      updatedAt: new Date().toISOString(),
    });

    const level = getDifficultyForGame('speed-match');
    expect(level).toBe(4);
  });

  it('returns default difficulty for an unknown game when other games exist', () => {
    (getDifficultyProfile as jest.Mock).mockReturnValueOnce({
      gameLevels: { 'color-stroop': 5 },
      updatedAt: new Date().toISOString(),
    });

    const level = getDifficultyForGame('speed-match');
    expect(level).toBe(2);
  });

  it('returns a valid DifficultyLevel (1-5)', () => {
    for (const level of [1, 2, 3, 4, 5]) {
      (getDifficultyProfile as jest.Mock).mockReturnValueOnce({
        gameLevels: { 'test-game': level },
        updatedAt: new Date().toISOString(),
      });

      const result = getDifficultyForGame('test-game');
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(5);
    }
  });
});

describe('Adaptive Difficulty - updateDifficulty', () => {
  beforeEach(() => {
    mockModule.__resetStore();
    jest.clearAllMocks();
  });

  it('increases difficulty when score >= 85 and accuracy >= 0.9', () => {
    // Start at difficulty 3
    (getDifficultyProfile as jest.Mock).mockReturnValue({
      gameLevels: { 'speed-match': 3 },
      updatedAt: new Date().toISOString(),
    });

    const result = makeResult({ score: 90, accuracy: 0.95 });
    const newLevel = updateDifficulty(result);
    expect(newLevel).toBe(4);
    expect(setDifficultyProfile).toHaveBeenCalled();
  });

  it('decreases difficulty when score <= 40', () => {
    (getDifficultyProfile as jest.Mock).mockReturnValue({
      gameLevels: { 'speed-match': 3 },
      updatedAt: new Date().toISOString(),
    });

    const result = makeResult({ score: 35, accuracy: 0.7 });
    const newLevel = updateDifficulty(result);
    expect(newLevel).toBe(2);
  });

  it('decreases difficulty when accuracy <= 0.5', () => {
    (getDifficultyProfile as jest.Mock).mockReturnValue({
      gameLevels: { 'speed-match': 3 },
      updatedAt: new Date().toISOString(),
    });

    const result = makeResult({ score: 60, accuracy: 0.4 });
    const newLevel = updateDifficulty(result);
    expect(newLevel).toBe(2);
  });

  it('keeps difficulty unchanged for moderate results', () => {
    (getDifficultyProfile as jest.Mock).mockReturnValue({
      gameLevels: { 'speed-match': 3 },
      updatedAt: new Date().toISOString(),
    });

    const result = makeResult({ score: 65, accuracy: 0.75 });
    const newLevel = updateDifficulty(result);
    expect(newLevel).toBe(3);
    // setDifficultyProfile should not be called when level doesn't change
    expect(setDifficultyProfile).not.toHaveBeenCalled();
  });

  it('does not exceed maximum difficulty (5)', () => {
    (getDifficultyProfile as jest.Mock).mockReturnValue({
      gameLevels: { 'speed-match': 5 },
      updatedAt: new Date().toISOString(),
    });

    const result = makeResult({ score: 95, accuracy: 0.98 });
    const newLevel = updateDifficulty(result);
    expect(newLevel).toBe(5);
  });

  it('does not go below minimum difficulty (1)', () => {
    (getDifficultyProfile as jest.Mock).mockReturnValue({
      gameLevels: { 'speed-match': 1 },
      updatedAt: new Date().toISOString(),
    });

    const result = makeResult({ score: 20, accuracy: 0.3 });
    const newLevel = updateDifficulty(result);
    expect(newLevel).toBe(1);
  });

  it('uses default difficulty (2) when game has no stored level', () => {
    (getDifficultyProfile as jest.Mock).mockReturnValue({
      gameLevels: {},
      updatedAt: new Date().toISOString(),
    });

    // High performance: should go from default 2 to 3
    const result = makeResult({ score: 90, accuracy: 0.95 });
    const newLevel = updateDifficulty(result);
    expect(newLevel).toBe(3);
  });

  it('boundary: score exactly 85 and accuracy exactly 0.9 triggers increase', () => {
    (getDifficultyProfile as jest.Mock).mockReturnValue({
      gameLevels: { 'speed-match': 3 },
      updatedAt: new Date().toISOString(),
    });

    const result = makeResult({ score: 85, accuracy: 0.9 });
    const newLevel = updateDifficulty(result);
    expect(newLevel).toBe(4);
  });

  it('boundary: score exactly 40 triggers decrease', () => {
    (getDifficultyProfile as jest.Mock).mockReturnValue({
      gameLevels: { 'speed-match': 3 },
      updatedAt: new Date().toISOString(),
    });

    const result = makeResult({ score: 40, accuracy: 0.7 });
    const newLevel = updateDifficulty(result);
    expect(newLevel).toBe(2);
  });

  it('boundary: accuracy exactly 0.5 triggers decrease', () => {
    (getDifficultyProfile as jest.Mock).mockReturnValue({
      gameLevels: { 'speed-match': 3 },
      updatedAt: new Date().toISOString(),
    });

    const result = makeResult({ score: 60, accuracy: 0.5 });
    const newLevel = updateDifficulty(result);
    expect(newLevel).toBe(2);
  });

  it('high score but low accuracy does not trigger increase', () => {
    (getDifficultyProfile as jest.Mock).mockReturnValue({
      gameLevels: { 'speed-match': 3 },
      updatedAt: new Date().toISOString(),
    });

    // score >= 85 but accuracy < 0.9 -- should stay (or decrease if accuracy <= 0.5)
    const result = makeResult({ score: 90, accuracy: 0.6 });
    const newLevel = updateDifficulty(result);
    expect(newLevel).toBe(3); // stays the same
  });
});

describe('Adaptive Difficulty - resetDifficulty', () => {
  beforeEach(() => {
    mockModule.__resetStore();
    jest.clearAllMocks();
  });

  it('calls setDifficultyProfile with empty gameLevels', () => {
    resetDifficulty();
    expect(setDifficultyProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        gameLevels: {},
        updatedAt: expect.any(String),
      }),
    );
  });
});
