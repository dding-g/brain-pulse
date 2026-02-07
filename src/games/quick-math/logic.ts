import type { DifficultyLevel } from '@/games/types';
import type { MathOperator, MathProblem } from './types';
import { DIFFICULTY_CONFIG } from './types';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function maxForDigits(digits: number): number {
  return Math.pow(10, digits) - 1;
}

function generatePair(
  operator: MathOperator,
  maxDigits: number,
): { a: number; b: number; answer: number } {
  const max = maxForDigits(maxDigits);

  switch (operator) {
    case '+': {
      const a = randInt(1, max);
      const b = randInt(1, max);
      return { a, b, answer: a + b };
    }
    case '-': {
      // Ensure a >= b so no negative results
      const a = randInt(1, max);
      const b = randInt(1, a);
      return { a, b, answer: a - b };
    }
    case '×': {
      // Keep multiplications reasonable
      const capA = Math.min(max, maxDigits <= 1 ? 9 : 20);
      const capB = Math.min(max, maxDigits <= 1 ? 9 : 12);
      const a = randInt(2, capA);
      const b = randInt(2, capB);
      return { a, b, answer: a * b };
    }
    case '÷': {
      // Generate as b * answer = a, so no remainders
      const capAnswer = Math.min(max, maxDigits <= 1 ? 9 : 15);
      const answer = randInt(2, capAnswer);
      const b = randInt(2, Math.min(12, max));
      const a = answer * b;
      return { a, b, answer };
    }
  }
}

function generateDistractors(answer: number, count: number): number[] {
  const distractors = new Set<number>();
  const range = Math.max(5, Math.ceil(answer * 0.2));

  while (distractors.size < count) {
    const offset = randInt(1, range) * (Math.random() > 0.5 ? 1 : -1);
    const val = answer + offset;
    if (val !== answer && val >= 0 && !distractors.has(val)) {
      distractors.add(val);
    }
  }

  return Array.from(distractors);
}

/** Generate a single math problem */
export function generateProblem(difficulty: DifficultyLevel): MathProblem {
  const config = DIFFICULTY_CONFIG[difficulty];
  const operator = config.operators[
    Math.floor(Math.random() * config.operators.length)
  ];

  const { a, b, answer } = generatePair(operator, config.maxDigits);
  const distractors = generateDistractors(answer, 3);
  const choices = shuffle([answer, ...distractors]);

  return {
    a,
    b,
    operator,
    answer,
    display: `${a} ${operator} ${b} = ?`,
    choices,
  };
}

/** Generate a pool of problems */
export function generateProblems(
  difficulty: DifficultyLevel,
  count: number,
): MathProblem[] {
  return Array.from({ length: count }, () => generateProblem(difficulty));
}

export function getConfig(difficulty: DifficultyLevel) {
  return DIFFICULTY_CONFIG[difficulty];
}
