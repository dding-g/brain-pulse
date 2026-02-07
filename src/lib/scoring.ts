import type { GameResult, DifficultyLevel } from '@/games/types';

/**
 * Composite score calculation.
 *
 * Formula:
 *   compositeScore = weightedAvg(gameScores) * difficultyMultiplier
 *
 * Each game score is calculated as:
 *   gameScore = (accuracy * 60) + (speedBonus * 25) + (difficultyBonus * 15)
 *
 * Where:
 *   - accuracy = correctCount / totalCount (0-1)
 *   - speedBonus = max(0, 1 - (durationMs / maxDurationMs)) clamped 0-1
 *   - difficultyBonus = (difficulty - 1) / 4  (0-1, scales with difficulty)
 */

const MAX_GAME_DURATION_MS = 30_000;

const WEIGHTS = {
  accuracy: 60,
  speed: 25,
  difficulty: 15,
} as const;

/** Calculate a single game's score (0-100) */
export function calculateGameScore(result: GameResult): number {
  const accuracy = result.totalCount > 0 ? result.correctCount / result.totalCount : 0;
  const speedBonus = Math.max(0, 1 - result.durationMs / MAX_GAME_DURATION_MS);
  const difficultyBonus = (result.difficulty - 1) / 4;

  const score =
    accuracy * WEIGHTS.accuracy +
    speedBonus * WEIGHTS.speed +
    difficultyBonus * WEIGHTS.difficulty;

  return Math.round(Math.min(100, Math.max(0, score)));
}

/** Calculate composite score from multiple game results (0-100) */
export function calculateCompositeScore(results: GameResult[]): number {
  if (results.length === 0) return 0;

  const totalScore = results.reduce((sum, result) => sum + calculateGameScore(result), 0);
  const avg = totalScore / results.length;

  // Apply a slight bonus for completing more games
  const completionBonus = Math.min(5, results.length - 1);

  return Math.round(Math.min(100, avg + completionBonus));
}

/** Get difficulty multiplier label for display */
export function getDifficultyLabel(difficulty: DifficultyLevel): { ko: string; en: string } {
  const labels: Record<DifficultyLevel, { ko: string; en: string }> = {
    1: { ko: '매우 쉬움', en: 'Very Easy' },
    2: { ko: '쉬움', en: 'Easy' },
    3: { ko: '보통', en: 'Normal' },
    4: { ko: '어려움', en: 'Hard' },
    5: { ko: '매우 어려움', en: 'Very Hard' },
  };
  return labels[difficulty];
}

/** Generate a unique session ID */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `bp_${timestamp}_${random}`;
}
