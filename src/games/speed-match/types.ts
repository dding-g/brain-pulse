import type { DifficultyLevel } from '@/games/types';

export type Shape =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'star'
  | 'diamond'
  | 'hexagon'
  | 'cross'
  | 'heart'
  | 'pentagon'
  | 'octagon'
  | 'arrow'
  | 'moon';

export interface SpeedMatchRound {
  shape: Shape;
  color: string;
  /** Whether this round's shape matches the previous round */
  isMatch: boolean;
  /** Whether this is the first round (no user input needed) */
  isFirst: boolean;
}

export interface SpeedMatchConfig {
  /** How long each shape is shown (ms) */
  displayTimeMs: number;
  /** Number of distinct shapes in the pool */
  numShapes: number;
  /** Match probability (0-1) */
  matchRatio: number;
}

export const DIFFICULTY_CONFIG: Record<DifficultyLevel, SpeedMatchConfig> = {
  1: { displayTimeMs: 2000, numShapes: 4, matchRatio: 0.5 },
  2: { displayTimeMs: 1500, numShapes: 5, matchRatio: 0.45 },
  3: { displayTimeMs: 1200, numShapes: 7, matchRatio: 0.4 },
  4: { displayTimeMs: 800, numShapes: 9, matchRatio: 0.35 },
  5: { displayTimeMs: 500, numShapes: 12, matchRatio: 0.3 },
};
