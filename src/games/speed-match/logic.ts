import { Colors } from '@/constants/theme';
import type { DifficultyLevel } from '@/games/types';
import type { Shape, SpeedMatchRound } from './types';
import { DIFFICULTY_CONFIG } from './types';

const ALL_SHAPES: Shape[] = [
  'circle', 'square', 'triangle', 'star', 'diamond', 'hexagon',
  'cross', 'heart', 'pentagon', 'octagon', 'arrow', 'moon',
];

const SHAPE_COLORS = [
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

/** Generate a pool of rounds for the entire game session */
export function generateRounds(
  difficulty: DifficultyLevel,
  count: number,
): SpeedMatchRound[] {
  const config = DIFFICULTY_CONFIG[difficulty];
  const shapePool = ALL_SHAPES.slice(0, config.numShapes);
  const rounds: SpeedMatchRound[] = [];

  // First round - no match comparison
  const firstShape = pickRandom(shapePool);
  rounds.push({
    shape: firstShape,
    color: pickRandom(SHAPE_COLORS),
    isMatch: false,
    isFirst: true,
  });

  for (let i = 1; i < count; i++) {
    const prevShape = rounds[i - 1].shape;
    const shouldMatch = Math.random() < config.matchRatio;

    let shape: Shape;
    if (shouldMatch) {
      shape = prevShape;
    } else {
      const others = shapePool.filter((s) => s !== prevShape);
      shape = pickRandom(others);
    }

    rounds.push({
      shape,
      color: pickRandom(SHAPE_COLORS),
      isMatch: shouldMatch,
      isFirst: false,
    });
  }

  return rounds;
}

export function getConfig(difficulty: DifficultyLevel) {
  return DIFFICULTY_CONFIG[difficulty];
}
