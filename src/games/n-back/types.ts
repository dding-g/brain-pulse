import type { DifficultyLevel } from '@/games/types';

/** A single stimulus in the N-back sequence */
export interface NBackRound {
  /** Position on the 3x3 grid (0-8, left-to-right top-to-bottom) */
  position: number;
  /** Symbol displayed at the position */
  symbol: string;
  /** Color of the symbol */
  color: string;
  /** Whether this round's position matches N steps back */
  isMatch: boolean;
  /** Sequence index (0-based) */
  index: number;
}

/** Difficulty configuration for N-back */
export interface NBackConfig {
  /** N value — how many steps back to compare */
  nValue: number;
  /** How long each stimulus is shown (ms) */
  stimulusTimeMs: number;
  /** Gap between stimuli (ms) */
  interStimulusMs: number;
  /** Total number of rounds in a session */
  roundCount: number;
  /** Target probability of match trials */
  matchRatio: number;
}

export const DIFFICULTY_CONFIG: Record<DifficultyLevel, NBackConfig> = {
  1: { nValue: 1, stimulusTimeMs: 2500, interStimulusMs: 500, roundCount: 15, matchRatio: 0.35 },
  2: { nValue: 1, stimulusTimeMs: 2000, interStimulusMs: 400, roundCount: 18, matchRatio: 0.35 },
  3: { nValue: 2, stimulusTimeMs: 2000, interStimulusMs: 400, roundCount: 20, matchRatio: 0.30 },
  4: { nValue: 2, stimulusTimeMs: 1500, interStimulusMs: 300, roundCount: 22, matchRatio: 0.30 },
  5: { nValue: 3, stimulusTimeMs: 1200, interStimulusMs: 300, roundCount: 25, matchRatio: 0.25 },
};

/** Grid dimensions for the spatial grid */
export const GRID_SIZE = 3;
export const GRID_CELLS = GRID_SIZE * GRID_SIZE;
