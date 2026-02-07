import type { DifficultyLevel } from '@/games/types';

export type MathOperator = '+' | '-' | '×' | '÷';

export interface MathProblem {
  /** Left operand */
  a: number;
  /** Right operand */
  b: number;
  /** Operator */
  operator: MathOperator;
  /** Correct answer */
  answer: number;
  /** Display string, e.g. "7 + 3 = ?" */
  display: string;
  /** 4 answer choices (shuffled, includes correct) */
  choices: number[];
}

export interface MathConfig {
  /** Maximum number of digits per operand */
  maxDigits: number;
  /** Available operators */
  operators: MathOperator[];
  /** Time per problem in ms */
  timePerProblemMs: number;
}

export const DIFFICULTY_CONFIG: Record<DifficultyLevel, MathConfig> = {
  1: { maxDigits: 1, operators: ['+', '-'], timePerProblemMs: 5000 },
  2: { maxDigits: 1, operators: ['+', '-', '×'], timePerProblemMs: 4000 },
  3: { maxDigits: 2, operators: ['+', '-', '×'], timePerProblemMs: 3500 },
  4: { maxDigits: 2, operators: ['+', '-', '×', '÷'], timePerProblemMs: 2500 },
  5: { maxDigits: 3, operators: ['+', '-', '×', '÷'], timePerProblemMs: 2000 },
};
