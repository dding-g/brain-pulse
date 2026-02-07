import type { DifficultyLevel } from '@/games/types';

export interface SequenceRound {
  /** The sequence of tile indices to reproduce */
  sequence: number[];
  /** Grid size (e.g., 3 means 3x3) */
  gridSize: number;
}

export interface SequenceConfig {
  /** Grid dimension (3 = 3x3, 4 = 4x4, 5 = 5x5) */
  gridSize: number;
  /** Starting sequence length */
  startLength: number;
  /** Maximum sequence length */
  maxLength: number;
  /** How long each tile flashes (ms) */
  flashDurationMs: number;
  /** Pause between flashes (ms) */
  pauseBetweenMs: number;
}

export const DIFFICULTY_CONFIG: Record<DifficultyLevel, SequenceConfig> = {
  1: { gridSize: 3, startLength: 3, maxLength: 6, flashDurationMs: 800, pauseBetweenMs: 300 },
  2: { gridSize: 3, startLength: 3, maxLength: 7, flashDurationMs: 650, pauseBetweenMs: 250 },
  3: { gridSize: 4, startLength: 4, maxLength: 8, flashDurationMs: 500, pauseBetweenMs: 200 },
  4: { gridSize: 4, startLength: 5, maxLength: 9, flashDurationMs: 400, pauseBetweenMs: 150 },
  5: { gridSize: 5, startLength: 5, maxLength: 9, flashDurationMs: 300, pauseBetweenMs: 100 },
};
