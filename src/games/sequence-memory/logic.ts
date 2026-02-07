import type { DifficultyLevel } from '@/games/types';
import type { SequenceRound } from './types';
import { DIFFICULTY_CONFIG } from './types';

/** Generate a sequence round with the given length and grid size */
export function generateRound(
  gridSize: number,
  sequenceLength: number,
): SequenceRound {
  const totalTiles = gridSize * gridSize;
  const sequence: number[] = [];

  for (let i = 0; i < sequenceLength; i++) {
    // Allow repeats, but avoid same tile twice in a row
    let next: number;
    do {
      next = Math.floor(Math.random() * totalTiles);
    } while (sequence.length > 0 && sequence[sequence.length - 1] === next);
    sequence.push(next);
  }

  return { sequence, gridSize };
}

/** Verify if user's sequence matches the target */
export function checkSequence(
  target: number[],
  userInput: number[],
): { correct: boolean; failedAt: number } {
  for (let i = 0; i < userInput.length; i++) {
    if (userInput[i] !== target[i]) {
      return { correct: false, failedAt: i };
    }
  }
  return { correct: true, failedAt: -1 };
}

export function getConfig(difficulty: DifficultyLevel) {
  return DIFFICULTY_CONFIG[difficulty];
}
