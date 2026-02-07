import type { DifficultyLevel, DifficultyProfile, GameResult } from '@/games/types';
import { getDifficultyProfile, setDifficultyProfile } from '@/features/storage/mmkv';

/**
 * Rule-based adaptive difficulty algorithm.
 *
 * Adjusts difficulty per-game based on recent performance:
 * - Score >= 85 & accuracy >= 0.9  → difficulty up
 * - Score <= 40 or accuracy <= 0.5 → difficulty down
 * - Otherwise                       → stay
 *
 * Also factors in streak (consecutive good/bad results).
 */

const SCORE_THRESHOLD_UP = 85;
const ACCURACY_THRESHOLD_UP = 0.9;
const SCORE_THRESHOLD_DOWN = 40;
const ACCURACY_THRESHOLD_DOWN = 0.5;

const MIN_DIFFICULTY: DifficultyLevel = 1;
const MAX_DIFFICULTY: DifficultyLevel = 5;
const DEFAULT_DIFFICULTY: DifficultyLevel = 2;

/** Get the current difficulty for a specific game */
export function getDifficultyForGame(gameId: string): DifficultyLevel {
  const profile = getDifficultyProfile();
  return (profile.gameLevels[gameId] as DifficultyLevel) ?? DEFAULT_DIFFICULTY;
}

/** Update difficulty after a game result */
export function updateDifficulty(result: GameResult): DifficultyLevel {
  const profile = getDifficultyProfile();
  const currentLevel = (profile.gameLevels[result.gameId] as DifficultyLevel) ?? DEFAULT_DIFFICULTY;

  const newLevel = calculateNewDifficulty(currentLevel, result);

  if (newLevel !== currentLevel) {
    const updatedProfile: DifficultyProfile = {
      gameLevels: { ...profile.gameLevels, [result.gameId]: newLevel },
      updatedAt: new Date().toISOString(),
    };
    setDifficultyProfile(updatedProfile);
  }

  return newLevel;
}

function calculateNewDifficulty(
  current: DifficultyLevel,
  result: GameResult,
): DifficultyLevel {
  const { score, accuracy } = result;

  // Check for difficulty increase
  if (score >= SCORE_THRESHOLD_UP && accuracy >= ACCURACY_THRESHOLD_UP) {
    return clampDifficulty(current + 1);
  }

  // Check for difficulty decrease
  if (score <= SCORE_THRESHOLD_DOWN || accuracy <= ACCURACY_THRESHOLD_DOWN) {
    return clampDifficulty(current - 1);
  }

  // Stay at current level
  return current;
}

function clampDifficulty(level: number): DifficultyLevel {
  return Math.max(MIN_DIFFICULTY, Math.min(MAX_DIFFICULTY, level)) as DifficultyLevel;
}

/** Reset all difficulty levels to default */
export function resetDifficulty(): void {
  setDifficultyProfile({
    gameLevels: {},
    updatedAt: new Date().toISOString(),
  });
}
