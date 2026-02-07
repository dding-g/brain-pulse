import type { DifficultyLevel } from '@/games/types';
import type { ColorDef, StroopRound } from './types';
import { DIFFICULTY_CONFIG } from './types';

const ALL_COLORS: ColorDef[] = [
  { name: 'RED', nameKo: '빨강', hex: '#F44336' },
  { name: 'BLUE', nameKo: '파랑', hex: '#2196F3' },
  { name: 'GREEN', nameKo: '초록', hex: '#4CAF50' },
  { name: 'YELLOW', nameKo: '노랑', hex: '#FFEB3B' },
  { name: 'PURPLE', nameKo: '보라', hex: '#9C27B0' },
  { name: 'ORANGE', nameKo: '주황', hex: '#FF9800' },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Generate a pool of stroop rounds */
export function generateRounds(
  difficulty: DifficultyLevel,
  count: number,
): StroopRound[] {
  const config = DIFFICULTY_CONFIG[difficulty];
  const colorPool = ALL_COLORS.slice(0, config.numColors);
  const rounds: StroopRound[] = [];

  for (let i = 0; i < count; i++) {
    const isCongruent = Math.random() < config.congruentRatio;
    const wordColor = pickRandom(colorPool);

    let inkColor: ColorDef;
    if (isCongruent) {
      inkColor = wordColor;
    } else {
      const others = colorPool.filter((c) => c.name !== wordColor.name);
      inkColor = pickRandom(others);
    }

    // Build 4 options: always include the correct answer (inkColor)
    const distractors = colorPool
      .filter((c) => c.name !== inkColor.name);
    const options = shuffle([inkColor, ...shuffle(distractors).slice(0, 3)]);

    rounds.push({
      word: wordColor.name,
      wordKo: wordColor.nameKo,
      inkColor,
      wordColor,
      isCongruent,
      options,
    });
  }

  return rounds;
}

export function getConfig(difficulty: DifficultyLevel) {
  return DIFFICULTY_CONFIG[difficulty];
}
