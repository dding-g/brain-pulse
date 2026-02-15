import { Colors } from '@/constants/theme';
import type { DifficultyLevel } from '@/games/types';
import type { NBackRound } from './types';
import { DIFFICULTY_CONFIG, GRID_CELLS } from './types';

const SYMBOLS = ['🧠', '⚡', '💡', '🔮', '✨', '🌟', '💫', '🎯', '🧩'];

const STIMULUS_COLORS = [
  Colors.primary,
  Colors.secondary,
  Colors.success,
  Colors.info,
  Colors.warning,
  Colors.scoreFire,
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPosition(): number {
  return Math.floor(Math.random() * GRID_CELLS);
}

function randomPositionExcluding(exclude: number): number {
  let pos: number;
  do {
    pos = Math.floor(Math.random() * GRID_CELLS);
  } while (pos === exclude);
  return pos;
}

export function generateRounds(
  difficulty: DifficultyLevel,
  countOverride?: number,
): NBackRound[] {
  const config = DIFFICULTY_CONFIG[difficulty];
  const count = countOverride ?? config.roundCount;
  const { nValue, matchRatio } = config;
  const rounds: NBackRound[] = [];

  for (let i = 0; i < count; i++) {
    if (i < nValue) {
      rounds.push({
        position: randomPosition(),
        symbol: pickRandom(SYMBOLS),
        color: pickRandom(STIMULUS_COLORS),
        isMatch: false,
        index: i,
      });
      continue;
    }

    const shouldMatch = Math.random() < matchRatio;
    const nBackPosition = rounds[i - nValue].position;

    const position = shouldMatch
      ? nBackPosition
      : randomPositionExcluding(nBackPosition);

    rounds.push({
      position,
      symbol: pickRandom(SYMBOLS),
      color: pickRandom(STIMULUS_COLORS),
      isMatch: shouldMatch,
      index: i,
    });
  }

  return rounds;
}

export function getConfig(difficulty: DifficultyLevel) {
  return DIFFICULTY_CONFIG[difficulty];
}
