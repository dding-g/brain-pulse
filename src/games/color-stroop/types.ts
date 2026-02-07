import type { DifficultyLevel } from '@/games/types';

export interface ColorDef {
  name: string;
  nameKo: string;
  hex: string;
}

export interface StroopRound {
  /** The word displayed (e.g., "RED") */
  word: string;
  /** Korean word */
  wordKo: string;
  /** The ink color the word is displayed in (the correct answer) */
  inkColor: ColorDef;
  /** The color the word refers to (the distractor) */
  wordColor: ColorDef;
  /** Whether word meaning matches ink color */
  isCongruent: boolean;
  /** The answer options to display */
  options: ColorDef[];
}

export interface StroopConfig {
  /** Ratio of congruent trials (word matches color) */
  congruentRatio: number;
  /** Display time before auto-skip (ms) */
  displayTimeMs: number;
  /** Number of colors in the pool */
  numColors: number;
}

export const DIFFICULTY_CONFIG: Record<DifficultyLevel, StroopConfig> = {
  1: { congruentRatio: 0.5, displayTimeMs: 3000, numColors: 4 },
  2: { congruentRatio: 0.4, displayTimeMs: 2500, numColors: 4 },
  3: { congruentRatio: 0.3, displayTimeMs: 2000, numColors: 5 },
  4: { congruentRatio: 0.2, displayTimeMs: 1500, numColors: 5 },
  5: { congruentRatio: 0.15, displayTimeMs: 1000, numColors: 6 },
};
