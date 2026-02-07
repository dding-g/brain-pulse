import type { ComponentType } from 'react';

/** Game modes corresponding to different session intensities */
export type GameMode = 'rest' | 'activation' | 'development';

/** Cognitive domains measured by mini-games */
export type CognitiveDomain =
  | 'reaction'      // Reaction time
  | 'memory'        // Working memory
  | 'attention'     // Selective attention
  | 'flexibility'   // Cognitive flexibility
  | 'processing';   // Processing speed

/** Difficulty level for adaptive system */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

/** Props passed to every mini-game component */
export interface GameProps {
  /** Current difficulty level (1-5) */
  difficulty: DifficultyLevel;
  /** Called when the game finishes, with the result */
  onComplete: (result: GameResult) => void;
  /** Called if the user manually exits the game */
  onExit: () => void;
}

/** Result returned by a completed mini-game */
export interface GameResult {
  /** ID of the game that was played */
  gameId: string;
  /** Raw score (0-100) */
  score: number;
  /** Time taken in milliseconds */
  durationMs: number;
  /** Accuracy as a ratio (0-1) */
  accuracy: number;
  /** Reaction time average in ms (if applicable) */
  reactionTimeMs?: number;
  /** Difficulty level the game was played at */
  difficulty: DifficultyLevel;
  /** Number of correct responses */
  correctCount: number;
  /** Total number of trials/items */
  totalCount: number;
  /** Raw metrics specific to each game type */
  rawMetrics?: Record<string, number>;
}

/** Registration info for a mini-game */
export interface MiniGameDefinition {
  /** Unique identifier */
  id: string;
  /** Display name (English) */
  name: string;
  /** Display name (Korean) */
  nameKo: string;
  /** Short description */
  description: string;
  /** Short description (Korean) */
  descriptionKo: string;
  /** Cognitive domain this game measures */
  domain: CognitiveDomain;
  /** Estimated duration in seconds */
  estimatedDurationSec: number;
  /** Which modes this game is available in */
  modes: GameMode[];
  /** The React component for this game */
  component: ComponentType<GameProps>;
}

/** A single completed session */
export interface SessionData {
  /** Unique session ID */
  id: string;
  /** When the session started */
  startedAt: string;
  /** When the session ended */
  endedAt: string;
  /** The game mode used */
  mode: GameMode;
  /** Individual game results */
  gameResults: GameResult[];
  /** Final composite score (0-100) */
  compositeScore: number;
  /** Pre-game condition self-report */
  conditionBefore: ConditionReport;
}

/** Pre-game condition self-report */
export interface ConditionReport {
  /** Sleep quality (1-5) */
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  /** Energy level (1-5) */
  energyLevel: 1 | 2 | 3 | 4 | 5;
  /** Stress level (1-5, 1 = low stress) */
  stressLevel: 1 | 2 | 3 | 4 | 5;
}

/** Daily summary for history view */
export interface DailySummary {
  /** Date string (YYYY-MM-DD) */
  date: string;
  /** Average composite score */
  avgScore: number;
  /** Number of sessions completed */
  sessionCount: number;
  /** Best score of the day */
  bestScore: number;
  /** Streak count as of this day */
  streakCount: number;
}

/** User difficulty profile for adaptive system */
export interface DifficultyProfile {
  /** Per-game difficulty levels */
  gameLevels: Record<string, DifficultyLevel>;
  /** Last updated timestamp */
  updatedAt: string;
}
